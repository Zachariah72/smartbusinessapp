import { suppliersRules } from "./rules";

export const suppliersService = {
  get: async () => ({ module: "suppliers", rules: suppliersRules.version }),
};
