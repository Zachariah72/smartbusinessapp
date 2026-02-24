import { dashboardService } from "./service";

export const dashboardController = {
  get: async () => dashboardService.get(),
};
