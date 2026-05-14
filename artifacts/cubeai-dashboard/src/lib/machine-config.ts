export interface SensorMeta {
  label: string;
  unit: string;
  nominal: number;
  warnHigh?: number;
  critHigh?: number;
  warnLow?: number;
  critLow?: number;
  jitter: number;
  min: number;
  max: number;
  isCritical?: boolean;
  dec?: number;
}

export interface MachineConfig {
  machineId: string;
  machineName: string;
  area: string;
  machineType: string;
  sensors: Record<string, SensorMeta>;
  initial: Record<string, number>;
}

export type SensorStatus = "Good" | "Warning" | "Critical";

export function getSensorStatus(meta: SensorMeta, value: number): SensorStatus {
  if (meta.critHigh !== undefined && value >= meta.critHigh) return "Critical";
  if (meta.critLow  !== undefined && value <= meta.critLow)  return "Critical";
  if (meta.warnHigh !== undefined && value >= meta.warnHigh) return "Warning";
  if (meta.warnLow  !== undefined && value <= meta.warnLow)  return "Warning";
  return "Good";
}

export function fmtSensor(meta: SensorMeta, value: number): string {
  const d = meta.dec ?? 1;
  const str = d === 0 ? String(Math.round(value)) : value.toFixed(d);
  return meta.unit ? `${str} ${meta.unit}` : str;
}

