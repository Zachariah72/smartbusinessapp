import type { AppContext } from "./app";
import { createApp } from "./app";
import { logger } from "../utils/logger";

export const bootstrap = async (): Promise<AppContext> => {
  const app = createApp();
  logger.info("Backend bootstrap complete");
  return app;
};
