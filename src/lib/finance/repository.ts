// Finance data access boundary.
//
// Components never talk to a transport: they depend on `FinanceRepository`.
// Today it is backed by MockFinanceRepository (deterministic fixtures held in
// memory). A future WalletFinanceRepository — talking to a SERVER-SIDE proxy for
// the BudgetBakers Wallet REST API, never with a token in the browser — can be
// dropped in via `configureFinanceRepository` without touching any component.

import {
  BASE_CURRENCY,
  buildFinanceRecords,
  buildStandingOrdersFixture,
  financeAccounts,
  financeBudgets,
  financeCategories,
  financeGoals,
  financeLabels,
  initialSyncStatus,
} from "./fixtures";
import type {
  FinancialAccount,
  FinancialBudget,
  FinancialCategory,
  FinancialGoal,
  FinancialLabel,
  FinancialRecord,
  NewRecordInput,
  Page,
  RecordFilters,
  StandingOrder,
  SyncStatus,
} from "./models";

export interface ListRecordsParams {
  filters?: RecordFilters;
  /** 1-based, mirroring Wallet's paginated record listing. */
  page?: number;
  pageSize?: number;
}

export interface FinanceRepository {
  getSyncStatus(): Promise<SyncStatus>;
  listAccounts(): Promise<FinancialAccount[]>;
  listCategories(): Promise<FinancialCategory[]>;
  listLabels(): Promise<FinancialLabel[]>;
  listBudgets(): Promise<FinancialBudget[]>;
  listGoals(): Promise<FinancialGoal[]>;
  listStandingOrders(): Promise<StandingOrder[]>;
  /** Paginated listing for the transactions table. */
  listRecords(params?: ListRecordsParams): Promise<Page<FinancialRecord>>;
  /** Bounded range read used for aggregates — never "the whole history". */
  listRecordsInRange(range: { from: string; to: string }): Promise<FinancialRecord[]>;
  createRecord(input: NewRecordInput): Promise<FinancialRecord>;
  updateRecord(id: string, patch: Partial<NewRecordInput>): Promise<FinancialRecord>;
  deleteRecord(id: string): Promise<void>;
  createBudget(input: Omit<FinancialBudget, "id">): Promise<FinancialBudget>;
}

export class FinanceError extends Error {
  constructor(
    message: string,
    readonly kind: "network" | "not-found" | "validation" | "server" = "server",
  ) {
    super(message);
    this.name = "FinanceError";
  }
}

const LATENCY = [120, 380] as const;
const wait = () =>
  new Promise((r) => setTimeout(r, LATENCY[0] + Math.random() * (LATENCY[1] - LATENCY[0])));
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

interface Store {
  accounts: FinancialAccount[];
  categories: FinancialCategory[];
  labels: FinancialLabel[];
  budgets: FinancialBudget[];
  goals: FinancialGoal[];
  standingOrders: StandingOrder[];
  records: FinancialRecord[];
  sync: SyncStatus;
}

let store: Store | null = null;

function db(): Store {
  if (!store) {
    const now = new Date();
    store = {
      accounts: clone(financeAccounts),
      categories: clone(financeCategories),
      labels: clone(financeLabels),
      budgets: clone(financeBudgets),
      goals: clone(financeGoals),
      standingOrders: buildStandingOrdersFixture(now),
      records: buildFinanceRecords(now),
      sync: initialSyncStatus(now),
    };
  }
  return store;
}

