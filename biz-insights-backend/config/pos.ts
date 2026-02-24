import { env } from "./env";

export const posConfig = {
  syncCron: env.POS_SYNC_CRON,
  defaultProvider: "generic",
};
