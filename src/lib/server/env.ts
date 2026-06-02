import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  TESLA_BACKEND_URL: z.url(),
  TESLA_CLIENT_API_TOKEN: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedServerEnv: ServerEnv | undefined;

export function getServerEnv() {
  cachedServerEnv ??= serverEnvSchema.parse({
    TESLA_BACKEND_URL: process.env.TESLA_BACKEND_URL,
    TESLA_CLIENT_API_TOKEN: process.env.TESLA_CLIENT_API_TOKEN,
  });

  return cachedServerEnv;
}
