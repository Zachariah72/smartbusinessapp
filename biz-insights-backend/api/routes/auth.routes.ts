import type { Route } from "./types";
import { readJsonBody, json } from "../http";
import { storeRepository, type SessionRecord } from "../../database/repositories/store.repository";

interface SessionBody {
  businessId: string;
}

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const authRoutes: Route[] = [
  {
    method: "GET",
    path: /^\/api\/v1\/auth\/health$/,
    handler: async (_req, res) => {
      json(res, 200, { ok: true, service: "auth" });
    },
  },
  {
    method: "POST",
    path: /^\/api\/v1\/auth\/session$/,
    handler: async (req, res) => {
      const body = await readJsonBody<SessionBody>(req);
      if (!body.businessId) {
        json(res, 400, { error: "businessId is required" });
        return;
      }

      const session: SessionRecord = {
        id: uid(),
        businessId: body.businessId,
        status: "active",
        createdAt: new Date().toISOString(),
        signedOutAt: null,
      };

      storeRepository.update((state) => {
        state.sessions.unshift(session);
      });

      json(res, 201, { ok: true, session });
    },
  },
  {
    method: "POST",
    path: /^\/api\/v1\/auth\/signout$/,
    handler: async (req, res) => {
      const body = await readJsonBody<SessionBody>(req);
      if (!body.businessId) {
        json(res, 400, { error: "businessId is required" });
        return;
      }

      const session = storeRepository.update((state) => {
        const active = state.sessions.find((item) => item.businessId === body.businessId && item.status === "active");
        if (!active) return null;
        active.status = "signed_out";
        active.signedOutAt = new Date().toISOString();
        return active;
      });

      json(res, 200, { ok: true, session });
    },
  },
  {
    method: "GET",
    path: /^\/api\/v1\/auth\/sessions\/(.+)$/,
    handler: async (_req, res, match) => {
      const businessId = decodeURIComponent(match.params["1"] || "");
      const state = storeRepository.read();
      json(res, 200, { sessions: state.sessions.filter((item) => item.businessId === businessId) });
    },
  },
];
