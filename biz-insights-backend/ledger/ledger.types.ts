export type LedgerType = "IN" | "OUT";

export interface LedgerEntry {
  id: string;
  businessId: string;
  date: string;
  type: LedgerType;
  amount: number;
  source: string;
  traceKey: string;
  reference?: string;
  category?: string;
  channel?: "Cash" | "Bank" | "Mobile Transfer";
  transactionCost?: number;
}
