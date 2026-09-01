// Deterministic finance demo data. Lives here, never inside components, so it can
// be deleted wholesale once a server-side Wallet adapter is connected.

import { addDays, addMonths, format, startOfMonth, subMonths } from "date-fns";
import type {
  CurrencyCode,
  FinancialAccount,
  FinancialBudget,
  FinancialCategory,
  FinancialGoal,
  FinancialLabel,
  FinancialRecord,
  Money,
  PaymentType,
  StandingOrder,
  SyncStatus,
} from "./models";

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const iso = (d: Date) => format(d, "yyyy-MM-dd");
const money = (value: number, currencyCode: CurrencyCode = "USD"): Money => ({
  value: Math.round(value * 100) / 100,
  currencyCode,
});

export const BASE_CURRENCY: CurrencyCode = "USD";

export const financeCategories: FinancialCategory[] = [
  { id: "c_housing", name: "Housing", group: "essentials", colorVar: "var(--area-home)" },
  { id: "c_groceries", name: "Groceries", group: "essentials", colorVar: "var(--area-health)" },
  { id: "c_transport", name: "Transport", group: "essentials", colorVar: "var(--area-money)" },
  { id: "c_dining", name: "Dining", group: "lifestyle", colorVar: "var(--area-people)" },
  { id: "c_health", name: "Health", group: "obligations", colorVar: "var(--area-mind)" },
  { id: "c_subs", name: "Subscriptions", group: "obligations", colorVar: "var(--area-craft)" },
  { id: "c_entertainment", name: "Entertainment", group: "lifestyle", colorVar: "var(--area-home)" },
  { id: "c_utilities", name: "Utilities", group: "essentials", colorVar: "var(--area-money)" },
  { id: "c_shopping", name: "Shopping", group: "lifestyle", colorVar: "var(--area-people)" },
  { id: "c_income", name: "Income", group: "income", colorVar: "var(--area-health)" },
  { id: "c_transfer", name: "Transfer", group: "transfers", colorVar: "var(--muted-foreground)" },
];

export const financeLabels: FinancialLabel[] = [
  { id: "l_fixed", name: "Fixed cost" },
  { id: "l_work", name: "Work" },
  { id: "l_family", name: "Family" },
  { id: "l_travel", name: "Travel" },
  { id: "l_review", name: "To review" },
];

export const financeAccounts: FinancialAccount[] = [
  { id: "a_checking", name: "Checking", type: "checking", currencyCode: "USD", balance: money(8420) },
  { id: "a_savings", name: "Savings", type: "savings", currencyCode: "USD", balance: money(17300) },
  {
    id: "a_visa",
    name: "Visa",
    type: "credit-card",
    currencyCode: "USD",
    balance: money(-1260),
  },
  { id: "a_cash", name: "Cash", type: "cash", currencyCode: "USD", balance: money(2000) },
  {
    id: "a_eur",
    name: "Travel account",
    type: "savings",
    currencyCode: "EUR",
    balance: money(1840, "EUR"),
  },
];

export const financeBudgets: FinancialBudget[] = [
  { id: "b_groceries", categoryId: "c_groceries", limit: money(600), period: "monthly" },
  { id: "b_dining", categoryId: "c_dining", limit: money(350), period: "monthly" },
  { id: "b_entertainment", categoryId: "c_entertainment", limit: money(300), period: "monthly" },
  { id: "b_transport", categoryId: "c_transport", limit: money(450), period: "monthly" },
  { id: "b_shopping", categoryId: "c_shopping", limit: money(400), period: "monthly" },
];

export const financeGoals: FinancialGoal[] = [
  {
    id: "g_emergency",
    name: "Emergency fund",
    saved: money(8400),
    target: money(12000),
    targetDate: "2027-03-31",
    accountId: "a_savings",
  },
  {
    id: "g_vacation",
    name: "Vacation",
    saved: money(2300),
    target: money(4000),
    targetDate: "2027-06-15",
    accountId: "a_savings",
  },
  {
    id: "g_laptop",
    name: "New laptop",
    saved: money(950),
    target: money(1600),
    targetDate: null,
    accountId: "a_checking",
  },
];

