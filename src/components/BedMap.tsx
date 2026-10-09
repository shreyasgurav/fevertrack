"use client";

import { useStore } from "@/lib/store";
import { useNav } from "./nav";
import { derive, patientAtBed } from "@/lib/logic";
import { TOTAL_BEDS } from "@/lib/constants";

export function BedMap() {
  const { state } = useStore();
  const { openPatient } = useNav();

  const beds = Array.from({ length: TOTAL_BEDS }, (_, i) => i + 1);

  return (
    <div>
      <div className="grid grid-cols-10 sm:grid-cols-12 gap-1.5">
        {beds.map((b) => {
          const p = patientAtBed(state, b);
          let cls = "bg-[#f0f0f3] text-[#b0b0b5]"; // free
          let title = `Bed ${b} · free`;
          if (p) {
            const d = derive(p, state.currentDay);
            if (p.dischargeRecommended || d.eligible) {
              cls = "bg-[#1a7f37] text-white";
              title = `Bed ${b} · ${p.name} · ready to discharge`;
            } else if (d.feverToday) {
              cls = "bg-[#ff3b30] text-white";
              title = `Bed ${b} · ${p.name} · fever`;
            } else if (!d.measuredToday) {
              cls = "bg-[#f5a623] text-white";
              title = `Bed ${b} · ${p.name} · to measure`;
            } else {
              cls = "bg-[#0071e3] text-white";
              title = `Bed ${b} · ${p.name} · clear`;
            }
          }
          return (
            <button
              key={b}
              title={title}
              onClick={() => p && openPatient(p.id)}
              className={`aspect-square rounded-md text-[10px] font-medium flex items-center justify-center transition ${cls} ${
                p ? "hover:opacity-80 cursor-pointer" : "cursor-default"
              }`}
            >
              {b}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-[var(--color-muted)]">
        <Legend color="#0071e3" label="Clear" />
        <Legend color="#ff3b30" label="Fever" />
        <Legend color="#f5a623" label="To measure" />
        <Legend color="#1a7f37" label="Ready to discharge" />
        <Legend color="#f0f0f3" label="Free" border />
      </div>
    </div>
  );
}

function Legend({ color, label, border }: { color: string; label: string; border?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="w-3 h-3 rounded-sm"
        style={{
          background: color,
          border: border ? "1px solid #e5e5ea" : undefined,
        }}
      />
      {label}
    </span>
  );
}
