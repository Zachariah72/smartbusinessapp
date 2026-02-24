import { env } from "./env";

export const databaseConfig = {
  url: env.DATABASE_URL,
  poolMin: 2,
  poolMax: 20,
};
