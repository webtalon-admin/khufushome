import type { DeviceState } from "@khufushome/types";

export interface HAClient {
  getStates: () => Promise<DeviceState[]>;
  getState: (entityId: string) => Promise<DeviceState>;
  callService: (domain: string, service: string, data?: Record<string, unknown>) => Promise<void>;
}

/**
 * Creates a Home Assistant REST API client. The full implementation
 * with fetch calls and error handling comes in Phase 5.
 */
export function createHAClient(_baseUrl: string, _accessToken: string): HAClient {
  return {
    getStates: async () => {
      throw new Error("HA client not configured — implement in Phase 5");
    },
    getState: async () => {
      throw new Error("HA client not configured — implement in Phase 5");
    },
    callService: async () => {
      throw new Error("HA client not configured — implement in Phase 5");
    },
  };
}
