import { bootstrap } from "./bootstrap";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const start = async () => {
  const app = await bootstrap();
  app.server.listen(env.PORT, () => {
    logger.info(`Biz Insights backend listening on http://localhost:${env.PORT}`);
  });

  const shutdown = () => {
    app.server.close(() => {
      logger.info("Backend stopped");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

void start();
