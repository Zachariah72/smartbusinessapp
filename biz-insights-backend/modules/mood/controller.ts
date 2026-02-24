import { moodService } from "./service";

export const moodController = {
  get: async () => moodService.get(),
};
