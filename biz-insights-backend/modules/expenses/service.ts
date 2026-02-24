import { expensesRules } from "./rules";

export const expensesService = {
  get: async () => ({ module: "expenses", rules: expensesRules.version }),
};
