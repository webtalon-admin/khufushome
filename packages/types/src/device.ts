export type DeviceType = "light" | "switch" | "sensor" | "thermostat";

export interface DeviceState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

export interface Device {
  id: string;
  user_id: string;
  ha_entity_id: string;
  name: string;
  device_type: DeviceType;
  room: string;
  model_object_name: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
