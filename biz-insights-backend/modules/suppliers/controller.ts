import { suppliersService } from "./service";

export const suppliersController = {
  get: async () => suppliersService.get(),
};
