"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Patient, Reading } from "@/lib/types";
import {
  activePatients,
  derive,
  latestReadingOnDay,
  matchesQuery,
} from "@/lib/logic";
import { FEVER_TEMP } from "@/lib/constants";
import {
  Button,
  EmptyState,
  SearchInput,
  SegmentedControl,
} from "../ui";
import { ListCard, PatientRow } from "../PatientRow";
import { useNav } from "../nav";
import { Badge } from "../ui";

type Filter = "to-measure" | "measured" | "all";

export function NurseRounds() {
  const { state } = useStore();
  const { openAction } = useNav();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("to-measure");

  const active = activePatients(state);
  const measuredCount = active.filter((p) =>
    derive(p, state.currentDay).measuredToday
  ).length;

  const list = useMemo(() => {
    return active
      .filter((p) => matchesQuery(p, q))
      .filter((p) => {
        const d = derive(p, state.currentDay);
        if (filter === "to-measure") return !d.measuredToday;
        if (filter === "measured") return d.measuredToday;
        return true;
      })
      .sort((a, b) => {
        const da = derive(a, state.currentDay);
        const db = derive(b, state.currentDay);
        // unmeasured first, then fever, then by bed
        if (da.measuredToday !== db.measuredToday)
          return da.measuredToday ? 1 : -1;
        if (da.feverToday !== db.feverToday) return da.feverToday ? -1 : 1;
        return a.bed - b.bed;
      });
  }, [active, q, filter, state.currentDay]);

  const pct = active.length
    ? Math.round((measuredCount / active.length) * 100)
    : 0;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">
            Measured today{" "}
            <span className="text-[var(--color-muted)]">
              {measuredCount} of {active.length}
            </span>
          </p>
          <span className="text-sm text-[var(--color-muted)]">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-[#ececf0] overflow-hidden">
          <div
            className="h-full bg-[var(--color-accent)] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <SegmentedControl<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            {
              value: "to-measure",
              label: "To measure",
              count: active.length - measuredCount,
            },
            { value: "measured", label: "Measured", count: measuredCount },
            { value: "all", label: "All", count: active.length },
          ]}
        />
        <div className="sm:w-72">
          <SearchInput value={q} onChange={setQ} placeholder="Search name or bed" />
        </div>
      </div>

      {list.length === 0 ? (
        <ListCard>
          <EmptyState
            title="Nothing here"
            hint="Everyone in this filter is accounted for."
          />
        </ListCard>
      ) : (
        <ListCard>
          {list.map((p) => {
            const d = derive(p, state.currentDay);
            return (
              <PatientRow
                key={p.id}
                patient={p}
                actions={
                  d.measuredToday ? (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        openAction({
                          kind: "correct",
                          patientId: p.id,
                          readingId: latestReadingOnDay(p, state.currentDay)?.id,
                        })
                      }
                    >
                      Correct
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() =>
                        openAction({ kind: "record", patientId: p.id })
                      }
                    >
                      Record
                    </Button>
                  )
                }
              />
            );
          })}
        </ListCard>
      )}
    </div>
  );
}

export function NurseLog() {
  const { state } = useStore();

  const rows = useMemo(() => {
    const items: { patient: Patient; reading: Reading }[] = [];
    for (const p of state.patients) {
      for (const r of p.readings) {
        if (r.day === state.currentDay) items.push({ patient: p, reading: r });
      }
    }
    return items.sort((a, b) => b.reading.time.localeCompare(a.reading.time));
  }, [state]);

  if (rows.length === 0)
    return (
      <ListCard>
        <EmptyState
          title="No readings yet today"
          hint="Record a temperature from Today's rounds."
        />
      </ListCard>
    );

  return (
    <ListCard>
      {rows.map(({ patient, reading }) => (
        <div key={reading.id} className="flex items-center gap-3 px-4 py-3">
          <div className="w-14 shrink-0 text-sm text-[var(--color-muted)]">
            {reading.time}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {patient.name}{" "}
              <span className="text-[var(--color-muted)] font-normal">
                · Bed {patient.bed}
              </span>
            </p>
            <p className="text-xs text-[var(--color-muted)]">
              {reading.by}
              {reading.corrected &&
                ` · corrected from ${reading.originalTemp?.toFixed(
                  1
                )}° — ${reading.reason}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {reading.corrected && <Badge tone="amber">Corrected</Badge>}
            <span
              className={
                "font-semibold tabular-nums " +
                (reading.tempC >= FEVER_TEMP
                  ? "text-[#c3271d]"
                  : "text-[var(--color-ink)]")
              }
            >
              {reading.tempC.toFixed(1)}°
            </span>
          </div>
        </div>
      ))}
    </ListCard>
  );
}
