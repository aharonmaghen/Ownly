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

  initialize():                                                 Promise<void>;
  signUp(email: string, password: string, inviteCode?: string): Promise<void>;
  signIn(email: string, password: string):                      Promise<void>;
  signOut():                                                    Promise<void>;
  updateHouseholdName(name: string):                            Promise<void>;
  clearError():                                                 void;
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

    // Only sync auth tokens here — household is managed by each explicit action
    // to avoid racing with signUp / signIn which set household themselves.
    supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        set({ session: null, user: null, household: null });
      }
      // session updates (token refresh etc.) are handled; household stays as-is
    });
  },

  signUp: async (email, password, inviteCode) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: 'https://ownly-sable.vercel.app/' },
      });
      if (error) throw error;
      if (!data.user) throw new Error('Sign up failed');

      // complete_household_signup is SECURITY DEFINER so it works even when
      // data.session is null (email-confirmation enabled) and bypasses RLS.
      const { data: hhRaw, error: hhErr } = await supabase.rpc(
        'complete_household_signup',
        { p_invite_code: inviteCode ?? null },
      );

      if (hhErr) {
        set({
          loading: false,
          error: hhErr.message.includes('Invalid invite code')
            ? 'Invalid invite code'
            : hhErr.message ?? 'Sign up failed',
        });
        return;
      }

      set({
        session:   data.session,
        user:      data.user,
        household: { id: hhRaw.id, name: hhRaw.name, inviteCode: hhRaw.invite_code },
        loading:   false,
      });
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

  updateHouseholdName: async (name: string) => {
    const { household } = get();
    if (!household) return;
    const { error } = await supabase
      .from('households')
      .update({ name })
      .eq('id', household.id);
    if (!error) {
      set({ household: { ...household, name } });
    }
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
