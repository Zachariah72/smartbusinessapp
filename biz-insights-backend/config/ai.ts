import { env } from "./env";

export const aiConfig = {
  provider: "openai",
  apiKey: env.OPENAI_API_KEY,
  model: "gpt-5-mini",
  temperature: 0,
};
