import { moodRules } from "./rules";

export const moodService = {
  get: async () => ({ module: "mood", rules: moodRules.version }),
};
