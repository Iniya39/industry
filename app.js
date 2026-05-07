const INR_PER_KWH = 8.5;
const HISTORY_LIMIT = 90;
const SIM_STEP_DAYS = 0.08;

const machines = [
  {
    id: 1,
    name: "Hydrapulper",
    model: "HC-2000",
    basePower: 420,
    sensors: [
      s("Temperature", "°C", 72, 1.6, 0.018, "high"),
      s("Motor current", "A", 185, 5, 0.05, "high"),
      s("Voltage", "V", 415, 4, -0.01, "low"),
      s("Power", "kW", 390, 8, 0.07, "high"),
      s("Pulp level", "%", 62, 3, -0.018, "both"),
      s("Water flow", "m³/hr", 135, 4, -0.04, "low"),
      s("Consistency", "%", 4.6, 0.12, 0.002, "both"),
      s("Vibration", "mm/s", 2.6, 0.14, 0.012, "high"),
      s("Rotor speed", "RPM", 980, 9, -0.04, "low")
    ]
  },
  {
    id: 2,
    name: "Continuous Digester",
    model: "CD-1200",
    basePower: 620,
    sensors: [
      s("Top temperature", "°C", 168, 2.4, 0.03, "high"),
      s("Bottom temperature", "°C", 161, 2.2, 0.026, "high"),
      s("Pressure", "bar", 8.2, 0.18, 0.004, "both"),
      s("Liquor flow", "m³/hr", 92, 2.5, -0.025, "low"),
      s("Chip level", "%", 71, 2.8, -0.01, "both"),
      s("pH level", "", 10.8, 0.12, -0.002, "both"),
      s("Consistency", "%", 8.2, 0.18, 0.003, "both"),
      s("Density", "", 1.08, 0.015, 0.0003, "both"),
      s("Steam flow", "kg/hr", 3600, 95, 1.4, "high"),
      s("Gas level", "", 15, 0.9, 0.02, "high")
    ]
  },
  {
    id: 3,
    name: "Pressure Screen",
    model: "PS-800",
    basePower: 260,
    sensors: [
      s("Inlet pressure", "bar", 3.4, 0.08, 0.002, "both"),
      s("Outlet pressure", "bar", 2.9, 0.07, -0.003, "low"),
      s("Differential pressure", "bar", 0.5, 0.04, 0.006, "high"),
      s("Flow", "m³/hr", 118, 3.2, -0.04, "low"),
      s("Consistency", "%", 3.8, 0.1, 0.002, "both"),
      s("Vibration", "mm/s", 2.2, 0.12, 0.014, "high"),
      s("Motor current", "A", 112, 3.4, 0.045, "high")
    ]
  },
  {
    id: 4,
    name: "Paper Machine",
    model: "PM-1",
    basePower: 1450,
    sensors: [
      s("Speed", "m/min", 760, 12, -0.05, "low"),
      s("Moisture", "%", 6.2, 0.18, 0.004, "both"),
      s("Basis weight", "GSM", 80, 1.4, 0.01, "both"),
      s("Thickness", "mm", 0.11, 0.004, 0.00002, "both"),
      s("Web tension", "N", 1180, 35, 0.5, "both"),
      s("Temperature", "°C", 68, 1.2, 0.016, "high"),
      s("Stock flow", "m³/hr", 205, 5, -0.05, "low"),
      s("Headbox pressure", "bar", 1.8, 0.05, 0.001, "both"),
      s("Position status", "%", 99, 0.3, -0.01, "low"),
      s("Vibration", "mm/s", 2.0, 0.1, 0.011, "high")
    ]
  },
  {
    id: 5,
    name: "Dryer Cylinders",
    model: "DC-600",
    basePower: 820,
    sensors: [
      s("Cylinder temperature", "°C", 126, 2.2, 0.035, "high"),
      s("Steam pressure", "bar", 5.8, 0.14, 0.003, "both"),
      s("Steam flow", "kg/hr", 2800, 70, 1.2, "high"),
      s("Inlet moisture", "%", 48, 1.1, 0.015, "both"),
      s("Outlet moisture", "%", 6.8, 0.16, 0.006, "high"),
      s("Speed", "m/min", 720, 10, -0.04, "low"),
      s("Condensate level", "%", 42, 2.0, 0.02, "high"),
      s("Humidity", "%", 58, 1.6, 0.02, "high"),
      s("Vibration", "mm/s", 2.4, 0.13, 0.013, "high")
    ]
  },
  {
    id: 6,
    name: "Soft Calender",
    model: "SC-500",
    basePower: 360,
    sensors: [
      s("Nip pressure", "bar", 48, 1.4, 0.03, "both"),
      s("Roll temperature", "°C", 82, 1.5, 0.02, "high"),
      s("Thickness", "mm", 0.105, 0.003, -0.00002, "both"),
      s("Smoothness", "%", 88, 1.1, -0.025, "low"),
      s("Speed", "m/min", 710, 9, -0.035, "low"),
      s("Load", "tons", 16, 0.45, 0.01, "high"),
      s("Vibration", "mm/s", 2.1, 0.11, 0.012, "high"),
      s("Position", "%", 98, 0.5, -0.015, "low")
    ]
  }
];

