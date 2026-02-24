import type { Route } from "./types";
import { json } from "../http";
import { storeRepository } from "../../database/repositories/store.repository";

export const entitiesRoutes: Route[] = [
  {
    method: "GET",
    path: /^\/api\/v1\/entities\/(.+)$/,
    handler: async (_req, res, match) => {
      const businessId = decodeURIComponent(match.params["1"] || "");
      const state = storeRepository.read();
      json(res, 200, {
        products: state.products.filter((item) => item.businessId === businessId),
        clients: state.clients.filter((item) => item.businessId === businessId),
        suppliers: state.suppliers.filter((item) => item.businessId === businessId),
      });
    },
  },
];
