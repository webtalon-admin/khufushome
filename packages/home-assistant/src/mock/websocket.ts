import type { DeviceState } from "@khufushome/types";
import type { HAWebSocketClient } from "../websocket";
import { MOCK_DEVICES } from "./devices";

type StateChangeCallback = (state: DeviceState) => void;

/**
 * Mock WebSocket client that simulates real-time HA state changes.
 * After connect(), it emits random state fluctuations on sensor
 * entities at a configurable interval so the UI can be tested
 * against live-updating data without a real HA instance.
 */
export function createMockHAWebSocketClient(
  options: { intervalMs?: number } = {},
): HAWebSocketClient {
  const { intervalMs = 5_000 } = options;
  const subscribers = new Map<string, Set<StateChangeCallback>>();
  const states = new Map<string, DeviceState>();
  let timer: ReturnType<typeof setInterval> | null = null;

  for (const device of MOCK_DEVICES) {
    states.set(device.entity_id, structuredClone(device));
  }

  function emitRandomSensorUpdates(): void {
    for (const [entityId, state] of states) {
      if (!entityId.startsWith("sensor.") || !state.attributes.unit_of_measurement) continue;

      const current = Number.parseFloat(state.state);
      if (Number.isNaN(current)) continue;

      const delta = (Math.random() - 0.5) * 0.6;
      const newValue = Math.round((current + delta) * 10) / 10;
      const now = new Date().toISOString();

      state.state = String(newValue);
      state.last_changed = now;
      state.last_updated = now;

      const callbacks = subscribers.get(entityId);
      if (callbacks) {
        for (const cb of callbacks) {
          cb(structuredClone(state));
        }
      }
    }
  }

  return {
    async connect(): Promise<void> {
      if (timer) return;
      timer = setInterval(emitRandomSensorUpdates, intervalMs);
    },

    disconnect(): void {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      subscribers.clear();
    },

    subscribe(entityId: string, callback: StateChangeCallback): () => void {
      let set = subscribers.get(entityId);
      if (!set) {
        set = new Set();
        subscribers.set(entityId, set);
      }
      set.add(callback);

      const state = states.get(entityId);
      if (state) {
        queueMicrotask(() => callback(structuredClone(state)));
      }

      return () => {
        set?.delete(callback);
        if (set?.size === 0) {
          subscribers.delete(entityId);
        }
      };
    },
  };
}