function s(name, unit, base, noise, drift, direction) {
  return { name, unit, base, noise, drift, direction };
}

const state = {
  tick: 0,
  selectedId: 1,
  selectedSensor: "",
  paused: false,
  machineState: new Map(),
  chat: []
};

function initState() {
  machines.forEach((machine, idx) => {
    const sensorMap = new Map();
    machine.sensors.concat(coolingSensors(machine.id)).forEach(sensor => {
      sensorMap.set(sensor.name, {
        spec: sensor,
        value: sensor.base,
        mean: sensor.base,
        variance: Math.max(sensor.noise * sensor.noise * 4, Math.abs(sensor.base) * 0.0005),
        history: [],
        score: 100,
        status: "Normal"
      });
    });
    state.machineState.set(machine.id, {
      machine,
      day: 0,
      wear: 0.03 + idx * 0.015,
      burst: idx === 2 ? 0.16 : idx === 4 ? 0.12 : 0,
      sensors: sensorMap,
      healthHistory: [],
      health: 100,
      status: "Very Good",
      rootCauses: [],
      recommendations: [],
      prediction: {}
    });
  });
  state.selectedSensor = [...state.machineState.get(1).sensors.keys()][0];
}

function coolingSensors(id) {
  const offset = id * 0.8;
  return [
    s("Coolant inlet temperature", "°C", 28 + offset, 0.45, 0.004, "high"),
    s("Coolant outlet temperature", "°C", 37 + offset, 0.55, 0.025, "high"),
    s("Coolant flow rate", "L/min", 155 - id * 4, 4, -0.045, "low"),
    s("Pump current", "A", 22 + id, 0.7, 0.02, "high"),
    s("Coolant pressure", "bar", 2.4, 0.06, -0.002, "low"),
    s("Cooling efficiency", "ΔT", 9, 0.35, -0.03, "low")
  ];
}

function randn() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function simulateMachine(ms) {
  ms.day += SIM_STEP_DAYS;
  ms.wear += 0.0006 + ms.burst * 0.00018;
  const cooling = ms.sensors.get("Cooling efficiency");
  const coolingDrag = cooling ? Math.max(0, 1 - cooling.score / 100) : 0;

  ms.sensors.forEach(sensor => {
    const spec = sensor.spec;
    const accel = (spec.name.includes("Vibration") || spec.name.includes("current") || spec.name.includes("Power") || spec.name.includes("Steam")) ? 1.9 : 1;
    const seasonal = Math.sin((state.tick + ms.machine.id * 7) / 13) * spec.noise * 0.35;
    const coolingFault = coolingDrag * coolingCoupling(spec.name, spec.base);
    let value = spec.base + randn() * spec.noise + seasonal + spec.drift * ms.day * (1 + ms.wear * 6) * accel + coolingFault;
    if (spec.name === "Cooling efficiency") {
      const outlet = ms.sensors.get("Coolant outlet temperature")?.value || 37;
      const inlet = ms.sensors.get("Coolant inlet temperature")?.value || 28;
      value = Math.max(1.5, outlet - inlet + randn() * 0.15 - ms.wear * 0.8);
    }
    sensor.value = round(value);
    learnAndScore(sensor);
  });

  const scores = [...ms.sensors.values()].map(x => x.score);
  ms.health = round(scores.reduce((a, b) => a + b, 0) / scores.length);
  ms.status = classifyHealth(ms.health);
  ms.rootCauses = [...ms.sensors.values()]
    .filter(x => x.score < 96)
    .sort((a, b) => a.score - b.score)
    .slice(0, 4)
    .map(x => ({
      sensor: x.spec.name,
      value: formatValue(x),
      score: x.score,
      status: x.status,
      reason: causeText(x)
    }));
  ms.prediction = predict(ms);
  ms.recommendations = buildRecommendations(ms);
  pushLimited(ms.healthHistory, { t: state.tick, value: ms.health }, HISTORY_LIMIT);
}

