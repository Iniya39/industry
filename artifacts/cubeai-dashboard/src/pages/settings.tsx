import { BellRing, Building2, Moon, Save, UserRound } from "lucide-react";
import { DashCard, DashCardHeader, DashCardTitle } from "@/components/dashboard/card";
import { DashBadge } from "@/components/dashboard/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { notify } from "@/components/dashboard/toast-host";

const avatarSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='48' fill='%23f3d8c4'/%3E%3Ccircle cx='48' cy='38' r='18' fill='%232f1f1b'/%3E%3Cpath d='M24 90c5-21 16-32 24-32s19 11 24 32' fill='%231e293b'/%3E%3Ccircle cx='39' cy='43' r='3' fill='%23111827'/%3E%3Ccircle cx='57' cy='43' r='3' fill='%23111827'/%3E%3Cpath d='M40 56c6 4 11 4 17 0' stroke='%23111827' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E";

function Toggle({ checked = false }: { checked?: boolean }) {
  return (
    <button
      className={`flex h-7 w-12 items-center rounded-full p-1 transition ${checked ? "bg-blue-600" : "bg-slate-200"}`}
      onClick={() => notify("Setting updated", "Preference saved for this dashboard session.")}
    >
      <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

export default function SettingsPage() {
  return (
    <div className="mt-7 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <DashCard className="p-6">
        <DashCardHeader className="mb-6">
          <DashCardTitle>User Profile</DashCardTitle>
          <UserRound className="h-5 w-5 text-blue-600" />
        </DashCardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarSvg} alt="Arjun Mehta" />
            <AvatarFallback>AM</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-extrabold tracking-[-0.03em] text-slate-950">Arjun Mehta</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Plant Manager • Plant A</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4">
          {[
            ["Email", "arjun.mehta@cubeai.local"],
            ["Role", "Plant Manager"],
            ["Default Plant", "Plant A"]
          ].map(([label, value]) => (
            <label key={label} className="grid gap-2">
              <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-300"
                defaultValue={value}
              />
            </label>
          ))}
        </div>
        <button
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          onClick={() => notify("Profile saved", "Your profile settings were updated.")}
        >
          <Save className="h-4 w-4" />
          Save Profile
        </button>
      </DashCard>

      <div className="grid gap-5">
        <DashCard className="p-6">
          <DashCardHeader className="mb-5">
            <DashCardTitle>Notification Settings</DashCardTitle>
            <BellRing className="h-5 w-5 text-blue-600" />
          </DashCardHeader>
          <div className="space-y-4">
            {[
              ["Critical anomaly alerts", true],
              ["Daily health summary", true],
              ["Maintenance reminders", true],
              ["Model retraining notices", false]
            ].map(([label, checked]) => (
              <div key={label as string} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <span className="font-bold text-slate-800">{label as string}</span>
                <Toggle checked={checked as boolean} />
              </div>
            ))}
          </div>
        </DashCard>

        <div className="grid gap-5 lg:grid-cols-2">
          <DashCard className="p-6">
            <DashCardHeader className="mb-5">
              <DashCardTitle>Theme</DashCardTitle>
              <Moon className="h-5 w-5 text-blue-600" />
            </DashCardHeader>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <DashBadge tone="blue">Light</DashBadge>
              <p className="mt-3 text-sm font-semibold text-slate-600">Current dashboard theme uses the approved light enterprise palette.</p>
            </div>
          </DashCard>

          <DashCard className="p-6">
            <DashCardHeader className="mb-5">
              <DashCardTitle>Plant Configuration</DashCardTitle>
              <Building2 className="h-5 w-5 text-blue-600" />
            </DashCardHeader>
            <div className="space-y-3">
              {["Plant A", "Plant B", "Plant C"].map((plant, index) => (
                <div key={plant} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <span className="font-bold text-slate-800">{plant}</span>
                  <DashBadge tone={index === 0 ? "green" : "slate"}>{index === 0 ? "Active" : "Standby"}</DashBadge>
                </div>
              ))}
            </div>
          </DashCard>
        </div>
      </div>
    </div>
  );
}