/** Standing orders drive both the recurring tab and part of the record history. */
function buildStandingOrders(now: Date): StandingOrder[] {
  const next = (day: number) => {
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), day);
    return iso(thisMonth >= now ? thisMonth : new Date(now.getFullYear(), now.getMonth() + 1, day));
  };
  return [
    {
      id: "so_rent",
      name: "Rent",
      amount: money(1250),
      type: "expense",
      frequency: "monthly",
      nextDate: next(3),
      accountId: "a_checking",
      categoryId: "c_housing",
      paymentType: "bank-transfer",
    },
    {
      id: "so_insurance",
      name: "Health insurance",
      amount: money(180),
      type: "expense",
      frequency: "monthly",
      nextDate: next(5),
      accountId: "a_checking",
      categoryId: "c_health",
      paymentType: "bank-transfer",
    },
    {
      id: "so_netflix",
      name: "Netflix",
      amount: money(18),
      type: "expense",
      frequency: "monthly",
      nextDate: next(8),
      accountId: "a_visa",
      categoryId: "c_subs",
      paymentType: "credit-card",
    },
    {
      id: "so_gym",
      name: "Gym",
      amount: money(45),
      type: "expense",
      frequency: "monthly",
      nextDate: next(12),
      accountId: "a_visa",
      categoryId: "c_subs",
      paymentType: "credit-card",
    },
    {
      id: "so_internet",
      name: "Internet",
      amount: money(62),
      type: "expense",
      frequency: "monthly",
      nextDate: next(18),
      accountId: "a_checking",
      categoryId: "c_utilities",
      paymentType: "bank-transfer",
    },
    {
      id: "so_cloud",
      name: "Cloud storage",
      amount: money(11),
      type: "expense",
      frequency: "monthly",
      nextDate: next(22),
      accountId: "a_visa",
      categoryId: "c_subs",
      paymentType: "credit-card",
    },
    {
      id: "so_domains",
      name: "Domain renewals",
      amount: money(96),
      type: "expense",
      frequency: "yearly",
      nextDate: iso(addMonths(now, 4)),
      accountId: "a_visa",
      categoryId: "c_subs",
      paymentType: "credit-card",
    },
    {
      id: "so_cleaning",
      name: "Home cleaning",
      amount: money(70),
      type: "expense",
      frequency: "weekly",
      nextDate: iso(addDays(now, 2)),
      accountId: "a_cash",
      categoryId: "c_housing",
      paymentType: "cash",
    },
    {
      id: "so_taxes",
      name: "Quarterly taxes",
      amount: money(1450),
      type: "expense",
      frequency: "quarterly",
      nextDate: iso(addMonths(now, 1)),
      accountId: "a_checking",
      categoryId: "c_obligation" in {} ? "c_housing" : "c_utilities",
      paymentType: "bank-transfer",
    },
  ];
}

interface MerchantSpec {
  name: string;
  categoryId: string;
  accountId: string;
  paymentType: PaymentType;
  min: number;
  max: number;
  /** Rough number of occurrences per month. */
  perMonth: number;
  labelIds?: string[];
}

const merchants: MerchantSpec[] = [
  { name: "Carulla", categoryId: "c_groceries", accountId: "a_visa", paymentType: "debit-card", min: 28, max: 96, perMonth: 6 },
  { name: "Farmers market", categoryId: "c_groceries", accountId: "a_cash", paymentType: "cash", min: 14, max: 42, perMonth: 2 },
  { name: "Uber", categoryId: "c_transport", accountId: "a_visa", paymentType: "credit-card", min: 8, max: 32, perMonth: 7 },
  { name: "Metro card", categoryId: "c_transport", accountId: "a_checking", paymentType: "debit-card", min: 20, max: 45, perMonth: 2 },
  { name: "Fuel station", categoryId: "c_transport", accountId: "a_visa", paymentType: "credit-card", min: 35, max: 72, perMonth: 2 },
  { name: "Café Rituales", categoryId: "c_dining", accountId: "a_cash", paymentType: "cash", min: 4, max: 14, perMonth: 8 },
  { name: "Osaka Bistro", categoryId: "c_dining", accountId: "a_visa", paymentType: "credit-card", min: 32, max: 88, perMonth: 3, labelIds: ["l_family"] },
  { name: "Pharmacy", categoryId: "c_health", accountId: "a_checking", paymentType: "debit-card", min: 12, max: 68, perMonth: 2 },
  { name: "Dental clinic", categoryId: "c_health", accountId: "a_checking", paymentType: "bank-transfer", min: 60, max: 190, perMonth: 0.4 },
  { name: "Spotify", categoryId: "c_subs", accountId: "a_visa", paymentType: "credit-card", min: 11, max: 11, perMonth: 1 },
  { name: "Cinema", categoryId: "c_entertainment", accountId: "a_visa", paymentType: "credit-card", min: 16, max: 44, perMonth: 2 },
  { name: "Bookstore", categoryId: "c_entertainment", accountId: "a_cash", paymentType: "cash", min: 12, max: 52, perMonth: 1.2 },
  { name: "Electric company", categoryId: "c_utilities", accountId: "a_checking", paymentType: "bank-transfer", min: 48, max: 105, perMonth: 1 },
  { name: "Water utility", categoryId: "c_utilities", accountId: "a_checking", paymentType: "bank-transfer", min: 18, max: 34, perMonth: 1 },
  { name: "Zara", categoryId: "c_shopping", accountId: "a_visa", paymentType: "credit-card", min: 40, max: 165, perMonth: 1.1 },
  { name: "Hardware store", categoryId: "c_shopping", accountId: "a_visa", paymentType: "credit-card", min: 18, max: 120, perMonth: 0.8 },
];