function coolingCoupling(name, base) {
  const lower = name.toLowerCase();
  if (lower.includes("temperature")) return base * 0.015;
  if (lower.includes("current") || lower.includes("power") || lower.includes("steam")) return base * 0.02;
  if (lower.includes("vibration")) return 0.7;
  if (lower.includes("moisture")) return 0.5;
  return 0;
}

function learnAndScore(sensor) {
  const value = sensor.value;
  const std = Math.sqrt(sensor.variance);
  const zBefore = Math.abs(value - sensor.mean) / Math.max(std, Math.abs(sensor.spec.base) * 0.01, 0.01);
  const learnRate = zBefore < 2.2 ? 0.035 : 0.006;
  const delta = value - sensor.mean;
  sensor.mean += learnRate * delta;
  sensor.variance = (1 - learnRate) * sensor.variance + learnRate * delta * delta;

  const sigma = Math.max(Math.sqrt(sensor.variance), Math.abs(sensor.spec.base) * 0.012, sensor.spec.noise);
  const directional = directionalDeviation(value, sensor.mean, sigma, sensor.spec.direction);
  sensor.score = scoreFromDeviation(directional);
  sensor.status = sensor.score >= 90 ? "Normal" : sensor.score >= 70 ? "Warning" : sensor.score >= 50 ? "Moderate" : sensor.score >= 20 ? "Risk" : "Critical";
  pushLimited(sensor.history, { t: state.tick, value, mean: sensor.mean, score: sensor.score }, HISTORY_LIMIT);
}

function directionalDeviation(value, mean, sigma, direction) {
  if (direction === "high") return Math.max(0, (value - mean) / sigma);
  if (direction === "low") return Math.max(0, (mean - value) / sigma);
  return Math.abs(value - mean) / sigma;
}

function scoreFromDeviation(z) {
  if (z <= 1) return 100;
  if (z <= 1.5) return round(100 - (z - 1) * 20);
  if (z <= 2.4) return round(90 - (z - 1.5) * 30);
  if (z <= 3.6) return round(63 - (z - 2.4) * 28);
  if (z <= 5) return round(30 - (z - 3.6) * 14);
  return 10;
}

function classifyHealth(health) {
  if (health >= 90) return "Very Good";
  if (health >= 70) return "Good";
  if (health >= 50) return "Moderate";
  if (health >= 20) return "Risk";
  return "High Risk";
}

function levelClass(health) {
  if (health >= 90) return "green";
  if (health >= 50) return "yellow";
  return "red";
}

function buildRecommendations(ms) {
  const recs = new Set();
  ms.rootCauses.forEach(cause => {
    const name = cause.sensor.toLowerCase();
    if (name.includes("temperature")) recs.add("Check cooling circuit, heat exchangers, fouling, and coolant flow.");
    if (name.includes("vibration")) recs.add("Inspect bearings, alignment, rotor balance, and foundation looseness.");
    if (name.includes("current") || name.includes("power") || name.includes("load")) recs.add("Reduce load and inspect overload, motor efficiency, and drive friction.");
    if (name.includes("pressure")) recs.add("Check for leakage, blockage, valve position, screen plugging, or pump degradation.");
    if (name.includes("flow")) recs.add("Verify pump condition, strainer cleanliness, valve opening, and line obstruction.");
    if (name.includes("moisture")) recs.add("Tune drying profile, steam flow, drainage, and sheet moisture control loop.");
    if (name.includes("coolant") || name.includes("cooling")) recs.add("Prioritize cooling subsystem maintenance and confirm pump current versus flow.");
    if (name.includes("consistency") || name.includes("density") || name.includes("ph")) recs.add("Validate process chemistry and stock preparation controls.");
  });
  if (ms.health < 50) recs.add(`Schedule servicing within ${Math.max(1, Math.ceil(ms.prediction.daysToCritical || 3))} days.`);
  if (ms.health >= 50 && ms.health < 70) recs.add("Schedule preventive inspection within 7 days.");
  if (recs.size === 0) recs.add("Continue normal operation and let the adaptive model keep learning stable behavior.");
  return [...recs].slice(0, 5);
}

