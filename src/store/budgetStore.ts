import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Account,
  AccountType,
  Envelope,
  EnvelopeBalance,
  FinancialSummary,
  Transaction,
  TransactionType,
} from '../types';
import { generateId } from '../utils/uuid';
import { isCurrentMonth, now } from '../utils/date';

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_ACCOUNTS: Account[] = [
  {
    id: 'acc-checking',
    name: 'Checking',
    type: 'asset',
    balance: 2500,
    icon: 'wallet-outline',
    color: '#0284c7',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc-savings',
    name: 'Savings',
    type: 'asset',
    balance: 8000,
    icon: 'save-outline',
    color: '#10b981',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc-cc',
    name: 'Credit Card',
    type: 'liability',
    balance: 1200,
    icon: 'card-outline',
    color: '#ef4444',
    createdAt: new Date().toISOString(),
  },
];

const SEED_ENVELOPES: Envelope[] = [
  {
    id: 'env-groceries',
    name: 'Groceries',
    icon: 'cart-outline',
    color: '#f59e0b',
    budgetedAmount: 400,
    allocatedAmount: 400,
    spentAmount: 120,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'env-rent',
    name: 'Rent',
    icon: 'home-outline',
    color: '#8b5cf6',
    budgetedAmount: 1500,
    allocatedAmount: 1500,
    spentAmount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'env-transport',
    name: 'Transport',
    icon: 'car-outline',
    color: '#0ea5e9',
    budgetedAmount: 200,
    allocatedAmount: 200,
    spentAmount: 45,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'env-dining',
    name: 'Dining Out',
    icon: 'restaurant-outline',
    color: '#ec4899',
    budgetedAmount: 150,
    allocatedAmount: 150,
    spentAmount: 88,
    createdAt: new Date().toISOString(),
  },
];

// ─── Store interface ──────────────────────────────────────────────────────────

interface BudgetStore {
  accounts: Account[];
  envelopes: Envelope[];
  transactions: Transaction[];
  unallocatedPool: number;

