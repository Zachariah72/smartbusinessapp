import type { Route } from "./types";
import { readJsonBody, json } from "../http";
import { storeRepository, type PreferenceRecord } from "../../database/repositories/store.repository";

interface PreferencesBody {
  businessId: string;
  theme?: "light" | "dark";
  displayName?: string;
  profilePhotoDataUrl?: string;
}

export const preferencesRoutes: Route[] = [
  {
    method: "GET",
    path: /^\/api\/v1\/preferences\/(.+)$/,
    handler: async (_req, res, match) => {
      const businessId = decodeURIComponent(match.params["1"] || "");
      const state = storeRepository.read();
      const preference = state.preferences.find((item) => item.businessId === businessId)
        ?? {
          businessId,
          theme: "light" as const,
          displayName: "Mama Fua Shop",
          profilePhotoDataUrl: "",
          updatedAt: new Date().toISOString(),
        };
      json(res, 200, { preference });
    },
  },
  {
    method: "PUT",
    path: /^\/api\/v1\/preferences$/,
    handler: async (req, res) => {
      const body = await readJsonBody<PreferencesBody>(req);
      if (!body.businessId) {
        json(res, 400, { error: "businessId is required" });
        return;
      }

      const updated = storeRepository.update((state) => {
        const idx = state.preferences.findIndex((item) => item.businessId === body.businessId);
        const next: PreferenceRecord = {
          businessId: body.businessId,
          theme: body.theme ?? (idx >= 0 ? state.preferences[idx].theme : "light"),
          displayName: body.displayName ?? (idx >= 0 ? state.preferences[idx].displayName : "Mama Fua Shop"),
          profilePhotoDataUrl: body.profilePhotoDataUrl ?? (idx >= 0 ? state.preferences[idx].profilePhotoDataUrl : ""),
          updatedAt: new Date().toISOString(),
        };
        if (idx >= 0) state.preferences[idx] = next;
        else state.preferences.push(next);
        return next;
      });

      json(res, 200, { ok: true, preference: updated });
    },
  },
];