function predict(ms) {
  const h = ms.healthHistory.slice(-30);
  let slopePerTick = -0.02;
  if (h.length > 5) {
    const first = h.slice(0, Math.ceil(h.length / 3)).reduce((a, b) => a + b.value, 0) / Math.ceil(h.length / 3);
    const last = h.slice(-Math.ceil(h.length / 3)).reduce((a, b) => a + b.value, 0) / Math.ceil(h.length / 3);
    slopePerTick = Math.min(-0.01, (last - first) / Math.max(1, h.length));
  }
  const dailySlope = slopePerTick / SIM_STEP_DAYS;
  const target = ms.health > 50 ? 50 : 20;
  const daysToCritical = dailySlope < 0 ? Math.max(0.5, (target - ms.health) / dailySlope) : 60;
  const futureHealth7 = clamp(ms.health + dailySlope * 7, 0, 100);
  const coolingPenalty = 1 - ((ms.sensors.get("Cooling efficiency")?.score || 100) / 100);
  const abnormalPenalty = 1 - ms.health / 100;
  const energyIncreasePct = round((abnormalPenalty * 18 + coolingPenalty * 9));
  const dailyCostImpact = round(ms.machine.basePower * 24 * (energyIncreasePct / 100) * INR_PER_KWH);
  const failureType = inferFailureType(ms.rootCauses);
  return {
    futureHealth7: round(futureHealth7),
    daysToCritical: round(daysToCritical),
    energyIncreasePct,
    dailyCostImpact,
    monthlyCostImpact: round(dailyCostImpact * 30),
    failureType
  };
}

function inferFailureType(rootCauses) {
  const names = rootCauses.map(x => x.sensor.toLowerCase()).join(" ");
  if (names.includes("coolant") || names.includes("temperature")) return "Thermal overload / cooling inefficiency";
  if (names.includes("vibration")) return "Mechanical bearing or alignment fault";
  if (names.includes("pressure") || names.includes("flow")) return "Hydraulic blockage, leakage, or pump degradation";
  if (names.includes("moisture") || names.includes("steam")) return "Drying efficiency and steam control fault";
  if (names.includes("current") || names.includes("power") || names.includes("load")) return "Motor overload or energy inefficiency";
  return "Process drift requiring inspection";
}

function causeText(sensor) {
  const diff = sensor.value - sensor.mean;
  const dir = diff > 0 ? "above" : "below";
  return `${sensor.spec.name} is ${dir} its learned normal band`;
}

function step() {
  if (!state.paused) {
    state.tick++;
    state.machineState.forEach(simulateMachine);
    render();
  }
}

function render() {
  renderNav();
  renderCards();
  renderSummary();
  renderDetail();
  renderAlerts();
  renderCooling();
}

function renderNav() {
  const nav = el("machineNav");
  nav.innerHTML = "";
  machines.forEach(machine => {
    const ms = state.machineState.get(machine.id);
    const btn = document.createElement("button");
    btn.className = `nav-machine ${machine.id === state.selectedId ? "active" : ""}`;
    btn.innerHTML = `<strong>Machine ${machine.id}: ${machine.name}</strong><span>${ms.health}% ${ms.status}</span>`;
    btn.onclick = () => selectMachine(machine.id);
    nav.appendChild(btn);
  });
}

function renderCards() {
  const grid = el("machineCards");
  grid.innerHTML = "";
  machines.forEach(machine => {
    const ms = state.machineState.get(machine.id);
    const cls = levelClass(ms.health);
    const card = document.createElement("article");
    card.className = `machine-card ${state.selectedId === machine.id ? "selected" : ""}`;
    card.onclick = () => selectMachine(machine.id);
    card.innerHTML = `
      <div class="card-top">
        <div><h3>Machine ${machine.id}: ${machine.name}</h3><p class="model">${machine.model}</p></div>
        <div class="status-pill ${cls === "green" ? "" : cls}">${ms.status}</div>
      </div>
      <div class="health-bar"><div style="width:${ms.health}%;background:${colorFor(ms.health)}"></div></div>
      <strong>${ms.health}% health</strong>
      <p class="reason-list">${ms.rootCauses.length ? ms.rootCauses.map(x => x.sensor).join(", ") : "All key parameters are inside learned normal behavior."}</p>
    `;
    grid.appendChild(card);
  });
}

