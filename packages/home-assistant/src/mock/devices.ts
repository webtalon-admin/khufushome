import type { DeviceState } from "@khufushome/types";

/**
 * Fake HA entity states used by the mock client during local
 * development. Mirrors the shape returned by the real HA REST API
 * (`/api/states`). Add more entries as rooms / device types grow.
 */
export const MOCK_DEVICES: DeviceState[] = [
  // ── Living room ────────────────────────────────────────────
  {
    entity_id: "light.living_room_main",
    state: "on",
    attributes: {
      friendly_name: "Living Room Main Light",
      brightness: 200,
      color_temp: 370,
      supported_features: 63,
      device_class: "light",
      room: "living_room",
    },
    last_changed: "2026-03-11T08:00:00.000Z",
    last_updated: "2026-03-11T08:00:00.000Z",
  },
  {
    entity_id: "light.living_room_lamp",
    state: "off",
    attributes: {
      friendly_name: "Living Room Lamp",
      brightness: 0,
      supported_features: 1,
      device_class: "light",
      room: "living_room",
    },
    last_changed: "2026-03-11T07:30:00.000Z",
    last_updated: "2026-03-11T07:30:00.000Z",
  },
  {
    entity_id: "sensor.living_room_temperature",
    state: "22.5",
    attributes: {
      friendly_name: "Living Room Temperature",
      unit_of_measurement: "°C",
      device_class: "temperature",
      state_class: "measurement",
      room: "living_room",
    },
    last_changed: "2026-03-11T08:05:00.000Z",
    last_updated: "2026-03-11T08:05:00.000Z",
  },
  {
    entity_id: "sensor.living_room_humidity",
    state: "45",
    attributes: {
      friendly_name: "Living Room Humidity",
      unit_of_measurement: "%",
      device_class: "humidity",
      state_class: "measurement",
      room: "living_room",
    },
    last_changed: "2026-03-11T08:05:00.000Z",
    last_updated: "2026-03-11T08:05:00.000Z",
  },

  // ── Bedroom ────────────────────────────────────────────────
  {
    entity_id: "light.bedroom_ceiling",
    state: "off",
    attributes: {
      friendly_name: "Bedroom Ceiling Light",
      brightness: 0,
      color_temp: 300,
      supported_features: 63,
      device_class: "light",
      room: "bedroom",
    },
    last_changed: "2026-03-11T06:00:00.000Z",
    last_updated: "2026-03-11T06:00:00.000Z",
  },
  {
    entity_id: "switch.bedroom_fan",
    state: "off",
    attributes: {
      friendly_name: "Bedroom Fan",
      device_class: "switch",
      room: "bedroom",
    },
    last_changed: "2026-03-11T06:00:00.000Z",
    last_updated: "2026-03-11T06:00:00.000Z",
  },
  {
    entity_id: "sensor.bedroom_temperature",
    state: "21.0",
    attributes: {
      friendly_name: "Bedroom Temperature",
      unit_of_measurement: "°C",
      device_class: "temperature",
      state_class: "measurement",
      room: "bedroom",
    },
    last_changed: "2026-03-11T08:00:00.000Z",
    last_updated: "2026-03-11T08:00:00.000Z",
  },

  // ── Kitchen ────────────────────────────────────────────────
  {
    entity_id: "light.kitchen_main",
    state: "on",
    attributes: {
      friendly_name: "Kitchen Main Light",
      brightness: 255,
      color_temp: 400,
      supported_features: 63,
      device_class: "light",
      room: "kitchen",
    },
    last_changed: "2026-03-11T07:00:00.000Z",
    last_updated: "2026-03-11T07:00:00.000Z",
  },
  {
    entity_id: "sensor.kitchen_temperature",
    state: "23.8",
    attributes: {
      friendly_name: "Kitchen Temperature",
      unit_of_measurement: "°C",
      device_class: "temperature",
      state_class: "measurement",
      room: "kitchen",
    },
    last_changed: "2026-03-11T08:03:00.000Z",
    last_updated: "2026-03-11T08:03:00.000Z",
  },
  {
    entity_id: "sensor.kitchen_motion",
    state: "off",
    attributes: {
      friendly_name: "Kitchen Motion Sensor",
      device_class: "motion",
      room: "kitchen",
    },
    last_changed: "2026-03-11T07:55:00.000Z",
    last_updated: "2026-03-11T07:55:00.000Z",
  },

  // ── Bathroom ───────────────────────────────────────────────
  {
    entity_id: "light.bathroom",
    state: "off",
    attributes: {
      friendly_name: "Bathroom Light",
      brightness: 0,
      supported_features: 1,
      device_class: "light",
      room: "bathroom",
    },
    last_changed: "2026-03-11T06:30:00.000Z",
    last_updated: "2026-03-11T06:30:00.000Z",
  },

  // ── Thermostat (whole house) ───────────────────────────────
  {
    entity_id: "climate.house_thermostat",
    state: "heat",
    attributes: {
      friendly_name: "House Thermostat",
      temperature: 22,
      current_temperature: 21.5,
      hvac_modes: ["off", "heat", "cool", "auto"],
      min_temp: 16,
      max_temp: 30,
      target_temp_step: 0.5,
      device_class: "thermostat",
      room: "hallway",
    },
    last_changed: "2026-03-11T07:00:00.000Z",
    last_updated: "2026-03-11T07:00:00.000Z",
  },
];
