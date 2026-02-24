import type { Route } from "./types";
import { json } from "../http";
import { storeRepository } from "../../database/repositories/store.repository";

const monthPrefix = () => new Date().toISOString().slice(0, 7);

export const dashboardRoutes: Route[] = [
  {
    method: "GET",
    path: /^\/api\/v1\/dashboard\/(.+)$/,
    handler: async (_req, res, match) => {
      const businessId = decodeURIComponent(match.params["1"] || "");
      const state = storeRepository.read();
      const entries = state.ledger.filter((item) => item.businessId === businessId);
      const month = monthPrefix();

      const monthTotals = entries
        .filter((item) => item.date.startsWith(month))
        .reduce(
          (acc, item) => {
            if (item.type === "IN") acc.cashIn += item.amount;
            if (item.type === "OUT") acc.cashOut += item.amount;
            return acc;
          },
          { cashIn: 0, cashOut: 0 },
        );

      const pendingReview = state.reviewQueue.filter((item) => item.businessId === businessId && item.status === "pending").length;

      json(res, 200, {
        businessId,
        monthCashIn: monthTotals.cashIn,
        monthCashOut: monthTotals.cashOut,
        ledgerProfit: monthTotals.cashIn - monthTotals.cashOut,
        totals: {
          ledgerEntries: entries.length,
          products: state.products.filter((item) => item.businessId === businessId).length,
          clients: state.clients.filter((item) => item.businessId === businessId).length,
          suppliers: state.suppliers.filter((item) => item.businessId === businessId).length,
          pendingReview,
        },
      });
    },
  },
];
