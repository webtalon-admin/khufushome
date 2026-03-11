import type { KhufusEnv } from "@khufushome/types";

/**
 * Returns the current environment. Reads KHUFUS_ENV from
 * process.env (Node/build-time) or falls back to "local".
 *
 * The full config loader with YAML parsing and Zod validation
 * will be implemented in a later phase once dependencies are added.
 */
export function getEnv(): KhufusEnv {
  const env = (
    typeof process !== "undefined" ? process.env["KHUFUS_ENV"] : undefined
  ) as string | undefined;

  if (env === "prod") return "prod";
  return "local";
}
