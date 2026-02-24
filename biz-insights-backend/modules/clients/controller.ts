import { clientsService } from "./service";

export const clientsController = {
  get: async () => clientsService.get(),
};
