import { profitRules } from "./rules";

export const profitService = {
  get: async () => ({ module: "profit", rules: profitRules.version }),
};
