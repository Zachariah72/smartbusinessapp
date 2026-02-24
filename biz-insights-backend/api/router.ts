import type { IncomingMessage, ServerResponse } from "node:http";
import { json } from "./http";
import type { Route } from "./routes/types";
import { authRoutes } from "./routes/auth.routes";
import { uploadRoutes } from "./routes/upload.routes";
import { dashboardRoutes } from "./routes/dashboard.routes";
import { ledgerRoutes } from "./routes/ledger.routes";
import { posRoutes } from "./routes/pos.routes";
import { entitiesRoutes } from "./routes/entities.routes";
import { reviewRoutes } from "./routes/review.routes";
import { goalsRoutes } from "./routes/goals.routes";
import { preferencesRoutes } from "./routes/preferences.routes";

const routes: Route[] = [
  ...authRoutes,
  ...uploadRoutes,
  ...dashboardRoutes,
  ...ledgerRoutes,
  ...posRoutes,
  ...entitiesRoutes,
  ...reviewRoutes,
  ...goalsRoutes,
  ...preferencesRoutes,
];

export const handleRequest = async (req: IncomingMessage, res: ServerResponse) => {
  if (!req.url || !req.method) {
    json(res, 400, { error: "Invalid request" });
    return;
  }

  if (req.method === "OPTIONS") {
    json(res, 204, {});
    return;
  }

  const path = req.url.split("?")[0];
  const route = routes.find((candidate) => candidate.method === req.method && candidate.path.test(path));

  if (!route) {
    json(res, 404, { error: "Not found", path, method: req.method });
    return;
  }

  const exec = route.path.exec(path);
  const params: Record<string, string> = {};
  if (exec) {
    for (let i = 1; i < exec.length; i += 1) {
      params[String(i)] = exec[i];
    }
  }

  try {
    await route.handler(req, res, { params });
  } catch (error) {
    json(res, 500, { error: "Internal server error", details: error instanceof Error ? error.message : "unknown" });
  }
};
