import type { DeviceState } from "@khufushome/types";

type StateChangeCallback = (state: DeviceState) => void;

export interface HAWebSocketClient {
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribe: (entityId: string, callback: StateChangeCallback) => () => void;
}

/**
 * Creates a Home Assistant WebSocket client for real-time state
 * subscriptions. Full implementation comes in Phase 5/7.
 */
export function createHAWebSocketClient(
  _wsUrl: string,
  _accessToken: string,
): HAWebSocketClient {
  return {
    connect: async () => {
      throw new Error("HA WebSocket not configured — implement in Phase 5");
    },
    disconnect: () => {},
    subscribe: () => {
      throw new Error("HA WebSocket not configured — implement in Phase 5");
    },
  };
}
