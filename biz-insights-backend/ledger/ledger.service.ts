import { storeRepository, type LedgerRecord } from "../database/repositories/store.repository";
import type { LedgerEntry } from "./ledger.types";
import { validateLedgerEntry } from "./ledger.validator";

export const ledgerService = {
  commit: async (entry: LedgerEntry) => {
    const errors = validateLedgerEntry(entry);
    if (errors.length > 0) return { ok: false as const, errors };

    const saved = storeRepository.update((state) => {
      if (state.ledger.some((item) => item.traceKey === entry.traceKey)) return null;
      const record: LedgerRecord = { ...entry };
      state.ledger.unshift(record);
      return record;
    });

    if (!saved) return { ok: true as const, duplicate: true as const };
    return { ok: true as const, entry: saved };
  },

  list: async (businessId: string) => {
    const state = storeRepository.read();
    return state.ledger.filter((item) => item.businessId === businessId);
  },

  monthlySummary: async (businessId: string, isoDate: string) => {
    const state = storeRepository.read();
    const month = isoDate.slice(0, 7);
    const entries = state.ledger.filter((item) => item.businessId === businessId && item.date.startsWith(month));

    const totals = entries.reduce(
      (acc, entry) => {
        if (entry.type === "IN") acc.cashIn += entry.amount;
        if (entry.type === "OUT") acc.cashOut += entry.amount;
        return acc;
      },
      { cashIn: 0, cashOut: 0, profit: 0, entries: entries.length },
    );
    totals.profit = totals.cashIn - totals.cashOut;
    return totals;
  },
};
