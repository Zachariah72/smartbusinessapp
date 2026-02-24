import type { Route } from "./types";
import { readJsonBody, json } from "../http";
import { storeRepository, type GoalRecord } from "../../database/repositories/store.repository";

interface GoalBody {
  businessId: string;
  title: string;
  category: string;
  metric: string;
  baseline: number;
  target: number;
  current: number;
  unit: string;
  startDate: string;
  endDate: string;
  owner: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  budget: number;
  reminderFrequency: string;
  milestones: string[];
  riskNotes: string;
  notes: string;
}

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const goalsRoutes: Route[] = [
  {
    method: "GET",
    path: /^\/api\/v1\/goals\/(.+)$/,
    handler: async (_req, res, match) => {
      const businessId = decodeURIComponent(match.params["1"] || "");
      const state = storeRepository.read();
      const goals = state.goals.filter((item) => item.businessId === businessId);
      json(res, 200, { goals });
    },
  },
  {
    method: "POST",
    path: /^\/api\/v1\/goals$/,
    handler: async (req, res) => {
      const body = await readJsonBody<GoalBody>(req);
      if (!body.businessId || !body.title || !body.target || !body.startDate || !body.endDate || !body.owner) {
        json(res, 400, { error: "businessId, title, target, startDate, endDate, owner are required" });
        return;
      }

      const now = new Date().toISOString();
      const goal: GoalRecord = {
        id: uid(),
        businessId: body.businessId,
        title: body.title,
        category: body.category || "General",
        metric: body.metric || "Metric",
        baseline: Number(body.baseline || 0),
        target: Number(body.target || 0),
        current: Number(body.current || 0),
        unit: body.unit || "KES",
        startDate: body.startDate,
        endDate: body.endDate,
        owner: body.owner,
        priority: body.priority || "Medium",
        budget: Number(body.budget || 0),
        reminderFrequency: body.reminderFrequency || "Weekly",
        milestones: Array.isArray(body.milestones) ? body.milestones : [],
        riskNotes: body.riskNotes || "",
        notes: body.notes || "",
        createdAt: now,
        updatedAt: now,
      };

      storeRepository.update((state) => {
        state.goals.unshift(goal);
      });

      json(res, 201, { ok: true, goal });
    },
  },
  {
    method: "PUT",
    path: /^\/api\/v1\/goals\/([^/]+)\/(.+)$/,
    handler: async (req, res, match) => {
      const goalId = decodeURIComponent(match.params["1"] || "");
      const businessId = decodeURIComponent(match.params["2"] || "");
      const body = await readJsonBody<Partial<GoalBody>>(req);

      const updated = storeRepository.update((state) => {
        const idx = state.goals.findIndex((item) => item.id === goalId && item.businessId === businessId);
        if (idx < 0) return null;

        const current = state.goals[idx];
        const next: GoalRecord = {
          ...current,
          ...body,
          milestones: Array.isArray(body.milestones) ? body.milestones : current.milestones,
          updatedAt: new Date().toISOString(),
        };
        state.goals[idx] = next;
        return next;
      });

      if (!updated) {
        json(res, 404, { error: "Goal not found" });
        return;
      }

      json(res, 200, { ok: true, goal: updated });
    },
  },
  {
    method: "DELETE",
    path: /^\/api\/v1\/goals\/([^/]+)\/(.+)$/,
    handler: async (_req, res, match) => {
      const goalId = decodeURIComponent(match.params["1"] || "");
      const businessId = decodeURIComponent(match.params["2"] || "");

      storeRepository.update((state) => {
        state.goals = state.goals.filter((item) => !(item.id === goalId && item.businessId === businessId));
      });

      json(res, 200, { ok: true });
    },
  },
];