function matches(r: FinancialRecord, f: RecordFilters, categories: FinancialCategory[]) {
  if (f.from && r.date < f.from) return false;
  if (f.to && r.date > f.to) return false;
  if (f.accountId && r.accountId !== f.accountId) return false;
  if (f.categoryId && r.categoryId !== f.categoryId) return false;
  if (f.type && r.type !== f.type) return false;
  if (f.paymentType && r.paymentType !== f.paymentType) return false;
  if (f.labelId && !r.labelIds.includes(f.labelId)) return false;
  if (f.search) {
    const q = f.search.toLowerCase();
    const cat = categories.find((c) => c.id === r.categoryId)?.name ?? "";
    const hay = `${r.counterparty} ${r.note ?? ""} ${cat}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export class MockFinanceRepository implements FinanceRepository {
  async getSyncStatus() {
    await wait();
    return clone(db().sync);
  }
  async listAccounts() {
    await wait();
    return clone(db().accounts);
  }
  async listCategories() {
    await wait();
    return clone(db().categories);
  }
  async listLabels() {
    await wait();
    return clone(db().labels);
  }
  async listBudgets() {
    await wait();
    return clone(db().budgets);
  }
  async listGoals() {
    await wait();
    return clone(db().goals);
  }
  async listStandingOrders() {
    await wait();
    return clone(db().standingOrders);
  }

  async listRecords({ filters = {}, page = 1, pageSize = 25 }: ListRecordsParams = {}) {
    await wait();
    const s = db();
    const all = s.records.filter((r) => matches(r, filters, s.categories));
    const start = (page - 1) * pageSize;
    const items = all.slice(start, start + pageSize);
    return {
      items: clone(items),
      page,
      pageSize,
      total: all.length,
      hasMore: start + items.length < all.length,
    } satisfies Page<FinancialRecord>;
  }

  async listRecordsInRange({ from, to }: { from: string; to: string }) {
    await wait();
    const s = db();
    return clone(s.records.filter((r) => r.date >= from && r.date <= to));
  }

  async createRecord(input: NewRecordInput) {
    await wait();
    const s = db();
    if (!input.counterparty.trim()) throw new FinanceError("Counterparty is required", "validation");
    if (!input.amount.value) throw new FinanceError("Amount must not be zero", "validation");
    const signed =
      input.type === "income" ? Math.abs(input.amount.value) : -Math.abs(input.amount.value);
    const record: FinancialRecord = {
      ...clone(input),
      amount: { ...input.amount, value: signed },
      id: uid("r"),
    };
    s.records = [record, ...s.records].sort((a, b) => (a.date < b.date ? 1 : -1));
    const account = s.accounts.find((a) => a.id === record.accountId);
    if (account && account.currencyCode === record.amount.currencyCode) {
      account.balance.value = Math.round((account.balance.value + signed) * 100) / 100;
    }
    return clone(record);
  }

  async updateRecord(id: string, patch: Partial<NewRecordInput>) {
    await wait();
    const s = db();
    const i = s.records.findIndex((r) => r.id === id);
    if (i < 0) throw new FinanceError("Transaction not found", "not-found");
    const next = { ...s.records[i]!, ...clone(patch) } as FinancialRecord;
    s.records[i] = next;
    return clone(next);
  }

  async deleteRecord(id: string) {
    await wait();
    const s = db();
    const record = s.records.find((r) => r.id === id);
    if (!record) throw new FinanceError("Transaction not found", "not-found");
    s.records = s.records.filter((r) => r.id !== id);
    const account = s.accounts.find((a) => a.id === record.accountId);
    if (account && account.currencyCode === record.amount.currencyCode) {
      account.balance.value = Math.round((account.balance.value - record.amount.value) * 100) / 100;
    }
  }

  async createBudget(input: Omit<FinancialBudget, "id">) {
    await wait();
    const s = db();
    const budget: FinancialBudget = { ...clone(input), id: uid("b") };
    s.budgets = [...s.budgets, budget];
    return clone(budget);
  }
}

let repository: FinanceRepository = new MockFinanceRepository();

export function configureFinanceRepository(next: FinanceRepository) {
  repository = next;
}

export const finance: FinanceRepository = new Proxy({} as FinanceRepository, {
  get: (_t, prop: string) => {
    const value = (repository as unknown as Record<string, unknown>)[prop];
    return typeof value === "function" ? value.bind(repository) : value;
  },
});

export { BASE_CURRENCY };
