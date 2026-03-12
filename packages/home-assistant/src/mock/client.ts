import type { DeviceState } from "@khufushome/types";
import type { HAClient } from "../client";
import { MOCK_DEVICES } from "./devices";

/**
 * In-memory mock of the HA REST API client.
 * Operates on a mutable copy of the fixture data so service calls
 * (toggle, turn_on, turn_off) are reflected in subsequent getState calls.
 */
export function createMockHAClient(): HAClient {
  const states = new Map<string, DeviceState>();

  for (const device of MOCK_DEVICES) {
    states.set(device.entity_id, structuredClone(device));
  }

  return {
    async getStates(): Promise<DeviceState[]> {
      return [...states.values()];
    },

    async getState(entityId: string): Promise<DeviceState> {
      const state = states.get(entityId);
      if (!state) {
        throw new Error(`[mock] Entity not found: ${entityId}`);
      }
      return state;
    },

    async callService(
      domain: string,
      service: string,
      data?: Record<string, unknown>,
    ): Promise<void> {
      const entityId = data?.entity_id as string | undefined;
      if (!entityId) return;

      const state = states.get(entityId);
      if (!state) {
        throw new Error(`[mock] Entity not found: ${entityId}`);
      }

      const now = new Date().toISOString();

      if (domain === "light" || domain === "switch") {
        if (service === "turn_on") {
          state.state = "on";
          if (domain === "light" && data?.brightness != null) {
            state.attributes.brightness = data.brightness;
          }
        } else if (service === "turn_off") {
          state.state = "off";
          if (domain === "light") {
            state.attributes.brightness = 0;
          }
        } else if (service === "toggle") {
          state.state = state.state === "on" ? "off" : "on";
          if (domain === "light") {
            state.attributes.brightness = state.state === "on" ? 200 : 0;
          }
        }
      }

      if (domain === "climate") {
        if (service === "set_temperature" && data?.temperature != null) {
          state.attributes.temperature = data.temperature;
        }
        if (service === "set_hvac_mode" && data?.hvac_mode != null) {
          state.state = String(data.hvac_mode);
        }
      }

      state.last_changed = now;
      state.last_updated = now;
    },
  };
}
