export type Accent = "blue" | "green" | "orange" | "red";
export type Severity = "Critical" | "High" | "Medium";
export type MachineStatus = "Good" | "Warning" | "Critical" | "Moderate";

export const statCards = [
  {
    title: "Anomalies Detected",
    value: "12",
    change: "25% vs last 7 days",
    trend: "up",
    accent: "blue" as Accent,
    series: [8, 13, 10, 15, 17, 13, 16, 19, 27, 17, 15, 16, 27, 25, 25]
  },
  {
    title: "Average RUL (Hours)",
    value: "15.8 h",
    change: "10% vs last 7 days",
    trend: "up",
    accent: "green" as Accent,
    series: [10, 12, 8, 6, 11, 14, 11, 9, 6, 12, 18, 14, 12, 15, 17]
  },
  {
    title: "Production Loss",
    value: "8.2%",
    change: "15% vs last 7 days",
    trend: "down",
    accent: "orange" as Accent,
    series: [7, 12, 8, 7, 11, 8, 13, 16, 15, 7, 6, 11, 16, 14, 15]
  },
  {
    title: "Alerts Generated",
    value: "40",
    change: "20% vs last 7 days",
    trend: "up",
    accent: "red" as Accent,
    series: [8, 13, 9, 11, 7, 9, 13, 16, 12, 10, 10, 14, 18, 16, 19]
  }
];

export const healthMetrics = [
  { label: "Vibration", value: "2.1 mm/s", status: "Good" as MachineStatus },
  { label: "Temperature", value: "62 C", status: "Good" as MachineStatus },
  { label: "Pressure", value: "1.2 bar", status: "Good" as MachineStatus },
  { label: "Load", value: "65 %", status: "Moderate" as MachineStatus }
];

export const priorityAlerts = [
  {
    machine: "Pressure Screen PS-800",
    severity: "Critical" as Severity,
    description: "High vibration detected",
    time: "10 min ago"
  },
  {
    machine: "Dryer Cylinders DC-600",
    severity: "High" as Severity,
    description: "Bearing temperature high",
    time: "25 min ago"
  },
  {
    machine: "Soft Calender SC-500",
    severity: "Medium" as Severity,
    description: "RUL below threshold",
    time: "1 hr ago"
  }
];

export const machineHealthRows = [
  { id: "Hydrapulper HC-2000",        score: "86/100", status: "Good" as MachineStatus,     trend: [8, 12, 10, 14, 11, 16] },
  { id: "Continuous Digester CD-1200", score: "72/100", status: "Warning" as MachineStatus,  trend: [7, 12, 9, 14, 12, 15] },
  { id: "Pressure Screen PS-800",      score: "42/100", status: "Critical" as MachineStatus, trend: [16, 12, 13, 9, 11, 8] },
  { id: "Dryer Cylinders DC-600",      score: "66/100", status: "Warning" as MachineStatus,  trend: [8, 11, 10, 13, 12, 14] },
  { id: "Soft Calender SC-500",        score: "81/100", status: "Good" as MachineStatus,     trend: [9, 13, 10, 14, 12, 16] }
];

export const rulTrend = [
  { date: "May 11", hours: 11 },
  { date: "May 12", hours: 16 },
  { date: "May 13", hours: 12 },
  { date: "May 14", hours: 15.2 },
  { date: "May 15", hours: 11 },
  { date: "May 16", hours: 10.2 },
  { date: "May 17", hours: 6.4 }
];

export const failurePredictions = [
  { time: "May 18, 10:32", machine: "Pressure Screen PS-800",      code: "ML-13", eta: "6 Hours",  confidence: 85, tone: "red" as Accent },
  { time: "May 18, 10:28", machine: "Pressure Screen PS-800",      code: "ML-07", eta: "8 Hours",  confidence: 78, tone: "orange" as Accent },
  { time: "May 19, 09:45", machine: "Dryer Cylinders DC-600",      code: "ML-11", eta: "18 Hours", confidence: 68, tone: "orange" as Accent },
  { time: "May 19, 11:20", machine: "Soft Calender SC-500",        code: "ML-02", eta: "24 Hours", confidence: 60, tone: "green" as Accent }
];

