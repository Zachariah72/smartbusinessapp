export interface LedgerEntryModel {
  id: string;
  businessId: string;
  date: string;
  type: "IN" | "OUT";
  amount: number;
  source: string;
  traceKey: string;
}
