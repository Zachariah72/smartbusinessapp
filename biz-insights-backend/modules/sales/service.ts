import { salesRules } from "./rules";

export const salesService = {
  get: async () => ({ module: "sales", rules: salesRules.version }),
};