export const MACHINE_CONFIGS: MachineConfig[] = [
  {
    machineId: "Machine 01",
    machineName: "Hydrapulper HC-2000",
    area: "Stock Prep",
    machineType: "hydrapulper",
    sensors: {
      temperature_c:   { label: "Temperature",  unit: "°C",   nominal: 65,   warnHigh: 85,   critHigh: 100,  jitter: 1.5,   min: 35,   max: 120,   dec: 0 },
      motor_current_a: { label: "Motor Current", unit: "A",    nominal: 45,   warnHigh: 60,   critHigh: 75,   jitter: 1.2,   min: 10,   max: 90,    dec: 1 },
      voltage_v:       { label: "Voltage",       unit: "V",    nominal: 380,  warnLow: 360,   critLow: 340,   warnHigh: 400, critHigh: 420, jitter: 3, min: 300, max: 450, dec: 0 },
      power_kw:        { label: "Power",         unit: "kW",   nominal: 18,   warnHigh: 25,   critHigh: 32,   jitter: 0.5,   min: 5,    max: 40,    dec: 1 },
      pulp_level_pct:  { label: "Pulp Level",    unit: "%",    nominal: 60,   warnLow: 20,    critLow: 10,    warnHigh: 90,  critHigh: 95, jitter: 1.5, min: 0, max: 100, dec: 0 },
      water_flow_m3hr: { label: "Water Flow",    unit: "m³/h", nominal: 12,   warnLow: 8,     critLow: 5,     warnHigh: 18,  critHigh: 22, jitter: 0.4, min: 0, max: 30, dec: 1 },
      consistency_pct: { label: "Consistency",   unit: "%",    nominal: 4,    warnHigh: 5.5,  critHigh: 7,    warnLow: 2,    critLow: 1,   jitter: 0.1, min: 0, max: 12, isCritical: true, dec: 1 },
      vibration_mms:   { label: "Vibration",     unit: "mm/s", nominal: 1.8,  warnHigh: 3.5,  critHigh: 5.0,  jitter: 0.15,  min: 0.2,  max: 8,     dec: 2 },
      rotor_speed_rpm: { label: "Rotor Speed",   unit: "rpm",  nominal: 1450, warnLow: 1200,  critLow: 1000,  warnHigh: 1600, critHigh: 1800, jitter: 25, min: 800, max: 2000, dec: 0 },
    },
    initial: {
      temperature_c: 65, motor_current_a: 45, voltage_v: 380, power_kw: 18,
      pulp_level_pct: 60, water_flow_m3hr: 12, consistency_pct: 4.0,
      vibration_mms: 1.8, rotor_speed_rpm: 1450
    }
  },
  {
    machineId: "Machine 02",
    machineName: "Continuous Digester CD-1200",
    area: "Pulping",
    machineType: "digester",
    sensors: {
      top_temp_c:               { label: "Top Temperature",    unit: "°C",    nominal: 155,  warnHigh: 170,  critHigh: 185,  jitter: 1.5,  min: 100, max: 220, dec: 0 },
      bottom_temp_c:            { label: "Bottom Temperature", unit: "°C",    nominal: 165,  warnHigh: 175,  critHigh: 190,  warnLow: 145, critLow: 130, jitter: 1.5, min: 80, max: 220, isCritical: true, dec: 0 },
      pressure_bar:             { label: "Pressure",           unit: "bar",   nominal: 8.5,  warnHigh: 10,   critHigh: 12,   jitter: 0.2,  min: 2,   max: 15,  dec: 1 },
      liquor_flow_m3hr:         { label: "Liquor Flow",        unit: "m³/h",  nominal: 25,   warnLow: 18,    critLow: 12,    warnHigh: 35, critHigh: 42, jitter: 0.8, min: 0, max: 60, dec: 1 },
      chip_level_pct:           { label: "Chip Level",         unit: "%",     nominal: 70,   warnLow: 30,    critLow: 15,    warnHigh: 90, critHigh: 95, jitter: 1.5, min: 0, max: 100, dec: 0 },
      ph:                       { label: "pH",                 unit: "",      nominal: 13.5, warnLow: 12,    critLow: 11,    warnHigh: 14.5, critHigh: 15, jitter: 0.05, min: 9, max: 15.5, dec: 1 },
      digester_consistency_pct: { label: "Consistency",        unit: "%",     nominal: 12,   warnLow: 8,     critLow: 5,     warnHigh: 18, critHigh: 22, jitter: 0.3, min: 0, max: 30, dec: 1 },
      density_gcm3:             { label: "Density",            unit: "g/cm³", nominal: 1.05, warnHigh: 1.15, critHigh: 1.25, jitter: 0.01, min: 0.8, max: 1.5, dec: 2 },
      steam_flow_kghr:          { label: "Steam Flow",         unit: "kg/h",  nominal: 2500, warnHigh: 3200, critHigh: 4000, jitter: 50,   min: 500, max: 5000, dec: 0 },
    },
    initial: {
      top_temp_c: 162, bottom_temp_c: 172, pressure_bar: 9.2,
      liquor_flow_m3hr: 22, chip_level_pct: 65, ph: 13.4,
      digester_consistency_pct: 11.5, density_gcm3: 1.07, steam_flow_kghr: 2800
    }
  },
  {
    machineId: "Machine 03",
    machineName: "Pressure Screen PS-800",
    area: "Screening",
    machineType: "pressure_screen",
    sensors: {
      inlet_pressure_bar:        { label: "Inlet Pressure",        unit: "bar",  nominal: 3.5,  warnHigh: 4.5,  critHigh: 5.5,  jitter: 0.10, min: 0.5, max: 8,   dec: 2 },
      outlet_pressure_bar:       { label: "Outlet Pressure",       unit: "bar",  nominal: 2.8,  warnHigh: 3.8,  critHigh: 4.8,  jitter: 0.10, min: 0.5, max: 7,   dec: 2 },
      differential_pressure_bar: { label: "Differential Pressure", unit: "bar",  nominal: 0.7,  warnHigh: 1.2,  critHigh: 1.8,  jitter: 0.05, min: 0,   max: 3,   isCritical: true, dec: 2 },
      flow_m3hr:                 { label: "Flow",                  unit: "m³/h", nominal: 180,  warnLow: 120,   critLow: 80,    warnHigh: 240, critHigh: 280, jitter: 4, min: 0, max: 350, dec: 0 },
      consistency_pct:           { label: "Consistency",           unit: "%",    nominal: 3.5,  warnHigh: 5,    critHigh: 6.5,  jitter: 0.10, min: 0,   max: 10,  dec: 1 },
      vibration_mms:             { label: "Vibration",             unit: "mm/s", nominal: 1.5,  warnHigh: 3.0,  critHigh: 4.5,  jitter: 0.12, min: 0.2, max: 7,   dec: 2 },
      motor_current_a:           { label: "Motor Current",         unit: "A",    nominal: 38,   warnHigh: 52,   critHigh: 65,   jitter: 1.2,  min: 10,  max: 80,  dec: 1 },
    },
    initial: {
      inlet_pressure_bar: 4.8, outlet_pressure_bar: 3.5,
      differential_pressure_bar: 1.5, flow_m3hr: 130,
      consistency_pct: 4.5, vibration_mms: 5.6, motor_current_a: 62
    }
  },
  {
    machineId: "Machine 14",
    machineName: "Paper Machine PM-1",
    area: "Formation",
    machineType: "paper_machine",
    sensors: {
      speed_mpm:            { label: "Speed",            unit: "m/min", nominal: 850,  warnLow: 600,   critLow: 400,   warnHigh: 1000, critHigh: 1100, jitter: 15,    min: 200,  max: 1200,  dec: 0 },
      moisture_pct:         { label: "Moisture",         unit: "%",     nominal: 5,    warnHigh: 7.5,  critHigh: 10,   warnLow: 2,     critLow: 1,     jitter: 0.15,  min: 0,    max: 18,    isCritical: true, dec: 1 },
      basis_weight_gsm:     { label: "Basis Weight",     unit: "g/m²",  nominal: 80,   warnLow: 70,    critLow: 60,    warnHigh: 90,   critHigh: 100,  jitter: 0.8,   min: 40,   max: 120,   dec: 1 },
      thickness_mm:         { label: "Thickness",        unit: "mm",    nominal: 0.11, warnHigh: 0.14, critHigh: 0.17, warnLow: 0.07,  critLow: 0.05,  jitter: 0.003, min: 0.03, max: 0.25,  isCritical: true, dec: 3 },
      web_tension_n:        { label: "Web Tension",      unit: "N",     nominal: 1200, warnLow: 800,   critLow: 500,   warnHigh: 1600, critHigh: 2000, jitter: 30,    min: 100,  max: 2500,  dec: 0 },
      temperature_c:        { label: "Temperature",      unit: "°C",    nominal: 72,   warnHigh: 90,   critHigh: 105,  jitter: 1.2,   min: 40,   max: 130,   dec: 0 },
      stock_flow_m3hr:      { label: "Stock Flow",       unit: "m³/h",  nominal: 450,  warnLow: 320,   critLow: 220,   warnHigh: 580,  critHigh: 680,  jitter: 8,     min: 100,  max: 800,   dec: 0 },
      headbox_pressure_bar: { label: "Headbox Pressure", unit: "bar",   nominal: 2.2,  warnLow: 1.5,   critLow: 1.0,   warnHigh: 3.0,  critHigh: 3.8,  jitter: 0.05,  min: 0.5,  max: 5,     dec: 2 },
      vibration_mms:        { label: "Vibration",        unit: "mm/s",  nominal: 2.0,  warnHigh: 3.5,  critHigh: 5.0,  jitter: 0.15,  min: 0.2,  max: 8,     dec: 2 },
    },
    initial: {
      speed_mpm: 850, moisture_pct: 5.0, basis_weight_gsm: 80, thickness_mm: 0.110,
      web_tension_n: 1200, temperature_c: 72, stock_flow_m3hr: 450,
      headbox_pressure_bar: 2.2, vibration_mms: 1.5
    }
  },
  {
    machineId: "Machine 07",
    machineName: "Dryer Cylinders DC-600",
    area: "Drying",
    machineType: "dryer",
    sensors: {
      cyl1_temp_c:          { label: "Cylinder 1 Temp",  unit: "°C",    nominal: 120,  warnHigh: 145,  critHigh: 160,  jitter: 1.5,  min: 60,  max: 200, dec: 0 },
      cyl2_temp_c:          { label: "Cylinder 2 Temp",  unit: "°C",    nominal: 125,  warnHigh: 150,  critHigh: 165,  jitter: 1.5,  min: 60,  max: 200, dec: 0 },
      condensate_level_pct: { label: "Condensate Level", unit: "%",     nominal: 45,   warnHigh: 80,   critHigh: 92,   jitter: 1.5,  min: 0,   max: 100, dec: 0 },
      steam_pressure_bar:   { label: "Steam Pressure",   unit: "bar",   nominal: 4.5,  warnHigh: 6.0,  critHigh: 7.5,  jitter: 0.10, min: 0.5, max: 10,  dec: 1 },
      steam_flow_kghr:      { label: "Steam Flow",       unit: "kg/h",  nominal: 1800, warnHigh: 2400, critHigh: 3000, jitter: 40,   min: 200, max: 4000, dec: 0 },
      inlet_moisture_pct:   { label: "Inlet Moisture",   unit: "%",     nominal: 55,   warnLow: 40,    critLow: 30,    warnHigh: 70, critHigh: 80, jitter: 1.2, min: 10, max: 95, dec: 0 },
      outlet_moisture_pct:  { label: "Outlet Moisture",  unit: "%",     nominal: 5,    warnHigh: 8,    critHigh: 12,   warnLow: 2,   critLow: 1,   jitter: 0.2, min: 0, max: 25, isCritical: true, dec: 1 },
      speed_mpm:            { label: "Speed",            unit: "m/min", nominal: 850,  warnLow: 600,   critLow: 400,   warnHigh: 1000, critHigh: 1100, jitter: 15, min: 200, max: 1200, dec: 0 },
      humidity_pct:         { label: "Humidity",         unit: "%",     nominal: 65,   warnHigh: 85,   critHigh: 92,   jitter: 1.2,  min: 20,  max: 100, dec: 0 },
      vibration_mms:        { label: "Vibration",        unit: "mm/s",  nominal: 1.6,  warnHigh: 3.0,  critHigh: 4.5,  jitter: 0.12, min: 0.2, max: 7,   dec: 2 },
    },
    initial: {
      cyl1_temp_c: 138, cyl2_temp_c: 142, condensate_level_pct: 68,
      steam_pressure_bar: 5.5, steam_flow_kghr: 2200, inlet_moisture_pct: 52,
      outlet_moisture_pct: 7.2, speed_mpm: 820, humidity_pct: 72, vibration_mms: 3.7
    }
  },
  {
    machineId: "Machine 12",
    machineName: "Soft Calender SC-500",
    area: "Finishing",
    machineType: "calender",
    sensors: {
      nip_pressure_knpm: { label: "Nip Pressure",    unit: "kN/m",  nominal: 80,   warnHigh: 110,  critHigh: 135,  jitter: 2,     min: 20,  max: 160, dec: 0 },
      roll_temp_c:       { label: "Roll Temperature", unit: "°C",    nominal: 85,   warnHigh: 105,  critHigh: 125,  jitter: 1.2,  min: 40,  max: 150, dec: 0 },
      thickness_mm:      { label: "Thickness",        unit: "mm",    nominal: 0.10, warnHigh: 0.13, critHigh: 0.16, warnLow: 0.07, critLow: 0.05, jitter: 0.003, min: 0.03, max: 0.22, isCritical: true, dec: 3 },
      smoothness_pct:    { label: "Smoothness",       unit: "%",     nominal: 78,   warnLow: 60,    critLow: 45,    jitter: 1.5,  min: 20,  max: 100, dec: 0 },
      speed_mpm:         { label: "Speed",            unit: "m/min", nominal: 850,  warnLow: 600,   critLow: 400,   warnHigh: 1000, critHigh: 1100, jitter: 15, min: 200, max: 1200, dec: 0 },
      load_tons:         { label: "Load",             unit: "tons",  nominal: 55,   warnHigh: 75,   critHigh: 90,   jitter: 1.5,  min: 10,  max: 120, dec: 0 },
      vibration_mms:     { label: "Vibration",        unit: "mm/s",  nominal: 1.4,  warnHigh: 2.8,  critHigh: 4.2,  jitter: 0.10, min: 0.2, max: 6,   dec: 2 },
    },
    initial: {
      nip_pressure_knpm: 80, roll_temp_c: 85, thickness_mm: 0.100,
      smoothness_pct: 78, speed_mpm: 850, load_tons: 55, vibration_mms: 1.4
    }
  },
  {
    machineId: "Cooling System",
    machineName: "Cooling System",
    area: "Shared Block",
    machineType: "cooling",
    sensors: {
      coolant_in_temp_c:           { label: "Coolant In Temp",        unit: "°C",    nominal: 22,   warnHigh: 32,  critHigh: 42,  jitter: 0.5,  min: 10,  max: 55,  dec: 0 },
      coolant_out_temp_c:          { label: "Coolant Out Temp",       unit: "°C",    nominal: 35,   warnHigh: 48,  critHigh: 58,  jitter: 0.5,  min: 20,  max: 70,  dec: 0 },
      coolant_flow_lpm:            { label: "Coolant Flow",           unit: "L/min", nominal: 450,  warnLow: 300,  critLow: 180,  jitter: 8,    min: 50,  max: 600, dec: 0 },
      pump_current_a:              { label: "Pump Current",           unit: "A",     nominal: 22,   warnHigh: 32,  critHigh: 42,  jitter: 0.8,  min: 5,   max: 55,  dec: 1 },
      coolant_pressure_bar:        { label: "Coolant Pressure",       unit: "bar",   nominal: 3.0,  warnLow: 2.0,  critLow: 1.2,  warnHigh: 4.5, critHigh: 5.5, jitter: 0.08, min: 0.5, max: 7, dec: 1 },
      cooling_efficiency_delta_t:  { label: "Cooling Efficiency ΔT",  unit: "°C",    nominal: 13,   warnLow: 8,    critLow: 4,    jitter: 0.3,  min: 0,   max: 25,  dec: 1 },
    },
    initial: {
      coolant_in_temp_c: 22, coolant_out_temp_c: 35, coolant_flow_lpm: 450,
      pump_current_a: 22, coolant_pressure_bar: 3.0, cooling_efficiency_delta_t: 13
    }
  },
];
