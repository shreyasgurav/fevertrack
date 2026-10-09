"use client";

import { useEffect, useState } from "react";
import { StoreProvider, useStore } from "@/lib/store";
import { ToastProvider } from "@/components/toast";
import { NavProvider } from "@/components/nav";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { PatientRecord } from "@/components/PatientRecord";
import { ActionModals } from "@/components/ActionModals";
import { Role } from "@/lib/types";
import { NurseRounds, NurseLog } from "@/components/screens/nurse";
import { VisitQueue, DischargeReview } from "@/components/screens/doctor";
import {
  AdminOverview,
  AdminDischarges,
  AdminAdmissions,
  AdminOutcomes,
} from "@/components/screens/admin";

interface Tab {
  id: string;
  label: string;
  render: () => React.ReactNode;
}

const TABS: Record<Role, Tab[]> = {
  nurse: [
    { id: "rounds", label: "Today's rounds", render: () => <NurseRounds /> },
    { id: "log", label: "Reading log", render: () => <NurseLog /> },
  ],
  doctor: [
    { id: "queue", label: "Visit queue", render: () => <VisitQueue /> },
    { id: "discharge", label: "Discharge review", render: () => <DischargeReview /> },
  ],
  admin: [
    { id: "overview", label: "Overview", render: () => <AdminOverview /> },
    { id: "discharges", label: "Discharges", render: () => <AdminDischarges /> },
    { id: "admissions", label: "Admissions", render: () => <AdminAdmissions /> },
    { id: "outcomes", label: "Outcomes", render: () => <AdminOutcomes /> },
  ],
};

const SUBTITLE: Record<Role, string> = {
  nurse: "Record one temperature per patient, per day.",
  doctor: "Visit measured patients and manage discharge.",
  admin: "Beds, admissions and ward outcomes.",
};

function AppRoot() {
  const { ready, role, state, startNextDay, resetData } = useStore();
  const [tabId, setTabId] = useState<string>("");

  const tabs = TABS[role];

  useEffect(() => {
    // Reset to the first tab whenever the role changes.
    setTabId(TABS[role][0].id);
  }, [role]);

  if (!ready)
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--color-muted)] text-sm">
        Loading ward…
      </div>
    );

  const active = tabs.find((t) => t.id === tabId) ?? tabs[0];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-[#f5f5f7]/80 backdrop-blur-xl border-b border-[var(--color-line)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[var(--color-accent)] text-white flex items-center justify-center text-sm font-bold">
                F
              </div>
              <div className="leading-tight">
                <p className="font-semibold text-[15px]">FeverTrack</p>
              </div>
              <span className="ml-2 text-xs text-[var(--color-muted)] rounded-full bg-white border border-[var(--color-line)] px-2 py-0.5">
                Day {state.currentDay}
              </span>
            </div>
            <RoleSwitcher />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 -mb-px overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTabId(t.id)}
                className={`px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                  t.id === active.id
                    ? "border-[var(--color-accent)] text-[var(--color-ink)]"
                    : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 w-full">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <p className="text-sm text-[var(--color-muted)] mb-4">{SUBTITLE[role]}</p>
          {active.render()}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-line)] bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-center text-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={startNextDay}
              className="rounded-full border border-[var(--color-line)] bg-white px-3.5 py-1.5 font-medium hover:bg-[#fbfbfd]"
            >
              Start next day
            </button>
            <button
              onClick={() => {
                if (
                  confirm(
                    "Reset the sample ward? This clears all changes in this browser."
                  )
                )
                  resetData();
              }}
              className="rounded-full border border-[var(--color-line)] bg-white px-3.5 py-1.5 font-medium text-[var(--color-muted)] hover:bg-[#fbfbfd]"
            >
              Reset sample data
            </button>
          </div>
        </div>
      </footer>

      <PatientRecord />
      <ActionModals />
    </div>
  );
}

export default function Page() {
  return (
    <StoreProvider>
      <ToastProvider>
        <NavProvider>
          <AppRoot />
        </NavProvider>
      </ToastProvider>
    </StoreProvider>
  );
}
