import type { LedgerEntry } from "./ledger.types";

export const validateLedgerEntry = (entry: LedgerEntry): string[] => {
  const errors: string[] = [];
  if (!entry.businessId) errors.push("Missing businessId");
  if (!entry.date) errors.push("Missing date");
  if (!entry.traceKey) errors.push("Missing trace key");
  if (!Number.isFinite(entry.amount) || entry.amount <= 0) errors.push("Invalid amount");
  if (entry.type !== "IN" && entry.type !== "OUT") errors.push("Invalid ledger type");
  return errors;
};
