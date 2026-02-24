export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 8080),
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  OCR_PROVIDER: process.env.OCR_PROVIDER ?? "local",
  OCR_ENDPOINT: process.env.OCR_ENDPOINT ?? "",
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER ?? "local",
  POS_SYNC_CRON: process.env.POS_SYNC_CRON ?? "0 */24 * * *",
};
