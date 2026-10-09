"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { activePatients, derive, matchesQuery } from "@/lib/logic";
import { CRITICAL_TEMP } from "@/lib/constants";
import {
  Button,
  EmptyState,
  SearchInput,
  SegmentedControl,
  Badge,
} from "../ui";
import { ListCard, PatientRow } from "../PatientRow";
import { useNav } from "../nav";
import { useToast } from "../toast";

type Filter = "ready" | "waiting" | "visited";

export function VisitQueue() {
  const { state } = useStore();
  const { openAction } = useNav();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("ready");

  const active = activePatients(state);
  const counts = useMemo(() => {
    let ready = 0,
      waiting = 0,
      visited = 0;
    for (const p of active) {
      const d = derive(p, state.currentDay);
      if (d.visitedToday) visited++;
      else if (d.measuredToday) ready++;
      else waiting++;
    }
    return { ready, waiting, visited };
  }, [active, state.currentDay]);

  const list = useMemo(() => {
    return active
      .filter((p) => matchesQuery(p, q))
      .filter((p) => {
        const d = derive(p, state.currentDay);
        if (filter === "visited") return d.visitedToday;
        if (filter === "ready") return !d.visitedToday && d.measuredToday;
        return !d.measuredToday; // waiting
      })
      .sort((a, b) => {
        const da = derive(a, state.currentDay);
        const db = derive(b, state.currentDay);
        const fa = da.feverToday ? (da.todayReading!.tempC >= CRITICAL_TEMP ? 2 : 1) : 0;
        const fb = db.feverToday ? (db.todayReading!.tempC >= CRITICAL_TEMP ? 2 : 1) : 0;
        if (fa !== fb) return fb - fa;
        return a.bed - b.bed;
      });
  }, [active, q, filter, state.currentDay]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <SegmentedControl<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "ready", label: "Ready", count: counts.ready },
            { value: "waiting", label: "Waiting", count: counts.waiting },
            { value: "visited", label: "Visited", count: counts.visited },
          ]}
        />
        <div className="sm:w-72">
          <SearchInput value={q} onChange={setQ} placeholder="Search name or bed" />
        </div>
      </div>

      {list.length === 0 ? (
        <ListCard>
          <EmptyState title="Nothing here" hint="No patients match this filter." />
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
                  d.visitedToday ? (
                    <Badge tone="neutral">Visited</Badge>
                  ) : !d.measuredToday ? (
                    <Button variant="secondary" disabled>
                      Waiting for temp
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() =>
                        openAction({ kind: "visit", patientId: p.id })
                      }
                    >
                      Visit
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

export function DischargeReview() {
  const { state, recommendDischarge } = useStore();
  const { openAction } = useNav();
  const { show } = useToast();

  const list = useMemo(
    () =>
      activePatients(state)
        .filter((p) => derive(p, state.currentDay).eligible)
        .sort((a, b) => a.bed - b.bed),
    [state]
  );

  function recommend(id: string) {
    const res = recommendDischarge(id);
    show(res.ok ? "Discharge recommended" : res.error || "Could not recommend", res.ok ? "success" : "error");
  }

  if (list.length === 0)
    return (
      <ListCard>
        <EmptyState
          title="No one is eligible yet"
          hint="Patients appear here after 3 consecutive fever-free days."
        />
      </ListCard>
    );

  return (
    <ListCard>
      {list.map((p) => {
        const d = derive(p, state.currentDay);
        return (
          <PatientRow
            key={p.id}
            patient={p}
            actions={
              p.dischargeRecommended ? (
                <Badge tone="blue">Recommended</Badge>
              ) : d.visitedToday ? (
                <Button variant="primary" onClick={() => recommend(p.id)}>
                  Recommend discharge
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => openAction({ kind: "visit", patientId: p.id })}
                >
                  Log visit first
                </Button>
              )
            }
          />
        );
      })}
    </ListCard>
  );
}
