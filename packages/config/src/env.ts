import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { z } from "zod";

export type KhufusEnv = "local" | "prod";

const envBlockSchema = z.object({
  supabase: z.object({
    url: z.string().url(),
    auth_cookie_domain: z.string(),
  }),
  home_assistant: z.object({
    url: z.string().url(),
    websocket_url: z.string(),
  }),
  mqtt: z.object({
    host: z.string(),
    port: z.number().int().positive(),
  }),
  apps: z.object({
    dashboard_url: z.string().url(),
    threedimension_url: z.string().url(),
    finance_url: z.string().url(),
  }),
  features: z.object({
    mock_devices: z.boolean(),
    seed_data: z.boolean(),
  }),
});

export type AppEnvironment = z.infer<typeof envBlockSchema>;

let cachedConfig: AppEnvironment | null = null;
let cachedEnv: KhufusEnv | null = null;

export function getEnv(): KhufusEnv {
  const env = (typeof process !== "undefined" ? process.env.KHUFUS_ENV : undefined) as
    | string
    | undefined;

  if (env === "prod") return "prod";
  return "local";
}

/**
 * Loads and validates `config/env.yaml` for the current KHUFUS_ENV.
 * Walks up from this package until it finds `config/env.yaml`.
 * Results are cached — subsequent calls return the same object.
 */
export function loadConfig(env?: KhufusEnv): AppEnvironment {
  const resolvedEnv = env ?? getEnv();

  if (cachedConfig && cachedEnv === resolvedEnv) {
    return cachedConfig;
  }

  const yamlPath = findConfigFile();
  const raw = readFileSync(yamlPath, "utf-8");
  const parsed = parseYaml(raw);

  const envBlock = (parsed as Record<string, unknown>)[resolvedEnv];
  if (!envBlock) {
    throw new Error(
      `No "${resolvedEnv}" block found in ${yamlPath}. ` +
        `Available blocks: ${Object.keys(parsed as Record<string, unknown>).join(", ")}`,
    );
  }

  cachedConfig = envBlockSchema.parse(envBlock);
  cachedEnv = resolvedEnv;
  return cachedConfig;
}

/** Resets the cached config — useful for testing. */
export function resetConfigCache(): void {
  cachedConfig = null;
  cachedEnv = null;
}

function findConfigFile(): string {
  const thisDir = dirname(fileURLToPath(import.meta.url));
  let dir = thisDir;
  for (let i = 0; i < 10; i++) {
    const candidate = resolve(dir, "config", "env.yaml");
    try {
      readFileSync(candidate, "utf-8");
      return candidate;
    } catch {
      dir = resolve(dir, "..");
    }
  }
  throw new Error("Could not find config/env.yaml — searched up to 10 parent directories");
}
