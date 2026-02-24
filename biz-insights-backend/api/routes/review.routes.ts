import type { Route } from "./types";
import { json } from "../http";
import { storeRepository } from "../../database/repositories/store.repository";

export const reviewRoutes: Route[] = [
  {
    method: "GET",
    path: /^\/api\/v1\/review\/(.+)$/,
    handler: async (_req, res, match) => {
      const businessId = decodeURIComponent(match.params["1"] || "");
      const state = storeRepository.read();
      json(res, 200, { queue: state.reviewQueue.filter((item) => item.businessId === businessId) });
    },
  },
  {
    method: "POST",
    path: /^\/api\/v1\/review\/([^/]+)\/([^/]+)\/(approve|reject)$/,
    handler: async (_req, res, match) => {
      const businessId = decodeURIComponent(match.params["1"] || "");
      const reviewId = decodeURIComponent(match.params["2"] || "");
      const action = decodeURIComponent(match.params["3"] || "");

      const result = storeRepository.update((state) => {
        const item = state.reviewQueue.find((entry) => entry.businessId === businessId && entry.id === reviewId);
        if (!item) return null;
        item.status = action === "approve" ? "approved" : "rejected";

        if (action === "approve") {
          if (item.kind === "product") state.products.unshift(item.payload as any);
          if (item.kind === "client") state.clients.unshift(item.payload as any);
          if (item.kind === "supplier") state.suppliers.unshift(item.payload as any);
        }

        return item;
      });

      if (!result) {
        json(res, 404, { error: "Review item not found" });
        return;
      }

      json(res, 200, { ok: true, item: result });
    },
  },
];
