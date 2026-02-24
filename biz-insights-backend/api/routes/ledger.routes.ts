import type { Route } from "./types";
import { readJsonBody, json } from "../http";
import { ledgerService } from "../../ledger/ledger.service";

interface LedgerBody {
  businessId: string;
  date: string;
  type: "IN" | "OUT";
  amount: number;
  source?: string;
  traceKey?: string;
  reference?: string;
  category?: string;
  channel?: "Cash" | "Bank" | "Mobile Transfer";
}

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const ledgerRoutes: Route[] = [
  {
    method: "GET",
    path: /^\/api\/v1\/ledger\/(.+)$/,
    handler: async (_req, res, match) => {
      const businessId = decodeURIComponent(match.params["1"] || "");
      const entries = await ledgerService.list(businessId);
      json(res, 200, { entries });
    },
  },
  {
    method: "POST",
    path: /^\/api\/v1\/ledger$/,
    handler: async (req, res) => {
      const body = await readJsonBody<LedgerBody>(req);
      if (!body.businessId || !body.date || !body.type || !Number.isFinite(body.amount)) {
        json(res, 400, { error: "businessId, date, type and amount are required" });
        return;
      }

      const result = await ledgerService.commit({
        id: uid(),
        businessId: body.businessId,
        date: body.date,
        type: body.type,
        amount: Math.abs(body.amount),
        source: body.source ?? "manual",
        traceKey: body.traceKey ?? `${body.businessId}|manual|${Date.now()}`,
        reference: body.reference,
        category: body.category,
        channel: body.channel,
        transactionCost: 0,
      });

      if (!result.ok) {
        json(res, 422, { error: "Validation failed", details: result.errors });
        return;
      }

      json(res, 200, result);
    },
  },
];
