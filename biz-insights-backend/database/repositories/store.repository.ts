import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

export type RiskLevel = "Trusted" | "Needs Review" | "Risky";

export interface LedgerRecord {
  id: string;
  businessId: string;
  date: string;
  type: "IN" | "OUT";
  amount: number;
  source: string;
  traceKey: string;
  reference?: string;
  category?: string;
  channel?: "Cash" | "Bank" | "Mobile Transfer";
  transactionCost?: number;
}

export interface ProductRecord {
  id: string;
  businessId: string;
  name: string;
  quantity: number;
  unitCost: number;
  supplier: string;
  sourceFile: string;
  rowNumber: number;
  confidence: number;
  riskLevel: RiskLevel;
  traceKey: string;
}

export interface ClientRecord {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  totalSpent: number;
  firstSeen: string;
  sourceFile: string;
  rowNumber: number;
  confidence: number;
  riskLevel: RiskLevel;
  traceKey: string;
}

export interface SupplierRecord {
  id: string;
  businessId: string;
  name: string;
  lastPrice: number;
  categoryHint: string;
  sourceFile: string;
  rowNumber: number;
  confidence: number;
  riskLevel: RiskLevel;
  traceKey: string;
}

export interface ReviewRecord {
  id: string;
  businessId: string;
  kind: "product" | "client" | "supplier";
  status: "pending" | "approved" | "rejected";
  name: string;
  confidence: number;
  riskLevel: RiskLevel;
  sourceFile: string;
  rowNumber: number;
  traceKey: string;
  payload: ProductRecord | ClientRecord | SupplierRecord;
  createdAt: string;
}

export interface UploadRecord {
  id: string;
  businessId: string;
  fileName: string;
  status: "success" | "error";
  rowsProcessed: number;
  rowsSkipped: number;
  duplicatesSkipped: number;
  errors: string[];
  warnings: string[];
  createdAt: string;
}

export interface PosConnectionRecord {
  businessId: string;
  provider: string;
  connected: boolean;
  endpoint: string;
  totalSynced: number;
  lastSyncAt: string | null;
  lastSyncStatus: "idle" | "success" | "error";
  lastSyncMessage: string;
}

export interface GoalRecord {
  id: string;
  businessId: string;
  title: string;
  category: string;
  metric: string;
  baseline: number;
  target: number;
  current: number;
  unit: string;
  startDate: string;
  endDate: string;
  owner: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  budget: number;
  reminderFrequency: string;
  milestones: string[];
  riskNotes: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PreferenceRecord {
  businessId: string;
  theme: "light" | "dark";
  displayName: string;
  profilePhotoDataUrl: string;
  updatedAt: string;
}

export interface SessionRecord {
  id: string;
  businessId: string;
  status: "active" | "signed_out";
  createdAt: string;
  signedOutAt: string | null;
}

export interface StoreShape {
  ledger: LedgerRecord[];
  products: ProductRecord[];
  clients: ClientRecord[];
  suppliers: SupplierRecord[];
  reviewQueue: ReviewRecord[];
  uploads: UploadRecord[];
  posConnections: PosConnectionRecord[];
  goals: GoalRecord[];
  preferences: PreferenceRecord[];
  sessions: SessionRecord[];
}

const STORE_FILE = resolve(__dirname, "../data/store.json");

const emptyStore = (): StoreShape => ({
  ledger: [],
  products: [],
  clients: [],
  suppliers: [],
  reviewQueue: [],
  uploads: [],
  posConnections: [],
  goals: [],
  preferences: [],
  sessions: [],
});

const ensureFile = () => {
  const parent = dirname(STORE_FILE);
  if (!existsSync(parent)) mkdirSync(parent, { recursive: true });
  if (!existsSync(STORE_FILE)) writeFileSync(STORE_FILE, JSON.stringify(emptyStore(), null, 2), "utf8");
};

const load = (): StoreShape => {
  ensureFile();
  try {
    const raw = readFileSync(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as StoreShape;
    return {
      ...emptyStore(),
      ...parsed,
      ledger: Array.isArray(parsed.ledger) ? parsed.ledger : [],
      products: Array.isArray(parsed.products) ? parsed.products : [],
      clients: Array.isArray(parsed.clients) ? parsed.clients : [],
      suppliers: Array.isArray(parsed.suppliers) ? parsed.suppliers : [],
      reviewQueue: Array.isArray(parsed.reviewQueue) ? parsed.reviewQueue : [],
      uploads: Array.isArray(parsed.uploads) ? parsed.uploads : [],
      posConnections: Array.isArray(parsed.posConnections) ? parsed.posConnections : [],
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      preferences: Array.isArray(parsed.preferences) ? parsed.preferences : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    };
  } catch {
    return emptyStore();
  }
};

const persist = (store: StoreShape) => {
  ensureFile();
  writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
};

export const storeRepository = {
  read: load,
  write: persist,
  update: <T>(mutate: (state: StoreShape) => T): T => {
    const state = load();
    const result = mutate(state);
    persist(state);
    return result;
  },
};