/** ~14 months of irregular but deterministic history. */
export function buildFinanceRecords(now = new Date()): FinancialRecord[] {
  const rand = rng(20260901);
  const out: FinancialRecord[] = [];
  let n = 0;
  const id = () => `r_${(++n).toString(36).padStart(4, "0")}`;
  const months = 14;

  for (let m = months - 1; m >= 0; m--) {
    const monthStart = startOfMonth(subMonths(now, m));
    const daysInMonth = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      0,
    ).getDate();
    const seasonal = 0.85 + rand() * 0.35; // month-to-month irregularity

    // Salary, twice a month, with small variation.
    for (const day of [15, 30]) {
      const d = new Date(monthStart.getFullYear(), monthStart.getMonth(), Math.min(day, daysInMonth));
      if (d > now) continue;
      out.push({
        id: id(),
        type: "income",
        amount: money(3200 + Math.round((rand() - 0.5) * 90)),
        date: iso(d),
        counterparty: "Employer",
        categoryId: "c_income",
        accountId: "a_checking",
        paymentType: "bank-transfer",
        labelIds: ["l_work"],
        note: "Salary",
      });
    }

    // Irregular freelance income, not every month.
    if (rand() > 0.55) {
      const d = new Date(monthStart.getFullYear(), monthStart.getMonth(), 6 + Math.floor(rand() * 18));
      if (d <= now) {
        out.push({
          id: id(),
          type: "income",
          amount: money(280 + Math.round(rand() * 900)),
          date: iso(d),
          counterparty: "Freelance client",
          categoryId: "c_income",
          accountId: "a_checking",
          paymentType: "bank-transfer",
          labelIds: ["l_work"],
          note: "Consulting invoice",
        });
      }
    }

    // Recurring commitments, posted as records.
    const recurring: [string, number, number, string, string, PaymentType][] = [
      ["Landlord", 3, 1250, "c_housing", "a_checking", "bank-transfer"],
      ["Health insurance", 5, 180, "c_health", "a_checking", "bank-transfer"],
      ["Netflix", 8, 18, "c_subs", "a_visa", "credit-card"],
      ["Gym", 12, 45, "c_subs", "a_visa", "credit-card"],
      ["Internet provider", 18, 62, "c_utilities", "a_checking", "bank-transfer"],
      ["Cloud storage", 22, 11, "c_subs", "a_visa", "credit-card"],
    ];
    for (const [name, day, amount, categoryId, accountId, paymentType] of recurring) {
      const d = new Date(monthStart.getFullYear(), monthStart.getMonth(), Math.min(day, daysInMonth));
      if (d > now) continue;
      out.push({
        id: id(),
        type: "expense",
        amount: money(-amount),
        date: iso(d),
        counterparty: name,
        categoryId,
        accountId,
        paymentType,
        labelIds: ["l_fixed"],
      });
    }

    // Everyday spending.
    for (const spec of merchants) {
      const occurrences = Math.max(0, Math.round(spec.perMonth * seasonal + (rand() - 0.5)));
      for (let i = 0; i < occurrences; i++) {
        const d = new Date(
          monthStart.getFullYear(),
          monthStart.getMonth(),
          1 + Math.floor(rand() * daysInMonth),
        );
        if (d > now) continue;
        const value = spec.min + rand() * (spec.max - spec.min);
        out.push({
          id: id(),
          type: "expense",
          amount: money(-value),
          date: iso(d),
          counterparty: spec.name,
          categoryId: spec.categoryId,
          accountId: spec.accountId,
          paymentType: spec.paymentType,
          labelIds: spec.labelIds ?? [],
        });
      }
    }

    // Monthly transfer into savings.
    const td = new Date(monthStart.getFullYear(), monthStart.getMonth(), Math.min(16, daysInMonth));
    if (td <= now) {
      out.push({
        id: id(),
        type: "transfer",
        amount: money(-(400 + Math.round(rand() * 250))),
        date: iso(td),
        counterparty: "To Savings",
        categoryId: "c_transfer",
        accountId: "a_checking",
        transferAccountId: "a_savings",
        paymentType: "bank-transfer",
        labelIds: [],
      });
    }
  }

  return out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function buildStandingOrdersFixture(now = new Date()) {
  return buildStandingOrders(now);
}

export const initialSyncStatus = (now = new Date()): SyncStatus => ({
  state: "synced",
  lastSyncedAt: new Date(now.getTime() - 8 * 60 * 1000).toISOString(),
});
