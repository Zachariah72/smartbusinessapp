import { insightsService } from "./service";

export const insightsController = {
  get: async () => insightsService.get(),
};
