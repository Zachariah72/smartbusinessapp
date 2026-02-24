import { salesService } from "./service";

export const salesController = {
  get: async () => salesService.get(),
};
