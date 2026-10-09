"use client";

import React from "react";
import { Patient } from "@/lib/types";
import { useStore } from "@/lib/store";
import { useNav } from "./nav";
import { StatusChips } from "./chips";

export function PatientRow({
  patient,
  actions,
}: {
  patient: Patient;
  actions?: React.ReactNode;
}) {
  const { state } = useStore();
  const { openPatient } = useNav();

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#fbfbfd] transition">
      <button
        onClick={() => openPatient(patient.id)}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
      >
        <div className="w-11 h-11 shrink-0 rounded-xl bg-[#f0f0f3] flex flex-col items-center justify-center leading-none">
          <span className="text-[10px] text-[var(--color-muted)]">BED</span>
          <span className="text-sm font-semibold">{patient.bed || "—"}</span>
        </div>
        <div className="min-w-0">
          <p className="font-medium truncate">
            {patient.name}
            <span className="text-[var(--color-muted)] font-normal">
              {" "}
              · {patient.age}
            </span>
          </p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <StatusChips patient={patient} currentDay={state.currentDay} />
          </div>
        </div>
      </button>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function ListCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-[var(--color-line)] overflow-hidden divide-y divide-[var(--color-line)]">
      {children}
    </div>
  );
}