function renderSummary() {
  const list = [...state.machineState.values()];
  const fleet = round(list.reduce((a, b) => a + b.health, 0) / list.length);
  const alerts = collectAlerts();
  el("fleetHealth").textContent = `${fleet}%`;
  el("criticalCount").textContent = list.filter(x => x.health < 50).length;
  el("alertCount").textContent = alerts.length;
  el("energyImpact").textContent = rupee(list.reduce((a, b) => a + b.prediction.monthlyCostImpact, 0));
  el("lastUpdated").textContent = new Date().toLocaleTimeString();
}

function renderDetail() {
  const ms = state.machineState.get(state.selectedId);
  el("detailTitle").textContent = `Machine ${ms.machine.id}: ${ms.machine.name} (${ms.machine.model})`;
  el("detailHealth").textContent = `${ms.health}%`;
  const badge = el("detailBadge");
  badge.textContent = ms.status;
  badge.className = `status-pill ${levelClass(ms.health) === "green" ? "" : levelClass(ms.health)}`;
  const arc = el("healthArc");
  const circumference = 364;
  arc.style.strokeDashoffset = circumference - (circumference * ms.health / 100);
  arc.style.stroke = colorFor(ms.health);

  const insights = [
    ["Predicted failure", ms.prediction.failureType],
    ["Time to critical", `${ms.prediction.daysToCritical} days`],
    ["7-day health forecast", `${ms.prediction.futureHealth7}%`],
    ["Energy increase", `${ms.prediction.energyIncreasePct}%`],
    ["Daily cost impact", rupee(ms.prediction.dailyCostImpact)],
    ["Top cause", ms.rootCauses[0]?.sensor || "No abnormal contributor"]
  ];
  el("insights").innerHTML = insights.map(([label, value]) => `<div class="insight"><span>${label}</span><strong>${value}</strong></div>`).join("");

  renderSensorSelect(ms);
  renderTable(ms);
  drawChart(ms);
}

function renderSensorSelect(ms) {
  const select = el("sensorSelect");
  const names = [...ms.sensors.keys()];
  if (!names.includes(state.selectedSensor)) state.selectedSensor = names[0];
  select.innerHTML = names.map(name => `<option ${name === state.selectedSensor ? "selected" : ""}>${name}</option>`).join("");
}

function renderTable(ms) {
  el("sensorRows").innerHTML = [...ms.sensors.values()].map(sensor => {
    const low = sensor.mean - 2 * Math.sqrt(sensor.variance);
    const high = sensor.mean + 2 * Math.sqrt(sensor.variance);
    return `<tr>
      <td>${sensor.spec.name}</td>
      <td>${formatValue(sensor)}</td>
      <td>${round(low)} - ${round(high)} ${sensor.spec.unit}</td>
      <td>${sensor.score}</td>
      <td><span class="status-pill ${sensor.score >= 90 ? "" : sensor.score >= 50 ? "yellow" : "red"}">${sensor.status}</span></td>
    </tr>`;
  }).join("");
}

function drawChart(ms) {
  const canvas = el("trendChart");
  const ctx = canvas.getContext("2d");
  const sensor = ms.sensors.get(state.selectedSensor);
  const data = sensor.history;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fbfcfb";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#dfe5df";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const y = 24 + i * 52;
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(canvas.width - 20, y);
    ctx.stroke();
  }
  if (data.length < 2) return;
  const values = data.flatMap(d => [d.value, d.mean]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max((max - min) * 0.2, 1);
  const yFor = value => canvas.height - 28 - ((value - min + pad) / (max - min + pad * 2)) * (canvas.height - 54);
  const xFor = i => 42 + i * ((canvas.width - 68) / Math.max(1, data.length - 1));
  drawLine(ctx, data.map(d => [xFor(data.indexOf(d)), yFor(d.mean)]), "#8a9690", 2);
  drawLine(ctx, data.map(d => [xFor(data.indexOf(d)), yFor(d.value)]), colorFor(sensor.score), 3);
  ctx.fillStyle = "#17201c";
  ctx.font = "13px Segoe UI";
  ctx.fillText(`${state.selectedSensor}: ${formatValue(sensor)} | learned mean ${round(sensor.mean)} ${sensor.spec.unit}`, 44, 22);
}

