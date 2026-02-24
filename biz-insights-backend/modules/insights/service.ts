import { insightsRules } from "./rules";

export const insightsService = {
  get: async () => ({ module: "insights", rules: insightsRules.version }),
};
