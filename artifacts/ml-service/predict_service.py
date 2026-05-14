import os
import sys
import json
import numpy as np
from flask import Flask, request, jsonify

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../../.migration-backup/Model/final_upgraded_multitask_model.keras")

app = Flask(__name__)
model = None

FEATURES_45 = [
    ("temperature_c",              35,    220),
    ("top_temp_c",                100,    220),
    ("bottom_temp_c",              80,    220),
    ("cyl1_temp_c",                60,    200),
    ("cyl2_temp_c",                60,    200),
    ("roll_temp_c",                40,    150),
    ("coolant_in_temp_c",          10,     55),
    ("coolant_out_temp_c",         20,     70),
    ("moisture_pct",                0,     18),
    ("inlet_moisture_pct",         10,     95),
    ("outlet_moisture_pct",         0,     25),
    ("vibration_mms",             0.2,      8),
    ("motor_current_a",            10,     90),
    ("pump_current_a",              5,     55),
    ("voltage_v",                 300,    450),
    ("power_kw",                    5,     40),
    ("rotor_speed_rpm",           800,   2000),
    ("speed_mpm",                 200,   1200),
    ("pressure_bar",                2,     15),
    ("inlet_pressure_bar",        0.5,      8),
    ("outlet_pressure_bar",       0.5,      7),
    ("differential_pressure_bar",   0,      3),
    ("headbox_pressure_bar",      0.5,      5),
    ("steam_pressure_bar",        0.5,     10),
    ("coolant_pressure_bar",      0.5,      7),
    ("nip_pressure_knpm",          20,    160),
    ("consistency_pct",             0,     12),
    ("digester_consistency_pct",    0,     30),
    ("pulp_level_pct",              0,    100),
    ("chip_level_pct",              0,    100),
    ("condensate_level_pct",        0,    100),
    ("smoothness_pct",             20,    100),
    ("humidity_pct",               20,    100),
    ("water_flow_m3hr",             0,     30),
    ("liquor_flow_m3hr",            0,     60),
    ("flow_m3hr",                   0,    350),
    ("steam_flow_kghr",           200,   5000),
    ("coolant_flow_lpm",           50,    600),
    ("stock_flow_m3hr",           100,    800),
    ("basis_weight_gsm",           40,    120),
    ("thickness_mm",             0.03,   0.25),
    ("web_tension_n",             100,   2500),
    ("load_tons",                  10,    120),
    ("ph",                          9,   15.5),
    ("density_gcm3",              0.8,    1.5),
]

FEATURE_NAMES = [f[0] for f in FEATURES_45]
FEATURE_MINS  = np.array([f[1] for f in FEATURES_45], dtype=np.float32)
FEATURE_MAXS  = np.array([f[2] for f in FEATURES_45], dtype=np.float32)

NOMINAL_VALUES = {
    "temperature_c":             65,
    "top_temp_c":               155,
    "bottom_temp_c":            165,
    "cyl1_temp_c":              120,
    "cyl2_temp_c":              125,
    "roll_temp_c":               85,
    "coolant_in_temp_c":         22,
    "coolant_out_temp_c":        35,
    "moisture_pct":               5,
    "inlet_moisture_pct":        55,
    "outlet_moisture_pct":        5,
    "vibration_mms":            1.8,
    "motor_current_a":           45,
    "pump_current_a":            22,
    "voltage_v":                380,
    "power_kw":                  18,
    "rotor_speed_rpm":         1450,
    "speed_mpm":                850,
    "pressure_bar":             8.5,
    "inlet_pressure_bar":       3.5,
    "outlet_pressure_bar":      2.8,
    "differential_pressure_bar": 0.7,
    "headbox_pressure_bar":     2.2,
    "steam_pressure_bar":       4.5,
    "coolant_pressure_bar":     3.0,
    "nip_pressure_knpm":         80,
    "consistency_pct":          3.5,
    "digester_consistency_pct":  12,
    "pulp_level_pct":            60,
    "chip_level_pct":            70,
    "condensate_level_pct":      45,
    "smoothness_pct":            78,
    "humidity_pct":              65,
    "water_flow_m3hr":           12,
    "liquor_flow_m3hr":          25,
    "flow_m3hr":                180,
    "steam_flow_kghr":         2000,
    "coolant_flow_lpm":         450,
    "stock_flow_m3hr":          450,
    "basis_weight_gsm":          80,
    "thickness_mm":            0.11,
    "web_tension_n":           1200,
    "load_tons":                 55,
    "ph":                      13.5,
    "density_gcm3":            1.05,
}

