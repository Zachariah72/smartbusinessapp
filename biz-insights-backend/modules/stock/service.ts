import { stockRules } from "./rules";

export const stockService = {
  get: async () => ({ module: "stock", rules: stockRules.version }),
};