export const machines = [
  { name: "Hydrapulper HC-2000",        area: "Stock Prep", health: 86, status: "Good" as MachineStatus,     rul: "22 h", load: "68%", vibration: "1.8 mm/s", engineer: "Priya Shah" },
  { name: "Continuous Digester CD-1200", area: "Pulping",    health: 72, status: "Warning" as MachineStatus,  rul: "15 h", load: "74%", vibration: "2.4 mm/s", engineer: "Rohan Iyer" },
  { name: "Pressure Screen PS-800",      area: "Screening",  health: 42, status: "Critical" as MachineStatus, rul: "6 h",  load: "88%", vibration: "5.6 mm/s", engineer: "Neha Rao" },
  { name: "Dryer Cylinders DC-600",      area: "Drying",     health: 66, status: "Warning" as MachineStatus,  rul: "18 h", load: "82%", vibration: "3.7 mm/s", engineer: "Karan Gill" },
  { name: "Soft Calender SC-500",        area: "Finishing",  health: 81, status: "Good" as MachineStatus,     rul: "24 h", load: "64%", vibration: "2.0 mm/s", engineer: "Arjun Mehta" },
  { name: "Paper Machine PM-1",          area: "Formation",  health: 91, status: "Good" as MachineStatus,     rul: "31 h", load: "59%", vibration: "1.5 mm/s", engineer: "Sara Khan" }
];

export const alertTimeline = [
  { time: "10:30", title: "Critical vibration detected",    machine: "Pressure Screen PS-800",      severity: "Critical" as Severity },
  { time: "10:05", title: "Bearing temperature high",       machine: "Dryer Cylinders DC-600",      severity: "High" as Severity },
  { time: "09:45", title: "RUL below threshold",            machine: "Soft Calender SC-500",        severity: "Medium" as Severity },
  { time: "09:15", title: "Pressure drift normalized",      machine: "Continuous Digester CD-1200", severity: "Medium" as Severity },
  { time: "08:40", title: "Maintenance ticket assigned",    machine: "Pressure Screen PS-800",      severity: "High" as Severity }
];

export const performanceTrend = [
  { day: "Mon", availability: 94, energy: 82, failures: 3 },
  { day: "Tue", availability: 92, energy: 84, failures: 4 },
  { day: "Wed", availability: 96, energy: 79, failures: 2 },
  { day: "Thu", availability: 91, energy: 86, failures: 5 },
  { day: "Fri", availability: 95, energy: 81, failures: 3 },
  { day: "Sat", availability: 97, energy: 78, failures: 1 },
  { day: "Sun", availability: 93, energy: 83, failures: 3 }
];

export const maintenanceSchedule = [
  { date: "May 18", window: "09:00 - 11:00", machine: "Pressure Screen PS-800",      type: "Bearing inspection",    engineer: "Neha Rao",   status: "Scheduled" },
  { date: "May 19", window: "13:00 - 15:30", machine: "Dryer Cylinders DC-600",      type: "Thermal audit",         engineer: "Karan Gill", status: "Assigned" },
  { date: "May 21", window: "08:00 - 10:00", machine: "Continuous Digester CD-1200", type: "Pressure loop tuning",  engineer: "Rohan Iyer", status: "Planned" },
  { date: "May 23", window: "16:00 - 18:00", machine: "Soft Calender SC-500",        type: "RUL validation",        engineer: "Priya Shah", status: "Planned" }
];

export const engineers = [
  { name: "Neha Rao",   role: "Reliability Lead",       load: 82 },
  { name: "Karan Gill", role: "Mechanical Engineer",    load: 68 },
  { name: "Rohan Iyer", role: "Controls Engineer",      load: 57 },
  { name: "Priya Shah", role: "Process Engineer",       load: 44 }
];

export const reports = [
  { name: "Weekly Plant Health",        type: "PDF",  date: "May 17, 2024", size: "2.4 MB" },
  { name: "Failure Code Analysis",      type: "PDF",  date: "May 16, 2024", size: "1.8 MB" },
  { name: "Energy Consumption Trends",  type: "XLSX", date: "May 15, 2024", size: "920 KB" },
  { name: "Maintenance Compliance",     type: "PDF",  date: "May 13, 2024", size: "1.2 MB" }
];
