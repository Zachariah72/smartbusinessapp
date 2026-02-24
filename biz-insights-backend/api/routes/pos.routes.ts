import type { Route } from "./types";
import { readJsonBody, json } from "../http";
import { storeRepository } from "../../database/repositories/store.repository";
import { ledgerService } from "../../ledger/ledger.service";

interface PosConnectBody {
  businessId: string;
  provider: string;
  endpoint: string;
}

interface PosSyncBody {
  businessId: string;
  transactions?: Array<{ date: string; type: "IN" | "OUT"; amount: number; reference?: string; channel?: "Cash" | "Bank" | "Mobile Transfer" }>;
}

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const posRoutes: Route[] = [
  {
    method: "POST",
    path: /^\/api\/v1\/pos\/connect$/,
    handler: async (req, res) => {
      const body = await readJsonBody<PosConnectBody>(req);
      if (!body.businessId) {
        json(res, 400, { error: "businessId is required" });
        return;
      }
      storeRepository.update((state) => {
        const idx = state.posConnections.findIndex((item) => item.businessId === body.businessId);
        const record = {
          businessId: body.businessId,
          provider: body.provider || "Generic POS",
          connected: true,
          endpoint: body.endpoint || "demo",
          totalSynced: idx >= 0 ? state.posConnections[idx].totalSynced : 0,
          lastSyncAt: idx >= 0 ? state.posConnections[idx].lastSyncAt : null,
          lastSyncStatus: "idle" as const,
          lastSyncMessage: "Connected",
        };
        if (idx >= 0) state.posConnections[idx] = record;
        else state.posConnections.push(record);
      });
      json(res, 200, { ok: true });
    },
  },
  {
    method: "POST",
    path: /^\/api\/v1\/pos\/sync$/,
    handler: async (req, res) => {
      const body = await readJsonBody<PosSyncBody>(req);
      if (!body.businessId) {
        json(res, 400, { error: "businessId is required" });
        return;
      }

      const txns = body.transactions ?? [
        { date: new Date().toISOString().slice(0, 10), type: "IN" as const, amount: 12500, reference: "POS-DEMO-1", channel: "Mobile Transfer" as const },
        { date: new Date().toISOString().slice(0, 10), type: "IN" as const, amount: 6800, reference: "POS-DEMO-2", channel: "Cash" as const },
      ];

      let committed = 0;
      for (const tx of txns) {
        const result = await ledgerService.commit({
          id: uid(),
          businessId: body.businessId,
          date: tx.date,
          type: tx.type,
          amount: Math.abs(tx.amount),
          source: "pos",
          traceKey: `${body.businessId}|pos|${tx.reference ?? uid()}|${tx.date}`,
          reference: tx.reference,
          channel: tx.channel,
          transactionCost: 0,
        });
        if (result.ok && !("duplicate" in result)) committed += 1;
      }

      storeRepository.update((state) => {
        const idx = state.posConnections.findIndex((item) => item.businessId === body.businessId);
        if (idx < 0) return;
        state.posConnections[idx].lastSyncAt = new Date().toISOString();
        state.posConnections[idx].lastSyncStatus = "success";
        state.posConnections[idx].lastSyncMessage = `Synced ${committed} transactions`;
        state.posConnections[idx].totalSynced += committed;
      });

      json(res, 200, { ok: true, synced: committed });
    },
  },
  {
    method: "GET",
    path: /^\/api\/v1\/pos\/(.+)$/,
    handler: async (_req, res, match) => {
      const businessId = decodeURIComponent(match.params["1"] || "");
      const state = storeRepository.read();
      const connection = state.posConnections.find((item) => item.businessId === businessId);
      json(res, 200, { connection: connection ?? null });
    },
  },
];
