import { Router, type IRouter } from "express";
import { z } from "zod";

const router: IRouter = Router();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? "http://127.0.0.1:8090";

const MachineReadingSchema = z.object({
  machineId: z.string(),
  machineType: z.string(),
  sensors: z.record(z.string(), z.number())
});

const PredictRequestSchema = z.object({
  machines: z.array(MachineReadingSchema)
});

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function deg(value: number, nominal: number, range: number): number {
  return clamp(Math.abs(value - nominal) / range, 0, 1);
}

function degHigh(value: number, nominal: number, range: number): number {
  return clamp((value - nominal) / range, 0, 1);
}

function degLow(value: number, nominal: number, range: number): number {
  return clamp((nominal - value) / range, 0, 1);
}

type Degradation = { total: number; scores: Record<string, number> };

function hydrapulperDeg(s: Record<string, number>): Degradation {
  const consistency  = deg(s.consistency_pct   ?? 4,    4,    3)    * 0.40;
  const vibration    = degHigh(s.vibration_mms ?? 1.8,  1.8,  3.2)  * 0.25;
  const temperature  = degHigh(s.temperature_c ?? 65,   65,   35)   * 0.20;
  const motorCurrent = degHigh(s.motor_current_a ?? 45, 45,   30)   * 0.15;
  return { total: consistency + vibration + temperature + motorCurrent, scores: { consistency, vibration, temperature, motorCurrent } };
}

function digesterDeg(s: Record<string, number>): Degradation {
  const bottomTemp  = deg(s.bottom_temp_c  ?? 165,  165,  25)   * 0.40;
  const pressure    = degHigh(s.pressure_bar ?? 8.5, 8.5,  3.5)  * 0.20;
  const steamFlow   = degHigh(s.steam_flow_kghr ?? 2500, 2500, 1500) * 0.20;
  const topTemp     = degHigh(s.top_temp_c ?? 155,  155,  30)   * 0.20;
  return { total: bottomTemp + pressure + steamFlow + topTemp, scores: { bottomTemp, pressure, steamFlow, topTemp } };
}

function pressureScreenDeg(s: Record<string, number>): Degradation {
  const diffPressure = degHigh(s.differential_pressure_bar ?? 0.7, 0.7, 1.1) * 0.40;
  const vibration    = degHigh(s.vibration_mms ?? 1.5,  1.5, 3.0)  * 0.25;
  const motorCurrent = degHigh(s.motor_current_a ?? 38, 38,  27)   * 0.20;
  const consistency  = degHigh(s.consistency_pct ?? 3.5, 3.5, 3.0) * 0.15;
  return { total: diffPressure + vibration + motorCurrent + consistency, scores: { diffPressure, vibration, motorCurrent, consistency } };
}

function paperMachineDeg(s: Record<string, number>): Degradation {
  const moisture   = deg(s.moisture_pct  ?? 5,    5,    5)    * 0.35;
  const thickness  = deg(s.thickness_mm  ?? 0.11, 0.11, 0.06) * 0.25;
  const vibration  = degHigh(s.vibration_mms ?? 2.0, 2.0, 3.0)  * 0.20;
  const temperature = degHigh(s.temperature_c ?? 72, 72, 33)   * 0.20;
  return { total: moisture + thickness + vibration + temperature, scores: { moisture, thickness, vibration, temperature } };
}

function dryerDeg(s: Record<string, number>): Degradation {
  const outletMoisture = degHigh(s.outlet_moisture_pct ?? 5, 5,   7)    * 0.40;
  const cyl1           = degHigh(s.cyl1_temp_c ?? 120,       120, 40)   * 0.20;
  const cyl2           = degHigh(s.cyl2_temp_c ?? 125,       125, 40)   * 0.20;
  const condensate     = degHigh(s.condensate_level_pct ?? 45, 45, 47)  * 0.20;
  return { total: outletMoisture + cyl1 + cyl2 + condensate, scores: { outletMoisture, cyl1, cyl2, condensate } };
}

function calenderDeg(s: Record<string, number>): Degradation {
  const thickness   = deg(s.thickness_mm ?? 0.10, 0.10, 0.06) * 0.40;
  const nipPressure = degHigh(s.nip_pressure_knpm ?? 80, 80, 55)       * 0.25;
  const rollTemp    = degHigh(s.roll_temp_c ?? 85,       85, 40)        * 0.20;
  const vibration   = degHigh(s.vibration_mms ?? 1.4,   1.4, 2.8)      * 0.15;
  return { total: thickness + nipPressure + rollTemp + vibration, scores: { thickness, nipPressure, rollTemp, vibration } };
}

