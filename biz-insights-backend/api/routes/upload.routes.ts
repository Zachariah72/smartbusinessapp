import type { Route } from "./types";
import { readJsonBody, json } from "../http";
import { ingestionPipeline } from "../../ingestion/ingestion.pipeline";
import { ledgerService } from "../../ledger/ledger.service";
import { storeRepository } from "../../database/repositories/store.repository";

interface UploadBody {
  businessId: string;
  fileName: string;
  content: string;
  encoding?: "plain" | "base64";
}

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const uploadRoutes: Route[] = [
  {
    method: "POST",
    path: /^\/api\/v1\/upload$/,
    handler: async (req, res) => {
      const body = await readJsonBody<UploadBody>(req);
      if (!body.businessId || !body.fileName || typeof body.content !== "string") {
        json(res, 400, { error: "businessId, fileName, and content are required" });
        return;
      }

      const content = body.encoding === "base64"
        ? Buffer.from(body.content, "base64").toString("utf8")
        : body.content;

      const outcome = await ingestionPipeline.runFromText(body.fileName, content);

      let committed = 0;
      for (const tx of outcome.trusted.transactions) {
        const result = await ledgerService.commit({
          id: uid(),
          businessId: body.businessId,
          date: tx.date,
          type: tx.type,
          amount: tx.amount,
          source: tx.source,
          traceKey: tx.traceKey,
          reference: tx.reference,
          channel: tx.channel,
          transactionCost: tx.transactionCost,
        });
        if (result.ok && !("duplicate" in result)) committed += 1;
      }

      storeRepository.update((state) => {
        const productKeys = new Set(state.products.map((item) => item.traceKey));
        const clientKeys = new Set(state.clients.map((item) => item.traceKey));
        const supplierKeys = new Set(state.suppliers.map((item) => item.traceKey));
        const reviewKeys = new Set(state.reviewQueue.map((item) => item.traceKey));

        for (const p of outcome.trusted.products) {
          if (productKeys.has(p.traceKey)) continue;
          state.products.unshift({ id: uid(), businessId: body.businessId, ...p });
        }
        for (const c of outcome.trusted.clients) {
          if (clientKeys.has(c.traceKey)) continue;
          state.clients.unshift({ id: uid(), businessId: body.businessId, ...c });
        }
        for (const s of outcome.trusted.suppliers) {
          if (supplierKeys.has(s.traceKey)) continue;
          state.suppliers.unshift({ id: uid(), businessId: body.businessId, ...s });
        }

        for (const p of outcome.review.products) {
          if (reviewKeys.has(p.traceKey)) continue;
          state.reviewQueue.unshift({
            id: uid(),
            businessId: body.businessId,
            kind: "product",
            status: "pending",
            name: p.name,
            confidence: p.confidence,
            riskLevel: p.riskLevel,
            sourceFile: p.sourceFile,
            rowNumber: p.rowNumber,
            traceKey: p.traceKey,
            payload: { id: uid(), businessId: body.businessId, ...p },
            createdAt: new Date().toISOString(),
          });
        }
        for (const c of outcome.review.clients) {
          if (reviewKeys.has(c.traceKey)) continue;
          state.reviewQueue.unshift({
            id: uid(),
            businessId: body.businessId,
            kind: "client",
            status: "pending",
            name: c.name,
            confidence: c.confidence,
            riskLevel: c.riskLevel,
            sourceFile: c.sourceFile,
            rowNumber: c.rowNumber,
            traceKey: c.traceKey,
            payload: { id: uid(), businessId: body.businessId, ...c },
            createdAt: new Date().toISOString(),
          });
        }
        for (const s of outcome.review.suppliers) {
          if (reviewKeys.has(s.traceKey)) continue;
          state.reviewQueue.unshift({
            id: uid(),
            businessId: body.businessId,
            kind: "supplier",
            status: "pending",
            name: s.name,
            confidence: s.confidence,
            riskLevel: s.riskLevel,
            sourceFile: s.sourceFile,
            rowNumber: s.rowNumber,
            traceKey: s.traceKey,
            payload: { id: uid(), businessId: body.businessId, ...s },
            createdAt: new Date().toISOString(),
          });
        }

        state.uploads.unshift({
          id: uid(),
          businessId: body.businessId,
          fileName: body.fileName,
          status: "success",
          rowsProcessed: outcome.rowsProcessed,
          rowsSkipped: outcome.rowsSkipped,
          duplicatesSkipped: outcome.duplicatesSkipped,
          errors: outcome.errors,
          warnings: outcome.warnings,
          createdAt: new Date().toISOString(),
        });
      });

      json(res, 200, {
        ok: true,
        uploaded: body.fileName,
        ledgerCommitted: committed,
        trusted: {
          transactions: outcome.trusted.transactions.length,
          products: outcome.trusted.products.length,
          clients: outcome.trusted.clients.length,
          suppliers: outcome.trusted.suppliers.length,
        },
        reviewQueued: outcome.review.products.length + outcome.review.clients.length + outcome.review.suppliers.length,
      });
    },
  },
  {
    method: "GET",
    path: /^\/api\/v1\/upload\/(.+)$/,
    handler: async (_req, res, match) => {
      const businessId = decodeURIComponent(match.params["1"] || "");
      const state = storeRepository.read();
      json(res, 200, { uploads: state.uploads.filter((item) => item.businessId === businessId) });
    },
  },
];
