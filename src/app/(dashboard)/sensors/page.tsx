import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sensorPages = [
  {
    area: "Stock Prep",
    title: "Hydrapulper HC-2000",
    status: "Good",
    accent: "green",
    sensors: [
      { name: "Temperature", value: "66 ℃" },
      { name: "Motor Current", value: "45.9 A" },
      { name: "Voltage", value: "379 V" },
      { name: "Power", value: "17.6 kW" },
      { name: "Pulp Level", value: "60 %" },
      { name: "Water Flow", value: "11.5 m³/h" },
      { name: "Consistency", value: "4.1 %", critical: true },
      { name: "Vibration", value: "1.60 mm/s" },
      { name: "Rotor Speed", value: "1471 rpm" }
    ],
    summary: { rul: "716.4 h", health: "100/100", confidence: "20%" }
  },
  {
    area: "Pulping",
    title: "Continuous Digester CD-1200",
    status: "Warning",
    accent: "orange",
    sensors: [
      { name: "Top Temperature", value: "161 ℃" },
      { name: "Bottom Temperature", value: "172 ℃", critical: true },
      { name: "Pressure", value: "9.2 bar" },
      { name: "Liquor Flow", value: "21.4 m³/h" },
      { name: "Chip Level", value: "67 %" },
      { name: "pH", value: "13.4" },
      { name: "Consistency", value: "11.6 %" },
      { name: "Density", value: "1.07 g/cm³" },
      { name: "Steam Flow", value: "2871 kg/h" }
    ],
    summary: { rul: "364.5 h", health: "79/100", confidence: "31%" }
  },
  {
    area: "Screening",
    title: "Pressure Screen PS-800",
    status: "Critical",
    accent: "red",
    sensors: [
      { name: "Inlet Pressure", value: "4.79 bar" },
      { name: "Outlet Pressure", value: "3.47 bar" },
      { name: "Differential Pressure", value: "1.47 bar", critical: true },
      { name: "Flow", value: "134 m³/h" },
      { name: "Consistency", value: "4.5 %" },
      { name: "Vibration", value: "5.53 mm/s" },
      { name: "Motor Current", value: "62.3 A" }
    ],
    summary: { rul: "18.5 h", health: "31/100", confidence: "98%" }
  },
  {
    area: "Formation",
    title: "Paper Machine PM-1",
    status: "Good",
    accent: "green",
    sensors: [
      { name: "Speed", value: "864 m/min" },
      { name: "Moisture", value: "5.0 %", critical: true },
      { name: "Basis Weight", value: "78 gsm" },
      { name: "Thickness", value: "0.14 mm", critical: true },
      { name: "Web Tension", value: "23 kN" },
      { name: "Temperature", value: "86 ℃" },
      { name: "Stock Flow", value: "3.8 m³/h" },
      { name: "Headbox Pressure", value: "1.2 bar" },
      { name: "Vibration", value: "1.8 mm/s" }
    ],
    summary: { rul: "712.8 h", health: "90/100", confidence: "26%" }
  },
  {
    area: "Drying",
    title: "Dryer Cylinders DC-600",
    status: "Warning",
    accent: "orange",
    sensors: [
      { name: "Cylinder 1 Temp", value: "139 ℃" },
      { name: "Cylinder 2 Temp", value: "144 ℃" },
      { name: "Condensate Level", value: "45 %" },
      { name: "Steam Pressure", value: "4.4 bar" },
      { name: "Steam Flow", value: "1725 kg/h" },
      { name: "Inlet Moisture", value: "4.8 %" },
      { name: "Outlet Moisture", value: "15.1 %", critical: true },
      { name: "Speed", value: "560 m/min" },
      { name: "Humidity", value: "21 %" },
      { name: "Vibration", value: "3.8 mm/s" }
    ],
    summary: { rul: "82.1 h", health: "69/100", confidence: "54%" }
  },
  {
    area: "Finishing",
    title: "Soft Calender SC-500",
    status: "Warning",
    accent: "orange",
    sensors: [
      { name: "Nip Pressure", value: "72 kN/m" },
      { name: "Roll Temperature", value: "86 ℃" },
      { name: "Thickness", value: "0.27 mm", critical: true },
      { name: "Smoothness", value: "11.3 %" },
      { name: "Speed", value: "478 m/min" },
      { name: "Load", value: "81 tons" },
      { name: "Vibration", value: "4.1 mm/s" }
    ],
    summary: { rul: "239.6 h", health: "68/100", confidence: "43%" }
  }
];

function getStatusTone(status: string) {
  if (status === "Good") return "green";
  if (status === "Warning") return "orange";
  return "red";
}

export default function SensorsPage() {
  return (
    <div className="mt-7 space-y-5">
      <Card className="p-5">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Live Sensor Feed</CardTitle>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">
              Predict failures, prevent downtime, and compare sensor telemetry across every machine with consistent machine card styling.
            </p>
          </div>
          <Badge tone="blue" className="uppercase tracking-[0.24em]">
            Real-time layout
          </Badge>
        </CardHeader>
      </Card>

      <div className="grid gap-5 xl:grid-cols-3">
        {sensorPages.map((machine) => (
          <Card key={machine.title} className="overflow-hidden p-0">
            <div className="flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    {machine.area}
                  </p>
                  <h2 className="mt-2 text-xl font-extrabold tracking-[-0.03em] text-slate-950">
                    {machine.title}
                  </h2>
                </div>
                <Badge tone={getStatusTone(machine.status)} className="rounded-2xl px-3 py-2 text-sm font-semibold">
                  {machine.status}
                </Badge>
              </div>

              <div className="grid gap-3">
                {machine.sensors.map((sensor) => (
                  <div
                    key={sensor.name}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-slate-900"></span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">{sensor.name}</span>
                        {sensor.critical ? (
                          <Badge tone="red" className="rounded-full px-2 py-1 text-[10px] font-bold uppercase">
                            Crit
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <span className="font-semibold text-slate-900">{sensor.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">RUL</p>
                  <p className="mt-2 text-lg font-bold text-slate-950">{machine.summary.rul}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Health</p>
                  <p className="mt-2 text-lg font-bold text-slate-950">{machine.summary.health}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Confidence</p>
                  <p className="mt-2 text-lg font-bold text-slate-950">{machine.summary.confidence}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
