// ─── Budget Category ─────────────────────────────────────────────────────────

export interface BudgetCategory {
  id: string;
  name: string;
  monthlyLimit: number;
  icon: string;
  color: string;
  createdAt: string;
}

// ─── Envelope (savings goal) ──────────────────────────────────────────────────

export interface Envelope {
  id: string;
  name: string;
  balance: number;
  targetAmount?: number;
  icon: string;
  color: string;
  createdAt: string;
}

// ─── Transaction ─────────────────────────────────────────────────────────────

export type TransactionType =
  | 'income'
  | 'expense'
  | 'envelope_deposit'
  | 'envelope_withdrawal'
  | 'adjustment';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  note: string;
  categoryId?: string;           // expense only
  envelopeId?: string;           // envelope_deposit / envelope_withdrawal
  isNegativeAdjustment?: boolean; // adjustment: true = subtract, false = add
  timestamp: string;
  createdAt: string;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export type Language = 'en' | 'he';
export type Currency = 'USD' | 'ILS' | 'EUR' | 'GBP';

export interface Settings {
  language: Language;
  currency: Currency;
  currencySymbol: string;
  isRTL: boolean;
}

// ─── CFS Summary ─────────────────────────────────────────────────────────────

export interface CFSSummary {
  cfs: number;
  totalIncome: number;
  totalExpenses: number;
  totalEnvelopeBalances: number;
  monthlySpending: number;
}
