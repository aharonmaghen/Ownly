import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Household {
  id: string;
  name: string;
  inviteCode: string;
}

interface AuthStore {
  session:    Session | null;
  user:       User | null;
  household:  Household | null;
  loading:    boolean;
  error:      string | null;

  initialize():                                       Promise<void>;
  signUp(email: string, password: string, inviteCode?: string): Promise<void>;
  signIn(email: string, password: string):            Promise<void>;
  signOut():                                          Promise<void>;
  clearError():                                       void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  session:   null,
  user:      null,
  household: null,
  loading:   true,
  error:     null,

  initialize: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const household = await fetchHousehold();
        set({ session, user: session.user, household, loading: false });
      } else {
        set({ session: null, user: null, household: null, loading: false });
      }
    } catch {
      set({ loading: false });
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const household = await fetchHousehold();
        set({ session, user: session.user, household });
      } else {
        set({ session: null, user: null, household: null });
      }
    });
  },

  signUp: async (email, password, inviteCode) => {
    set({ loading: true, error: null });
    try {
      // Validate invite code before creating the auth user so an invalid code
      // never results in an orphaned account.
      let householdToJoin: { id: string; name: string; invite_code: string } | null = null;
      if (inviteCode) {
        const { data: rows, error: hhErr } = await supabase
          .rpc('get_household_by_invite_code', { code: inviteCode });
        const hh = rows?.[0] ?? null;
        if (hhErr || !hh) {
          set({ loading: false, error: 'Invalid invite code' });
          return;
        }
        householdToJoin = hh;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: 'https://ownly-sable.vercel.app/' },
      });
      if (error) throw error;
      if (!data.user) throw new Error('Sign up failed');

      if (householdToJoin) {
        const { error: joinErr } = await supabase
          .from('household_members')
          .insert({ household_id: householdToJoin.id, user_id: data.user.id, role: 'member' });
        if (joinErr) throw joinErr;

        set({
          session:   data.session,
          user:      data.user,
          household: { id: householdToJoin.id, name: householdToJoin.name, inviteCode: householdToJoin.invite_code },
          loading:   false,
        });
      } else {
        // Create new household
        const { data: hh, error: hhErr } = await supabase
          .from('households')
          .insert({ name: 'My Household' })
          .select()
          .single();
        if (hhErr || !hh) throw hhErr ?? new Error('Failed to create household');

        const { error: memberErr } = await supabase
          .from('household_members')
          .insert({ household_id: hh.id, user_id: data.user.id, role: 'owner' });
        if (memberErr) throw memberErr;

        set({
          session:   data.session,
          user:      data.user,
          household: { id: hh.id, name: hh.name, inviteCode: hh.invite_code },
          loading:   false,
        });
      }
    } catch (e: any) {
      set({ loading: false, error: e.message ?? 'Sign up failed' });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const household = await fetchHousehold();
      set({ session: data.session, user: data.user, household, loading: false });
    } catch (e: any) {
      set({ loading: false, error: e.message ?? 'Sign in failed' });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, household: null });
  },

  clearError: () => set({ error: null }),
}));

async function fetchHousehold(): Promise<Household | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single();
  if (!member) return null;

  const { data: hh } = await supabase
    .from('households')
    .select('id, name, invite_code')
    .eq('id', member.household_id)
    .single();
  if (!hh) return null;

  return { id: hh.id, name: hh.name, inviteCode: hh.invite_code };
}