function drawLine(ctx, points, color, width) {
  ctx.beginPath();
  points.forEach(([x, y], idx) => idx ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function renderAlerts() {
  const alerts = collectAlerts().slice(0, 8);
  const list = el("alertsList");
  if (!alerts.length) {
    list.innerHTML = `<p class="reason-list">No active alerts. All monitored assets are within adaptive limits.</p>`;
    return;
  }
  list.innerHTML = alerts.map(a => `
    <article class="alert-item ${a.level === "Critical" ? "critical" : ""}">
      <div class="alert-top"><strong>${a.level}: Machine ${a.machineId}</strong><span>${a.sensor}</span></div>
      <p>${a.reason}. Recommendation: ${a.recommendation}</p>
    </article>
  `).join("");
}

function renderCooling() {
  const wrap = el("coolingViz");
  wrap.innerHTML = [...state.machineState.values()].map(ms => {
    const score = ms.sensors.get("Cooling efficiency")?.score || 100;
    return `<div class="cool-row">
      <strong>M${ms.machine.id}</strong>
      <div class="cool-track"><div style="width:${score}%;background:${score >= 90 ? "var(--teal)" : score >= 50 ? "var(--yellow)" : "var(--red)"}"></div></div>
      <span>${score}%</span>
    </div>`;
  }).join("");
}

function collectAlerts() {
  const alerts = [];
  state.machineState.forEach(ms => {
    ms.rootCauses.forEach(cause => {
      if (cause.score < 90) {
        alerts.push({
          machineId: ms.machine.id,
          machine: ms.machine.name,
          level: cause.score < 50 || ms.health < 50 ? "Critical" : "Warning",
          sensor: cause.sensor,
          reason: cause.reason,
          recommendation: ms.recommendations[0] || "Inspect the related subsystem."
        });
      }
    });
  });
  return alerts.sort((a, b) => (a.level === "Critical" ? -1 : 1));
}

function selectMachine(id) {
  state.selectedId = id;
  state.selectedSensor = [...state.machineState.get(id).sensors.keys()][0];
  render();
}

function addChat(role, text) {
  state.chat.push({ role, text });
  const log = el("chatLog");
  const div = document.createElement("div");
  div.className = `message ${role}`;
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function answer(question) {
  const q = question.toLowerCase();
  const machine = findMachineInText(q) || state.machineState.get(state.selectedId);
  if (q.includes("report")) {
    downloadReport();
    return "I generated a downloadable JSON report with health, root cause, prediction, energy, and recommendation data.";
  }
  if (q.includes("ppt") || q.includes("presentation")) {
    downloadPpt();
    return "I generated a PowerPoint deck covering fleet status, fault analysis, cooling, and energy impact.";
  }
  if (q.includes("compare")) return compareMachines();
  if (q.includes("what if") || q.includes("continues") || q.includes("happens")) return whatIf(machine);
  if (q.includes("why") || q.includes("causing") || q.includes("fault") || q.includes("issue")) return explainMachine(machine);
  if (q.includes("alert")) return alertSummary();
  if (q.includes("energy") || q.includes("cost")) return energySummary(machine);
  if (q.includes("status") || q.includes("health") || q.includes("sensor")) return statusText(machine);
  return `For Machine ${machine.machine.id} (${machine.machine.name}), health is ${machine.health}% (${machine.status}). Ask about status, alerts, root cause, energy cost, what-if scenarios, reports, or PPT generation.`;
}

function findMachineInText(text) {
  const match = text.match(/machine\s*(\d)|m\s*(\d)/);
  const id = match ? Number(match[1] || match[2]) : null;
  return id ? state.machineState.get(id) : null;
}

function statusText(ms) {
  const causes = ms.rootCauses.length ? ms.rootCauses.map(c => `${c.sensor} (${c.score})`).join(", ") : "no abnormal sensors";
  return `Machine ${ms.machine.id} ${ms.machine.name} is at ${ms.health}% health, classified as ${ms.status}. Top contributors: ${causes}. Current prediction: ${ms.prediction.failureType}, critical threshold in about ${ms.prediction.daysToCritical} days if degradation continues.`;
}

function explainMachine(ms) {
  if (!ms.rootCauses.length) return `Machine ${ms.machine.id} is healthy. The adaptive model sees all major sensors inside learned normal behavior.`;
  const simple = `Simple explanation: health dropped because ${ms.rootCauses[0].sensor} moved away from its normal pattern.`;
  const technical = `Technical explanation: the dynamic baseline detected low sensor scores on ${ms.rootCauses.map(c => `${c.sensor}=${c.score}`).join(", ")}. These deviations reduce the average sensor score to ${ms.health}%.`;
  return `${simple}\n${technical}\nRecommended action: ${ms.recommendations.join(" ")}`;
}

function whatIf(ms) {
  return `If this continues, Machine ${ms.machine.id} is projected to reach ${ms.prediction.futureHealth7}% health in 7 days and hit critical condition in about ${ms.prediction.daysToCritical} days. Likely failure type: ${ms.prediction.failureType}. Estimated energy increase is ${ms.prediction.energyIncreasePct}%, costing about ${rupee(ms.prediction.dailyCostImpact)} per day.`;
}

function compareMachines() {
  return [...state.machineState.values()]
    .sort((a, b) => a.health - b.health)
    .map(ms => `M${ms.machine.id} ${ms.machine.name}: ${ms.health}% (${ms.status}), top cause: ${ms.rootCauses[0]?.sensor || "none"}`)
    .join("\n");
}

function alertSummary() {
  const alerts = collectAlerts();
  if (!alerts.length) return "No active alerts right now.";
  return alerts.slice(0, 6).map(a => `${a.level} on M${a.machineId}: ${a.sensor}. ${a.reason}.`).join("\n");
}

function energySummary(ms) {
  return `Machine ${ms.machine.id} projected energy increase is ${ms.prediction.energyIncreasePct}%, about ${rupee(ms.prediction.dailyCostImpact)} per day and ${rupee(ms.prediction.monthlyCostImpact)} per month. Fleet monthly impact is ${rupee([...state.machineState.values()].reduce((a, b) => a + b.prediction.monthlyCostImpact, 0))}.`;
}

function downloadReport() {
  const report = {
    generatedAt: new Date().toISOString(),
    tariff: INR_PER_KWH,
    machines: [...state.machineState.values()].map(ms => ({
      id: ms.machine.id,
      name: ms.machine.name,
      model: ms.machine.model,
      health: ms.health,
      status: ms.status,
      rootCauses: ms.rootCauses,
      prediction: ms.prediction,
      recommendations: ms.recommendations,
      sensors: [...ms.sensors.values()].map(x => ({
        name: x.spec.name,
        value: x.value,
        unit: x.spec.unit,
        learnedMean: round(x.mean),
        score: x.score,
        status: x.status
      }))
    }))
  };
  downloadBlob(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }), "paper-mill-ai-report.json");
}

function downloadPpt() {
  const slides = buildSlideXml();
  const files = pptFiles(slides);
  const blob = new Blob([zipStore(files)], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
  downloadBlob(blob, "paper-mill-predictive-maintenance.pptx");
}

function buildSlideXml() {
  const fleet = [...state.machineState.values()];
  const lines = [
    `Fleet health: ${round(fleet.reduce((a, b) => a + b.health, 0) / fleet.length)}%`,
    `Active alerts: ${collectAlerts().length}`,
    `Monthly energy impact: ${rupee(fleet.reduce((a, b) => a + b.prediction.monthlyCostImpact, 0))}`
  ];
  const machineLines = fleet.map(ms => `M${ms.machine.id} ${ms.machine.name}: ${ms.health}% ${ms.status}; ${ms.rootCauses[0]?.sensor || "stable"}`);
  const recLines = fleet.flatMap(ms => [`M${ms.machine.id}: ${ms.recommendations[0]}`]).slice(0, 6);
  return [
    slide("Paper Mill AI Monitoring", ["Intelligent monitoring and predictive maintenance", ...lines]),
    slide("Machine Health Overview", machineLines),
    slide("Fault And Cooling Analysis", fleet.map(ms => `M${ms.machine.id}: ${ms.prediction.failureType}; cooling score ${ms.sensors.get("Cooling efficiency").score}%`)),
    slide("Energy Consumption Impact", fleet.map(ms => `M${ms.machine.id}: ${ms.prediction.energyIncreasePct}% increase; ${rupee(ms.prediction.monthlyCostImpact)} monthly impact`)),
    slide("Recommended Maintenance Plan", recLines)
  ];
}

function slide(title, bullets) {
  const esc = xmlEscape;
  const bulletXml = bullets.map((b, i) => `
    <a:p><a:pPr marL="342900" indent="-171450"><a:buChar char="•"/></a:pPr><a:r><a:rPr lang="en-US" sz="${i === 0 ? 2400 : 2000}"/><a:t>${esc(b)}</a:t></a:r></a:p>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
    <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      <p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="548640" y="365760"/><a:ext cx="8046720" cy="731520"/></a:xfrm></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="3600" b="1"/><a:t>${esc(title)}</a:t></a:r></a:p></p:txBody></p:sp>
      <p:sp><p:nvSpPr><p:cNvPr id="3" name="Content"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="731520" y="1371600"/><a:ext cx="7680960" cy="4389120"/></a:xfrm></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/>${bulletXml}</p:txBody></p:sp>
    </p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
  </p:sld>`;
}

function pptFiles(slides) {
  const rels = slides.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`).join("");
  const slideIds = slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 1}"/>`).join("");
  const files = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>${slides.map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join("")}</Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>`,
    "ppt/_rels/presentation.xml.rels": `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}</Relationships>`,
    "ppt/presentation.xml": `<?xml version="1.0" encoding="UTF-8"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldIdLst>${slideIds}</p:sldIdLst><p:sldSz cx="9144000" cy="5143500" type="screen16x9"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`
  };
  slides.forEach((xml, i) => files[`ppt/slides/slide${i + 1}.xml`] = xml);
  return files;
}

function zipStore(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  Object.entries(files).forEach(([name, content]) => {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(content);
    const crc = crc32(data);
    const local = concatBytes(u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), nameBytes, data);
    localParts.push(local);
    const central = concatBytes(u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), nameBytes);
    centralParts.push(central);
    offset += local.length;
  });
  const centralSize = centralParts.reduce((a, b) => a + b.length, 0);
  const end = concatBytes(u32(0x06054b50), u16(0), u16(0), u16(centralParts.length), u16(centralParts.length), u32(centralSize), u32(offset), u16(0));
  return concatBytes(...localParts, ...centralParts, end);
}

function crc32(bytes) {
  let c = ~0;
  for (const byte of bytes) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return ~c >>> 0;
}

function u16(n) { return new Uint8Array([n & 255, (n >>> 8) & 255]); }
function u32(n) { return new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]); }
function concatBytes(...parts) {
  const len = parts.reduce((a, b) => a + b.length, 0);
  const out = new Uint8Array(len);
  let offset = 0;
  parts.forEach(part => { out.set(part, offset); offset += part.length; });
  return out;
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatValue(sensor) {
  return `${round(sensor.value)} ${sensor.spec.unit}`.trim();
}

function colorFor(health) {
  if (health >= 90) return "#17803d";
  if (health >= 50) return "#c58b10";
  return "#c7352d";
}

function round(v) {
  return Math.round(v * 100) / 100;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function pushLimited(arr, value, max) {
  arr.push(value);
  if (arr.length > max) arr.shift();
}

function rupee(value) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function xmlEscape(text) {
  return String(text).replace(/[<>&'"]/g, ch => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[ch]));
}

function el(id) {
  return document.getElementById(id);
}

function bindEvents() {
  el("pauseBtn").onclick = () => {
    state.paused = !state.paused;
    el("pauseBtn").textContent = state.paused ? "▶" : "⏸";
    el("learningState").textContent = state.paused ? "Paused" : "Adaptive";
  };
  el("sensorSelect").onchange = e => {
    state.selectedSensor = e.target.value;
    renderDetail();
  };
  el("reportBtn").onclick = downloadReport;
  el("pptBtn").onclick = downloadPpt;
  el("statusSummaryBtn").onclick = () => addChat("bot", compareMachines());
  el("chatForm").onsubmit = e => {
    e.preventDefault();
    const input = el("chatInput");
    const text = input.value.trim();
    if (!text) return;
    addChat("user", text);
    addChat("bot", answer(text));
    input.value = "";
  };
}

initState();
bindEvents();
for (let i = 0; i < 20; i++) {
  state.tick++;
  state.machineState.forEach(simulateMachine);
}
render();
addChat("bot", "System online. I can explain health drops, faulty sensors, alerts, predictions, energy cost, machine comparisons, what-if scenarios, and generate reports or PPT presentations.");
setInterval(step, 1000);