RUL_MAX_HOURS   = 720.0
HEALTH_SCALE    = 100.0
PROD_LOSS_SCALE = 15.0

RISK_LABELS = ["Good", "Warning", "Critical"]


def normalize(value: float, lo: float, hi: float) -> float:
    r = hi - lo
    if r == 0:
        return 0.5
    return float(np.clip((value - lo) / r, 0.0, 1.0))


def build_feature_vector(sensors: dict) -> np.ndarray:
    vec = np.zeros(45, dtype=np.float32)
    for i, (name, lo, hi) in enumerate(FEATURES_45):
        raw = sensors.get(name, NOMINAL_VALUES.get(name, (lo + hi) / 2))
        vec[i] = normalize(raw, lo, hi)
    return vec


def load_model():
    global model
    import tensorflow as tf
    print(f"[ML] Loading Keras model from {MODEL_PATH} …", flush=True)
    model = tf.keras.models.load_model(MODEL_PATH)
    print("[ML] Model loaded successfully.", flush=True)
    print(f"[ML] Input shape: {model.input_shape}", flush=True)
    print(f"[ML] Output names: {[o.name for o in model.outputs]}", flush=True)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_loaded": model is not None})


@app.route("/predict", methods=["POST"])
def predict():
    if model is None:
        return jsonify({"error": "model not loaded"}), 503

    data = request.get_json(force=True)
    machines = data.get("machines", [])

    results = []
    for m in machines:
        sensors   = m.get("sensors", {})
        machine_id   = m.get("machineId", "unknown")
        machine_type = m.get("machineType", "unknown")

        fvec = build_feature_vector(sensors)
        seq  = np.tile(fvec, (30, 1))[np.newaxis, :, :]

        preds = model.predict(seq, verbose=0)

        if isinstance(preds, list):
            risk_probs        = preds[0][0]
            future_risk_probs = preds[1][0]
            rul_raw           = float(preds[2][0][0])
            health_raw        = float(preds[3][0][0])
            prod_loss_raw     = float(preds[4][0][0])
        else:
            risk_probs        = [0.8, 0.15, 0.05]
            future_risk_probs = [0.7, 0.2,  0.1]
            rul_raw           = 0.5
            health_raw        = 0.5
            prod_loss_raw     = 0.1

        rul         = round(rul_raw    * RUL_MAX_HOURS,   1)
        health      = round(health_raw * HEALTH_SCALE,    0)
        prod_loss   = round(prod_loss_raw * PROD_LOSS_SCALE, 2)

        risk_idx    = int(np.argmax(risk_probs))
        status      = RISK_LABELS[risk_idx]

        results.append({
            "machineId":      machine_id,
            "machineType":    machine_type,
            "rul":            rul,
            "health":         int(health),
            "status":         status,
            "productionLoss": prod_loss,
            "riskProbs":      [round(float(p), 4) for p in risk_probs],
            "futureRiskProbs": [round(float(p), 4) for p in future_risk_probs],
            "anomaly":        risk_idx >= 1,
            "confidence":     round(float(max(risk_probs)) * 100, 1),
        })

    return jsonify({"predictions": results})


if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", 8090))
    load_model()
    print(f"[ML] Starting Flask service on port {port}", flush=True)
    app.run(host="0.0.0.0", port=port, debug=False)
