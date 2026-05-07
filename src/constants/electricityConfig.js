export const BASE_WATTS = {
  // Lighting (5 Overhead Bars)
  led_bar_1: 450,
  led_bar_2: 450,
  led_bar_3: 450,
  led_bar_4: 450,
  led_bar_5: 450,
  
  // Climate (6 Ventilation Fans + 2 ACs)
  ac_unit_1: 850,
  ac_unit_2: 850,
  vent_fan_1: 85,
  vent_fan_2: 85,
  vent_fan_3: 85,
  vent_fan_4: 85,
  vent_fan_5: 85,
  vent_fan_6: 85,

  // Water & Pumps (2 Main Pumps + 4 Dosing Pumps)
  main_pump: 320,
  backup_pump: 320,
  dosing_n: 45,
  dosing_p: 45,
  dosing_k: 45,
  dosing_ph: 45,

  // Sprayers (4 Rows of 12)
  sprayer_row_a: 120,
  sprayer_row_b: 120,
  sprayer_row_c: 120,
  sprayer_row_d: 120,

  // System
  sensors_hub: 15,
};

export const INITIAL_DEVICE_REGISTRY = {
  // === LIGHTING ===
  led_bar_1: { name: "Grow Light Bar - Row 1", groupId: "lighting", groupName: "LED Lighting", category: "lighting", watts_live: 0, watts_threshold: 500, watts_suggested: 450, priority: "high", status: "on" },
  led_bar_2: { name: "Grow Light Bar - Row 2", groupId: "lighting", groupName: "LED Lighting", category: "lighting", watts_live: 0, watts_threshold: 500, watts_suggested: 450, priority: "high", status: "on" },
  led_bar_3: { name: "Grow Light Bar - Row 3", groupId: "lighting", groupName: "LED Lighting", category: "lighting", watts_live: 0, watts_threshold: 500, watts_suggested: 450, priority: "high", status: "on" },
  led_bar_4: { name: "Grow Light Bar - Row 4", groupId: "lighting", groupName: "LED Lighting", category: "lighting", watts_live: 0, watts_threshold: 500, watts_suggested: 450, priority: "high", status: "on" },
  led_bar_5: { name: "Grow Light Bar - Row 5", groupId: "lighting", groupName: "LED Lighting", category: "lighting", watts_live: 0, watts_threshold: 500, watts_suggested: 450, priority: "high", status: "on" },

  // === CLIMATE ===
  ac_unit_1: { name: "HVAC Unit - West Side", groupId: "climate", groupName: "Climate Control", category: "climate", watts_live: 0, watts_threshold: 1000, watts_suggested: 850, priority: "high", status: "on" },
  ac_unit_2: { name: "HVAC Unit - East Side", groupId: "climate", groupName: "Climate Control", category: "climate", watts_live: 0, watts_threshold: 1000, watts_suggested: 850, priority: "high", status: "on" },
  
  // === FANS ===
  vent_fan_1: { name: "Ventilation Fan 1", groupId: "fans", groupName: "Ventilation Fans", category: "climate", watts_live: 0, watts_threshold: 100, watts_suggested: 85, priority: "medium", status: "on" },
  vent_fan_2: { name: "Ventilation Fan 2", groupId: "fans", groupName: "Ventilation Fans", category: "climate", watts_live: 0, watts_threshold: 100, watts_suggested: 85, priority: "medium", status: "on" },
  vent_fan_3: { name: "Ventilation Fan 3", groupId: "fans", groupName: "Ventilation Fans", category: "climate", watts_live: 0, watts_threshold: 100, watts_suggested: 85, priority: "medium", status: "on" },
  vent_fan_4: { name: "Ventilation Fan 4", groupId: "fans", groupName: "Ventilation Fans", category: "climate", watts_live: 0, watts_threshold: 100, watts_suggested: 85, priority: "medium", status: "on" },
  vent_fan_5: { name: "Ventilation Fan 5", groupId: "fans", groupName: "Ventilation Fans", category: "climate", watts_live: 0, watts_threshold: 100, watts_suggested: 85, priority: "medium", status: "on" },
  vent_fan_6: { name: "Ventilation Fan 6", groupId: "fans", groupName: "Ventilation Fans", category: "climate", watts_live: 0, watts_threshold: 100, watts_suggested: 85, priority: "medium", status: "on" },

  // === PUMPS ===
  main_pump: { name: "Main Irrigation Pump", groupId: "pumps", groupName: "Water Pumps", category: "water", watts_live: 0, watts_threshold: 400, watts_suggested: 320, priority: "high", status: "on" },
  backup_pump: { name: "Backup Emergency Pump", groupId: "pumps", groupName: "Water Pumps", category: "water", watts_live: 0, watts_threshold: 400, watts_suggested: 320, priority: "medium", status: "off" },
  dosing_n: { name: "Nutrient Doser (N)", groupId: "pumps", groupName: "Water Pumps", category: "water", watts_live: 0, watts_threshold: 60, watts_suggested: 45, priority: "medium", status: "on" },
  dosing_p: { name: "Nutrient Doser (P)", groupId: "pumps", groupName: "Water Pumps", category: "water", watts_live: 0, watts_threshold: 60, watts_suggested: 45, priority: "medium", status: "on" },
  dosing_k: { name: "Nutrient Doser (K)", groupId: "pumps", groupName: "Water Pumps", category: "water", watts_live: 0, watts_threshold: 60, watts_suggested: 45, priority: "medium", status: "on" },
  dosing_ph: { name: "pH Regulation Pump", groupId: "pumps", groupName: "Water Pumps", category: "water", watts_live: 0, watts_threshold: 60, watts_suggested: 45, priority: "medium", status: "on" },

  // === SPRAYERS ===
  sprayer_row_a: { name: "Mist System - Row A", groupId: "sprayers", groupName: "Mist Sprayers", category: "water", watts_live: 0, watts_threshold: 150, watts_suggested: 120, priority: "low", status: "on", schedulable: true },
  sprayer_row_b: { name: "Mist System - Row B", groupId: "sprayers", groupName: "Mist Sprayers", category: "water", watts_live: 0, watts_threshold: 150, watts_suggested: 120, priority: "low", status: "on", schedulable: true },
  sprayer_row_c: { name: "Mist System - Row C", groupId: "sprayers", groupName: "Mist Sprayers", category: "water", watts_live: 0, watts_threshold: 150, watts_suggested: 120, priority: "low", status: "on", schedulable: true },
  sprayer_row_d: { name: "Mist System - Row D", groupId: "sprayers", groupName: "Mist Sprayers", category: "water", watts_live: 0, watts_threshold: 150, watts_suggested: 120, priority: "low", status: "on", schedulable: true },

  // === SYSTEM ===
  sensors_hub: { name: "Monitoring Control Hub", groupId: "system", groupName: "System Infrastructure", category: "system", watts_live: 0, watts_threshold: 40, watts_suggested: 15, priority: "critical", status: "on" },
};

export const TARIFF_RATES = {
  peak_rate: 0.571,
  offpeak_rate: 0.244
};

export const isPeak = (hour) => hour >= 7 && hour < 23;
