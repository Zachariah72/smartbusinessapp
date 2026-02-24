import { dashboardRules } from "./rules";

export const dashboardService = {
  get: async () => ({ module: "dashboard", rules: dashboardRules.version }),
};
