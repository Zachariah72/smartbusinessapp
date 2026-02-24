import { profitService } from "./service";

export const profitController = {
  get: async () => profitService.get(),
};