function coolingDeg(s: Record<string, number>): Degradation {
  const flow       = degLow(s.coolant_flow_lpm ?? 450,         450, 270) * 0.35;
  const inTemp     = degHigh(s.coolant_in_temp_c ?? 22,         22,  20)  * 0.25;
  const pumpCurr   = degHigh(s.pump_current_a ?? 22,            22,  20)  * 0.20;
  const efficiency = degLow(s.cooling_efficiency_delta_t ?? 13, 13,  9)  * 0.20;
  return { total: flow + inTemp + pumpCurr + efficiency, scores: { flow, inTemp, pumpCurr, efficiency } };
}

const DEGRADATION_FNS: Record<string, (s: Record<string, number>) => Degradation> = {
  hydrapulper:    hydrapulperDeg,
  digester:       digesterDeg,
  pressure_screen: pressureScreenDeg,
  paper_machine:  paperMachineDeg,
  dryer:          dryerDeg,
  calender:       calenderDeg,
  cooling:        coolingDeg
};

const ALERTS: Record<string, Array<{ key: string; test: (v: number) => boolean; msg: string }>> = {
  hydrapulper: [
    { key: "consistency_pct",  test: (v) => v > 5.5,  msg: "High consistency — risk of pulper overload" },
    { key: "consistency_pct",  test: (v) => v < 2,    msg: "Low consistency — dilution anomaly" },
    { key: "vibration_mms",    test: (v) => v > 3.5,  msg: "High vibration on rotor" },
    { key: "temperature_c",    test: (v) => v > 85,   msg: "Motor temperature elevated" },
    { key: "rotor_speed_rpm",  test: (v) => v < 1200, msg: "Rotor speed below setpoint" },
  ],
  digester: [
    { key: "bottom_temp_c",   test: (v) => v > 175,  msg: "Bottom zone overtemperature" },
    { key: "bottom_temp_c",   test: (v) => v < 145,  msg: "Bottom zone undertemperature" },
    { key: "pressure_bar",    test: (v) => v > 10,   msg: "Digester pressure elevated" },
    { key: "steam_flow_kghr", test: (v) => v > 3200, msg: "Excess steam consumption" },
    { key: "ph",              test: (v) => v < 12,   msg: "pH below target range" },
  ],
  pressure_screen: [
    { key: "differential_pressure_bar", test: (v) => v > 1.2, msg: "High differential pressure — screen may be blinding" },
    { key: "differential_pressure_bar", test: (v) => v > 1.8, msg: "Critical ΔP — risk of screen plate damage" },
    { key: "vibration_mms",             test: (v) => v > 3.0, msg: "High screen vibration" },
    { key: "motor_current_a",           test: (v) => v > 52,  msg: "Motor overload detected" },
    { key: "flow_m3hr",                 test: (v) => v < 120, msg: "Low throughput — check feed consistency" },
  ],
  paper_machine: [
    { key: "moisture_pct",    test: (v) => v > 7.5,  msg: "Sheet moisture above spec" },
    { key: "thickness_mm",    test: (v) => v > 0.14, msg: "Sheet thickness out of tolerance (high)" },
    { key: "thickness_mm",    test: (v) => v < 0.07, msg: "Sheet thickness out of tolerance (low)" },
    { key: "vibration_mms",   test: (v) => v > 3.5,  msg: "Frame vibration elevated" },
    { key: "web_tension_n",   test: (v) => v < 800,  msg: "Web tension low — break risk" },
  ],
  dryer: [
    { key: "outlet_moisture_pct",  test: (v) => v > 8,   msg: "Outlet moisture above spec" },
    { key: "cyl1_temp_c",          test: (v) => v > 145, msg: "Cylinder 1 overtemperature" },
    { key: "cyl2_temp_c",          test: (v) => v > 150, msg: "Cylinder 2 overtemperature" },
    { key: "condensate_level_pct", test: (v) => v > 80,  msg: "Condensate build-up — drainage issue" },
    { key: "vibration_mms",        test: (v) => v > 3.0, msg: "Dryer section vibration" },
  ],
  calender: [
    { key: "thickness_mm",      test: (v) => v > 0.13, msg: "Caliper exceeds upper limit" },
    { key: "thickness_mm",      test: (v) => v < 0.07, msg: "Caliper below lower limit" },
    { key: "nip_pressure_knpm", test: (v) => v > 110,  msg: "Nip pressure elevated" },
    { key: "roll_temp_c",       test: (v) => v > 105,  msg: "Roll surface overtemperature" },
    { key: "smoothness_pct",    test: (v) => v < 60,   msg: "Surface smoothness below spec" },
  ],
  cooling: [
    { key: "coolant_flow_lpm",           test: (v) => v < 300, msg: "Coolant flow low — pump check needed" },
    { key: "coolant_in_temp_c",          test: (v) => v > 32,  msg: "Coolant inlet temperature high" },
    { key: "cooling_efficiency_delta_t", test: (v) => v < 8,   msg: "Cooling efficiency degraded" },
    { key: "pump_current_a",             test: (v) => v > 32,  msg: "Cooling pump overload" },
  ]
};

