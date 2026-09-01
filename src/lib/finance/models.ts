// Frontend-owned finance domain models.
// Shaped around the concepts exposed by the BudgetBakers Wallet REST API
// (records, accounts, categories, budgets, savings goals, standing orders,
// labels) but deliberately independent of any network transport.

export type ISODate = string; // "2026-08-31"
export type ISODateTime = string; // "2026-08-31T09:00:00.000Z"

export type CurrencyCode = "USD" | "EUR" | "COP" | "GBP";

/** Money is never a bare number: value + currency travel together. */
export interface Money {
  value: number;
  currencyCode: CurrencyCode;
}

export type RecordType = "expense" | "income" | "transfer";

export type PaymentType =
  | "cash"
  | "debit-card"
  | "credit-card"
  | "bank-transfer"
  | "mobile-payment"
  | "voucher";

export type AccountType = "checking" | "savings" | "credit-card" | "cash" | "investment";

export interface FinancialAccount {
  id: string;
  name: string;
  type: AccountType;
  currencyCode: CurrencyCode;
  balance: Money;
  /** Wallet exposes excluded/archived accounts; keep the flag in the model. */
  excludeFromStats?: boolean;
}

export interface FinancialCategory {
  id: string;
  name: string;
  /** Wallet groups categories; kept for future parity. */
  group: "essentials" | "lifestyle" | "obligations" | "income" | "transfers";
  /** CSS custom property used for the category indicator. */
  colorVar: string;
}

export interface FinancialLabel {
  id: string;
  name: string;
}

export interface FinancialRecord {
  id: string;
  type: RecordType;
  /** Signed in the account currency: negative for expenses. */
  amount: Money;
  date: ISODate;
  counterparty: string;
  categoryId: string;
  accountId: string;
  paymentType: PaymentType;
  labelIds: string[];
  note?: string;
  /** Wallet marks records created by a standing order / record rule. */
  standingOrderId?: string;
  transferAccountId?: string;
}

export interface FinancialBudget {
  id: string;
  categoryId: string;
  limit: Money;
  period: "monthly";
}

export interface FinancialGoal {
  id: string;
  name: string;
  saved: Money;
  target: Money;
  targetDate: ISODate | null;
  accountId?: string;
}

export type RecurrenceFrequency = "weekly" | "monthly" | "quarterly" | "yearly";

export interface StandingOrder {
  id: string;
  name: string;
  amount: Money;
  type: Exclude<RecordType, "transfer">;
  frequency: RecurrenceFrequency;
  nextDate: ISODate;
  accountId: string;
  categoryId: string;
  paymentType: PaymentType;
}

export type SyncState = "synced" | "syncing" | "initial-sync" | "stale" | "unavailable";

export interface SyncStatus {
  state: SyncState;
  lastSyncedAt: ISODateTime | null;
  message?: string;
}

/** Wallet-style filters. Everything optional; the adapter maps them to query params. */
export interface RecordFilters {
  search?: string;
  from?: ISODate;
  to?: ISODate;
  accountId?: string;
  categoryId?: string;
  type?: RecordType;
  paymentType?: PaymentType;
  labelId?: string;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export type NewRecordInput = Omit<FinancialRecord, "id">;

export const PAYMENT_TYPE_LABEL: Record<PaymentType, string> = {
  cash: "Cash",
  "debit-card": "Debit card",
  "credit-card": "Credit card",
  "bank-transfer": "Bank transfer",
  "mobile-payment": "Mobile payment",
  voucher: "Voucher",
};

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  checking: "Checking",
  savings: "Savings",
  "credit-card": "Credit card",
  cash: "Cash",
  investment: "Investment",
};

export const RECORD_TYPE_LABEL: Record<RecordType, string> = {
  expense: "Expense",
  income: "Income",
  transfer: "Transfer",
};

export const FREQUENCY_LABEL: Record<RecurrenceFrequency, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};
