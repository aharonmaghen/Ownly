// ─── Account ─────────────────────────────────────────────────────────────────

export type AccountType = 'asset' | 'liability';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  icon: string;         // Ionicons name
  color: string;        // hex color
  createdAt: string;    // ISO 8601
}

// ─── Envelope ────────────────────────────────────────────────────────────────

export interface Envelope {
  id: string;
  name: string;
  icon: string;
  color: string;
  budgetedAmount: number;   // user-set monthly limit
  allocatedAmount: number;  // money moved in from pool this period
  spentAmount: number;      // total debited this period
  createdAt: string;
}

export interface EnvelopeBalance {
  envelope: Envelope;
  remaining: number;        // allocatedAmount - spentAmount
  percentUsed: number;      // 0-100
}

// ─── Transaction ─────────────────────────────────────────────────────────────

export type TransactionType = 'expense' | 'income' | 'allocation';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;           // always positive; direction implied by type
  accountId: string;        // required for expense/income; source for allocation
  envelopeId?: string;      // required for expense & allocation
  notes: string;
  timestamp: string;        // ISO 8601, user-editable
  createdAt: string;        // immutable creation time
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

// ─── Derived / Aggregates ─────────────────────────────────────────────────────

export interface FinancialSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlySpending: number;
  monthlyIncome: number;
  unallocatedPool: number;
}