  // Accounts
  addAccount: (data: Omit<Account, 'id' | 'createdAt'>) => void;
  updateAccount: (id: string, data: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  // Envelopes
  addEnvelope: (data: Omit<Envelope, 'id' | 'allocatedAmount' | 'spentAmount' | 'createdAt'>) => void;
  updateEnvelope: (id: string, data: Partial<Envelope>) => void;
  deleteEnvelope: (id: string) => void;

  // Transactions
  addExpense: (params: {
    amount: number;
    accountId: string;
    envelopeId: string;
    notes: string;
    timestamp?: string;
  }) => void;

  addIncome: (params: {
    amount: number;
    accountId: string;
    notes: string;
    timestamp?: string;
  }) => void;

  allocateFunds: (params: {
    amount: number;
    envelopeId: string;
    notes?: string;
    timestamp?: string;
  }) => void;

  deleteTransaction: (id: string) => void;

  // Derived selectors (computed inline — no memoisation needed at this scale)
  getFinancialSummary: () => FinancialSummary;
  getEnvelopeBalances: () => EnvelopeBalance[];
  getRecentTransactions: (limit?: number) => Transaction[];
  getAccountById: (id: string) => Account | undefined;
  getEnvelopeById: (id: string) => Envelope | undefined;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set, get) => ({
      accounts: SEED_ACCOUNTS,
      envelopes: SEED_ENVELOPES,
      transactions: [],
      unallocatedPool: 253,   // seed: some money already in pool

      // ── Accounts ──────────────────────────────────────────────────────────

      addAccount: (data) => {
        const account: Account = {
          ...data,
          id: generateId(),
          createdAt: now(),
        };
        set((s) => ({ accounts: [...s.accounts, account] }));
      },

      updateAccount: (id, data) => {
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...data } : a)),
        }));
      },

      deleteAccount: (id) => {
        set((s) => ({
          accounts: s.accounts.filter((a) => a.id !== id),
        }));
      },

      // ── Envelopes ─────────────────────────────────────────────────────────

      addEnvelope: (data) => {
        const envelope: Envelope = {
          ...data,
          id: generateId(),
          allocatedAmount: 0,
          spentAmount: 0,
          createdAt: now(),
        };
        set((s) => ({ envelopes: [...s.envelopes, envelope] }));
      },

      updateEnvelope: (id, data) => {
        set((s) => ({
          envelopes: s.envelopes.map((e) => (e.id === id ? { ...e, ...data } : e)),
        }));
      },

      deleteEnvelope: (id) => {
        set((s) => ({
          envelopes: s.envelopes.filter((e) => e.id !== id),
        }));
      },

      // ── Expense ───────────────────────────────────────────────────────────

      addExpense: ({ amount, accountId, envelopeId, notes, timestamp }) => {
        const ts = timestamp ?? now();
        const tx: Transaction = {
          id: generateId(),
          type: 'expense',
          amount,
          accountId,
          envelopeId,
          notes,
          timestamp: ts,
          createdAt: now(),
        };
        set((s) => ({
          transactions: [tx, ...s.transactions],
          // Deduct from account balance
          accounts: s.accounts.map((a) =>
            a.id === accountId ? { ...a, balance: a.balance - amount } : a,
          ),
          // Debit from envelope spent
          envelopes: s.envelopes.map((e) =>
            e.id === envelopeId ? { ...e, spentAmount: e.spentAmount + amount } : e,
          ),
        }));
      },

      // ── Income ────────────────────────────────────────────────────────────

      addIncome: ({ amount, accountId, notes, timestamp }) => {
        const ts = timestamp ?? now();
        const tx: Transaction = {
          id: generateId(),
          type: 'income',
          amount,
          accountId,
          notes,
          timestamp: ts,
          createdAt: now(),
        };
        set((s) => ({
          transactions: [tx, ...s.transactions],
          // Credit asset account
          accounts: s.accounts.map((a) =>
            a.id === accountId ? { ...a, balance: a.balance + amount } : a,
          ),
          // Land in unallocated pool
          unallocatedPool: s.unallocatedPool + amount,
        }));
      },

      // ── Allocation ────────────────────────────────────────────────────────

      allocateFunds: ({ amount, envelopeId, notes = '', timestamp }) => {
        const { unallocatedPool } = get();
        if (amount > unallocatedPool) {
          throw new Error('insufficient_funds');
        }
        const ts = timestamp ?? now();
        const tx: Transaction = {
          id: generateId(),
          type: 'allocation',
          amount,
          accountId: '',    // pool-level, no specific account
          envelopeId,
          notes,
          timestamp: ts,
          createdAt: now(),
        };
        set((s) => ({
          transactions: [tx, ...s.transactions],
          unallocatedPool: s.unallocatedPool - amount,
          envelopes: s.envelopes.map((e) =>
            e.id === envelopeId
              ? { ...e, allocatedAmount: e.allocatedAmount + amount }
              : e,
          ),
        }));
      },

      // ── Delete transaction (reverse its effects) ──────────────────────────

      deleteTransaction: (id) => {
        const { transactions, accounts, envelopes, unallocatedPool } = get();
        const tx = transactions.find((t) => t.id === id);
        if (!tx) return;

        let nextAccounts = accounts;
        let nextEnvelopes = envelopes;
        let nextPool = unallocatedPool;

        if (tx.type === 'expense') {
          nextAccounts = accounts.map((a) =>
            a.id === tx.accountId ? { ...a, balance: a.balance + tx.amount } : a,
          );
          nextEnvelopes = envelopes.map((e) =>
            e.id === tx.envelopeId ? { ...e, spentAmount: e.spentAmount - tx.amount } : e,
          );
        } else if (tx.type === 'income') {
          nextAccounts = accounts.map((a) =>
            a.id === tx.accountId ? { ...a, balance: a.balance - tx.amount } : a,
          );
          nextPool = unallocatedPool - tx.amount;
        } else if (tx.type === 'allocation') {
          nextPool = unallocatedPool + tx.amount;
          nextEnvelopes = envelopes.map((e) =>
            e.id === tx.envelopeId
              ? { ...e, allocatedAmount: e.allocatedAmount - tx.amount }
              : e,
          );
        }

        set({
          transactions: transactions.filter((t) => t.id !== id),
          accounts: nextAccounts,
          envelopes: nextEnvelopes,
          unallocatedPool: nextPool,
        });
      },

      // ── Selectors ─────────────────────────────────────────────────────────

      getFinancialSummary: () => {
        const { accounts, transactions, unallocatedPool } = get();
        const totalAssets = accounts
          .filter((a) => a.type === 'asset')
          .reduce((sum, a) => sum + a.balance, 0);
        const totalLiabilities = accounts
          .filter((a) => a.type === 'liability')
          .reduce((sum, a) => sum + a.balance, 0);
        const monthlySpending = transactions
          .filter((t) => t.type === 'expense' && isCurrentMonth(t.timestamp))
          .reduce((sum, t) => sum + t.amount, 0);
        const monthlyIncome = transactions
          .filter((t) => t.type === 'income' && isCurrentMonth(t.timestamp))
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          totalAssets,
          totalLiabilities,
          netWorth: totalAssets - totalLiabilities,
          monthlySpending,
          monthlyIncome,
          unallocatedPool,
        };
      },

      getEnvelopeBalances: () => {
        const { envelopes } = get();
        return envelopes.map((e) => {
          const remaining = e.allocatedAmount - e.spentAmount;
          const percentUsed =
            e.allocatedAmount > 0
              ? Math.min(100, (e.spentAmount / e.allocatedAmount) * 100)
              : 0;
          return { envelope: e, remaining, percentUsed };
        });
      },

      getRecentTransactions: (limit = 10) => {
        return get()
          .transactions.slice()
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);
      },

      getAccountById: (id) => get().accounts.find((a) => a.id === id),
      getEnvelopeById: (id) => get().envelopes.find((e) => e.id === id),
    }),
    {
      name: 'ownly-budget',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
