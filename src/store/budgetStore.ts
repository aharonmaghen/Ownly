import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { BudgetCategory, CFSSummary, Envelope, Transaction } from '../types';
import { generateId } from '../utils/uuid';
import { isCurrentMonth, now } from '../utils/date';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ─── DB row → domain type mappers ────────────────────────────────────────────

function toCategory(row: any): BudgetCategory {
  return {
    id:           row.id,
    name:         row.name,
    monthlyLimit: Number(row.monthly_limit),
    icon:         row.icon,
    color:        row.color,
    createdAt:    row.created_at,
  };
}

function toEnvelope(row: any): Envelope {
  return {
    id:           row.id,
    name:         row.name,
    balance:      Number(row.balance),
    targetAmount: row.target_amount != null ? Number(row.target_amount) : undefined,
    icon:         row.icon,
    color:        row.color,
    createdAt:    row.created_at,
  };
}

function toTransaction(row: any): Transaction {
  return {
    id:                   row.id,
    type:                 row.type,
    amount:               Number(row.amount),
    note:                 row.note ?? '',
    categoryId:           row.category_id  ?? undefined,
    envelopeId:           row.envelope_id  ?? undefined,
    isNegativeAdjustment: row.is_negative_adjustment ?? undefined,
    timestamp:            row.timestamp,
    createdAt:            row.created_at,
  };
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface BudgetStore {
  categories:   BudgetCategory[];
  envelopes:    Envelope[];
  transactions: Transaction[];
  loading:      boolean;
  householdId:  string | null;

  initialize(householdId: string): Promise<void>;
  cleanup():                       void;

  addCategory(data: Omit<BudgetCategory, 'id' | 'createdAt'>): Promise<void>;
  updateCategory(id: string, data: Partial<Pick<BudgetCategory, 'name' | 'monthlyLimit' | 'icon' | 'color'>>): Promise<void>;
  deleteCategory(id: string): Promise<void>;

  addEnvelope(data: Omit<Envelope, 'id' | 'balance' | 'createdAt'>): Promise<void>;
  deleteEnvelope(id: string): Promise<void>;
  depositToEnvelope(params: { envelopeId: string; amount: number; note?: string }): Promise<void>;
  withdrawFromEnvelope(params: { envelopeId: string; amount: number; note?: string }): Promise<void>;

  addIncome(params: { amount: number; note: string; timestamp?: string }): Promise<void>;
  addExpense(params: { amount: number; categoryId: string; note?: string; timestamp?: string }): Promise<void>;
  addAdjustment(params: { amount: number; isNegative: boolean; note: string; timestamp?: string }): Promise<void>;
  deleteTransaction(id: string): Promise<void>;

  resetAll(): Promise<void>;

  getCFSSummary():                CFSSummary;
  getMonthlySpentByCategory():    Record<string, number>;
  getRecentTransactions(n?: number): Transaction[];
  getCategoryById(id: string):   BudgetCategory | undefined;
  getEnvelopeById(id: string):   Envelope | undefined;
}

// ─── Realtime channel ref (outside store to avoid serialisation) ──────────────
let _channel: RealtimeChannel | null = null;

// ─── Store ────────────────────────────────────────────────────────────────────

export const useBudgetStore = create<BudgetStore>()((set, get) => ({
  categories:   [],
  envelopes:    [],
  transactions: [],
  loading:      false,
  householdId:  null,

  // ── Bootstrap ───────────────────────────────────────────────────────────────

  initialize: async (householdId) => {
    set({ loading: true, householdId });

    const [catsRes, envsRes, txsRes] = await Promise.all([
      supabase.from('categories').select('*').eq('household_id', householdId).order('created_at'),
      supabase.from('envelopes').select('*').eq('household_id', householdId).order('created_at'),
      supabase.from('transactions').select('*').eq('household_id', householdId).order('timestamp', { ascending: false }),
    ]);

    set({
      categories:   (catsRes.data ?? []).map(toCategory),
      envelopes:    (envsRes.data ?? []).map(toEnvelope),
      transactions: (txsRes.data  ?? []).map(toTransaction),
      loading:      false,
    });

    // Real-time subscriptions
    if (_channel) supabase.removeChannel(_channel);
    _channel = supabase
      .channel(`household:${householdId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'categories', filter: `household_id=eq.${householdId}` }, ({ new: row }) => {
        const cat = toCategory(row);
        set((s) => s.categories.some((c) => c.id === cat.id) ? s : { categories: [...s.categories, cat] });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'categories', filter: `household_id=eq.${householdId}` }, ({ new: row }) => {
        const cat = toCategory(row);
        set((s) => ({ categories: s.categories.map((c) => c.id === cat.id ? cat : c) }));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'categories', filter: `household_id=eq.${householdId}` }, ({ old }) => {
        set((s) => ({ categories: s.categories.filter((c) => c.id !== old.id) }));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'envelopes', filter: `household_id=eq.${householdId}` }, ({ new: row }) => {
        const env = toEnvelope(row);
        set((s) => s.envelopes.some((e) => e.id === env.id) ? s : { envelopes: [...s.envelopes, env] });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'envelopes', filter: `household_id=eq.${householdId}` }, ({ new: row }) => {
        const env = toEnvelope(row);
        set((s) => ({ envelopes: s.envelopes.map((e) => e.id === env.id ? env : e) }));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'envelopes', filter: `household_id=eq.${householdId}` }, ({ old }) => {
        set((s) => ({ envelopes: s.envelopes.filter((e) => e.id !== old.id) }));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions', filter: `household_id=eq.${householdId}` }, ({ new: row }) => {
        const tx = toTransaction(row);
        set((s) => s.transactions.some((t) => t.id === tx.id) ? s : { transactions: [tx, ...s.transactions] });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'transactions', filter: `household_id=eq.${householdId}` }, ({ old }) => {
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== old.id) }));
      })
      .subscribe();
  },

  cleanup: () => {
    if (_channel) { supabase.removeChannel(_channel); _channel = null; }
    set({ categories: [], envelopes: [], transactions: [], householdId: null });
  },

  // ── Categories ───────────────────────────────────────────────────────────────

  addCategory: async (data) => {
    const { householdId } = get();
    if (!householdId) return;
    const id = generateId();
    const optimistic: BudgetCategory = { ...data, id, createdAt: now() };
    set((s) => ({ categories: [...s.categories, optimistic] }));
    const { error } = await supabase.from('categories').insert({
      id, household_id: householdId,
      name: data.name, monthly_limit: data.monthlyLimit,
      icon: data.icon, color: data.color,
    });
    if (error) set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
  },

  updateCategory: async (id, data) => {
    const prev = get().categories.find((c) => c.id === id);
    set((s) => ({ categories: s.categories.map((c) => c.id === id ? { ...c, ...data } : c) }));
    const patch: Record<string, any> = {};
    if (data.name         != null) patch.name          = data.name;
    if (data.monthlyLimit != null) patch.monthly_limit = data.monthlyLimit;
    if (data.icon         != null) patch.icon          = data.icon;
    if (data.color        != null) patch.color         = data.color;
    const { error } = await supabase.from('categories').update(patch).eq('id', id);
    if (error && prev) set((s) => ({ categories: s.categories.map((c) => c.id === id ? prev : c) }));
  },

  deleteCategory: async (id) => {
    const prev = get().categories.find((c) => c.id === id);
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error && prev) set((s) => ({ categories: [...s.categories, prev] }));
  },

  // ── Envelopes ────────────────────────────────────────────────────────────────

  addEnvelope: async (data) => {
    const { householdId } = get();
    if (!householdId) return;
    const id = generateId();
    const optimistic: Envelope = { ...data, id, balance: 0, createdAt: now() };
    set((s) => ({ envelopes: [...s.envelopes, optimistic] }));
    const { error } = await supabase.from('envelopes').insert({
      id, household_id: householdId,
      name: data.name, balance: 0,
      target_amount: data.targetAmount ?? null,
      icon: data.icon, color: data.color,
    });
    if (error) set((s) => ({ envelopes: s.envelopes.filter((e) => e.id !== id) }));
  },

  deleteEnvelope: async (id) => {
    const prev = get().envelopes.find((e) => e.id === id);
    set((s) => ({ envelopes: s.envelopes.filter((e) => e.id !== id) }));
    const { error } = await supabase.from('envelopes').delete().eq('id', id);
    if (error && prev) set((s) => ({ envelopes: [...s.envelopes, prev] }));
  },

  depositToEnvelope: async ({ envelopeId, amount, note = '' }) => {
    const { householdId } = get();
    if (!householdId) return;
    const txId = generateId();
    const ts   = now();
    // Optimistic
    set((s) => ({
      transactions: [{ id: txId, type: 'envelope_deposit', amount, note, envelopeId, timestamp: ts, createdAt: ts }, ...s.transactions],
      envelopes:    s.envelopes.map((e) => e.id === envelopeId ? { ...e, balance: e.balance + amount } : e),
    }));
    const envelope = get().envelopes.find((e) => e.id === envelopeId);
    const [txRes, envRes] = await Promise.all([
      supabase.from('transactions').insert({
        id: txId, household_id: householdId, type: 'envelope_deposit',
        amount, note, envelope_id: envelopeId, timestamp: ts,
      }),
      envelope
        ? supabase.from('envelopes').update({ balance: envelope.balance }).eq('id', envelopeId)
        : Promise.resolve({ error: null }),
    ]);
    if (txRes.error) {
      set((s) => ({
        transactions: s.transactions.filter((t) => t.id !== txId),
        envelopes:    s.envelopes.map((e) => e.id === envelopeId ? { ...e, balance: Math.max(0, e.balance - amount) } : e),
      }));
    }
  },

  withdrawFromEnvelope: async ({ envelopeId, amount, note = '' }) => {
    const { householdId } = get();
    if (!householdId) return;
    const txId = generateId();
    const ts   = now();
    set((s) => ({
      transactions: [{ id: txId, type: 'envelope_withdrawal', amount, note, envelopeId, timestamp: ts, createdAt: ts }, ...s.transactions],
      envelopes:    s.envelopes.map((e) => e.id === envelopeId ? { ...e, balance: Math.max(0, e.balance - amount) } : e),
    }));
    const envelope = get().envelopes.find((e) => e.id === envelopeId);
    const [txRes] = await Promise.all([
      supabase.from('transactions').insert({
        id: txId, household_id: householdId, type: 'envelope_withdrawal',
        amount, note, envelope_id: envelopeId, timestamp: ts,
      }),
      envelope
        ? supabase.from('envelopes').update({ balance: envelope.balance }).eq('id', envelopeId)
        : Promise.resolve({ error: null }),
    ]);
    if (txRes.error) {
      set((s) => ({
        transactions: s.transactions.filter((t) => t.id !== txId),
        envelopes:    s.envelopes.map((e) => e.id === envelopeId ? { ...e, balance: e.balance + amount } : e),
      }));
    }
  },

  // ── Simple transactions ───────────────────────────────────────────────────────

  addIncome: async ({ amount, note, timestamp }) => {
    const { householdId } = get();
    if (!householdId) return;
    const id = generateId();
    const ts = timestamp ?? now();
    const tx: Transaction = { id, type: 'income', amount, note, timestamp: ts, createdAt: ts };
    set((s) => ({ transactions: [tx, ...s.transactions] }));
    const { error } = await supabase.from('transactions').insert({
      id, household_id: householdId, type: 'income', amount, note, timestamp: ts,
    });
    if (error) set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
  },

  addExpense: async ({ amount, categoryId, note = '', timestamp }) => {
    const { householdId } = get();
    if (!householdId) return;
    const id = generateId();
    const ts = timestamp ?? now();
    const tx: Transaction = { id, type: 'expense', amount, note, categoryId, timestamp: ts, createdAt: ts };
    set((s) => ({ transactions: [tx, ...s.transactions] }));
    const { error } = await supabase.from('transactions').insert({
      id, household_id: householdId, type: 'expense', amount, note, category_id: categoryId, timestamp: ts,
    });
    if (error) set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
  },

  addAdjustment: async ({ amount, isNegative, note, timestamp }) => {
    const { householdId } = get();
    if (!householdId) return;
    const id = generateId();
    const ts = timestamp ?? now();
    const tx: Transaction = { id, type: 'adjustment', amount, note, isNegativeAdjustment: isNegative, timestamp: ts, createdAt: ts };
    set((s) => ({ transactions: [tx, ...s.transactions] }));
    const { error } = await supabase.from('transactions').insert({
      id, household_id: householdId, type: 'adjustment', amount, note,
      is_negative_adjustment: isNegative, timestamp: ts,
    });
    if (error) set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
  },

  deleteTransaction: async (id) => {
    const { transactions, envelopes } = get();
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;

    let envelopesPatch = envelopes;
    if (tx.type === 'envelope_deposit' && tx.envelopeId) {
      envelopesPatch = envelopes.map((e) => e.id === tx.envelopeId ? { ...e, balance: Math.max(0, e.balance - tx.amount) } : e);
    } else if (tx.type === 'envelope_withdrawal' && tx.envelopeId) {
      envelopesPatch = envelopes.map((e) => e.id === tx.envelopeId ? { ...e, balance: e.balance + tx.amount } : e);
    }

    set({ transactions: transactions.filter((t) => t.id !== id), envelopes: envelopesPatch });

    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) set({ transactions, envelopes });

    // Sync envelope balance to DB if it changed
    if (tx.envelopeId && envelopesPatch !== envelopes) {
      const updated = envelopesPatch.find((e) => e.id === tx.envelopeId);
      if (updated) await supabase.from('envelopes').update({ balance: updated.balance }).eq('id', updated.id);
    }
  },

  // ── Reset ─────────────────────────────────────────────────────────────────────

  resetAll: async () => {
    const { householdId } = get();
    if (!householdId) return;
    set({ categories: [], envelopes: [], transactions: [] });
    await Promise.all([
      supabase.from('transactions').delete().eq('household_id', householdId),
      supabase.from('envelopes').delete().eq('household_id', householdId),
      supabase.from('categories').delete().eq('household_id', householdId),
    ]);
  },

  // ── Selectors ─────────────────────────────────────────────────────────────────

  getCFSSummary: () => {
    const { transactions, envelopes } = get();
    const totalIncome  = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpenses= transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const totalEnvelopeBalances = envelopes.reduce((s, e) => s + e.balance, 0);
    const adjustments  = transactions.filter((t) => t.type === 'adjustment').reduce((s, t) => s + (t.isNegativeAdjustment ? -t.amount : t.amount), 0);
    const monthlySpending = transactions.filter((t) => t.type === 'expense' && isCurrentMonth(t.timestamp)).reduce((s, t) => s + t.amount, 0);
    return { cfs: totalIncome - totalExpenses - totalEnvelopeBalances + adjustments, totalIncome, totalExpenses, totalEnvelopeBalances, monthlySpending };
  },

  getMonthlySpentByCategory: () => {
    const result: Record<string, number> = {};
    get().transactions
      .filter((t) => t.type === 'expense' && isCurrentMonth(t.timestamp) && t.categoryId)
      .forEach((t) => { result[t.categoryId!] = (result[t.categoryId!] ?? 0) + t.amount; });
    return result;
  },

  getRecentTransactions: (limit = 10) =>
    get().transactions.slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit),

  getCategoryById: (id) => get().categories.find((c) => c.id === id),
  getEnvelopeById: (id) => get().envelopes.find((e) => e.id === id),
}));
