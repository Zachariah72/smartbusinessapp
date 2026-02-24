import { expensesService } from "./service";

export const expensesController = {
  get: async () => expensesService.get(),
};
