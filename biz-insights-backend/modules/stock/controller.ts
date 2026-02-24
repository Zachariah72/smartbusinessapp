import { stockService } from "./service";

export const stockController = {
  get: async () => stockService.get(),
};