function getAlerts(reading: z.infer<typeof MachineReadingSchema>): string[] {
  const alertDefs = ALERTS[reading.machineType] ?? [];
  return alertDefs
    .filter(({ key, test }) => key in reading.sensors && test(reading.sensors[key]))
    .map(({ msg }) => msg);
}

function jsFallbackPredict(reading: z.infer<typeof MachineReadingSchema>) {
  const fn = DEGRADATION_FNS[reading.machineType] ?? coolingDeg;
  const { total } = fn(reading.sensors);
  const degradation = clamp(total, 0, 1);

  const rul           = parseFloat(Math.max(0.5, 720 * Math.pow(1 - degradation, 2.5)).toFixed(1));
  const health        = Math.round(Math.max(10, 100 - degradation * 90));
  const productionLoss = parseFloat((degradation * 15).toFixed(2));
  const confidence    = Math.round(clamp(degradation * 130, 20, 98));
  const alerts        = getAlerts(reading);
  const anomaly       = degradation > 0.35;
  const status: "Good" | "Warning" | "Critical" =
    health >= 80 ? "Good" : health >= 55 ? "Warning" : "Critical";

  return {
    machineId:      reading.machineId,
    machineType:    reading.machineType,
    rul,
    health,
    status,
    productionLoss,
    anomaly,
    confidence,
    degradation:    parseFloat(degradation.toFixed(4)),
    alerts,
    source:         "js-fallback"
  };
}

async function mlPredict(machines: z.infer<typeof MachineReadingSchema>[]) {
  const res = await fetch(`${ML_SERVICE_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ machines }),
    signal: AbortSignal.timeout(4000)
  });
  if (!res.ok) throw new Error(`ML service returned ${res.status}`);
  const data = await res.json() as { predictions: Array<Record<string, unknown>> };
  return data.predictions;
}

router.post("/predict", async (req, res) => {
  const parsed = PredictRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  const { machines } = parsed.data;
  let predictions: ReturnType<typeof jsFallbackPredict>[];
  let source = "keras-model";

  try {
    const mlPreds = await mlPredict(machines);

    predictions = mlPreds.map((mlP, i) => {
      const reading = machines[i];
      const alerts  = getAlerts(reading);
      const health  = typeof mlP.health === "number" ? mlP.health : 75;
      const rul     = typeof mlP.rul    === "number" ? mlP.rul    : 360;
      const productionLoss = typeof mlP.productionLoss === "number" ? mlP.productionLoss : 0;
      const anomaly = typeof mlP.anomaly === "boolean" ? mlP.anomaly : health < 55;
      const confidence = typeof mlP.confidence === "number" ? mlP.confidence : 80;
      const status: "Good" | "Warning" | "Critical" =
        health >= 80 ? "Good" : health >= 55 ? "Warning" : "Critical";

      return {
        machineId:      reading.machineId,
        machineType:    reading.machineType,
        rul,
        health,
        status,
        productionLoss,
        anomaly,
        confidence,
        degradation:    parseFloat(((100 - health) / 100).toFixed(4)),
        alerts,
        source:         "keras-model"
      };
    });
  } catch {
    source = "js-fallback";
    predictions = machines.map(jsFallbackPredict);
  }

  const machinePreds      = predictions.filter((p) => p.machineType !== "cooling");
  const anomalyCount      = machinePreds.filter((p) => p.anomaly).length;
  const avgRul            = machinePreds.length
    ? parseFloat((machinePreds.reduce((s, p) => s + p.rul, 0) / machinePreds.length).toFixed(1))
    : 0;
  const totalAlerts       = predictions.reduce((s, p) => s + p.alerts.length, 0);
  const avgProductionLoss = machinePreds.length
    ? parseFloat((machinePreds.reduce((s, p) => s + p.productionLoss, 0) / machinePreds.length).toFixed(2))
    : 0;

  res.json({
    predictions,
    aggregates: { anomalyCount, avgRul, totalAlerts, avgProductionLoss },
    source
  });
});

export default router;
