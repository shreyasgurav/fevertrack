"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  activePatients,
  derive,
  occupiedBeds,
  outcomes,
} from "@/lib/logic";
import {
  SUCCESS_BENCHMARK,
  TOTAL_BEDS,
} from "@/lib/constants";
import { Card, Button, Badge, Field, inputClass, EmptyState } from "../ui";
import { ListCard, PatientRow } from "../PatientRow";
import { MortalityGauge } from "../MortalityGauge";
import { BedMap } from "../BedMap";
import { useToast } from "../toast";

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "red" | "amber" | "green";
}) {
  const color =
    tone === "red"
      ? "text-[#c3271d]"
      : tone === "amber"
      ? "text-[#9a6700]"
      : tone === "green"
      ? "text-[#1a7f37]"
      : "text-[var(--color-ink)]";
  return (
    <Card className="p-4">
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-[var(--color-muted)] mt-0.5">{sub}</p>}
    </Card>
  );
}

export function AdminOverview() {
  const { state } = useStore();
  const active = activePatients(state);
  const occupied = occupiedBeds(state);
  const measured = active.filter((p) => derive(p, state.currentDay).measuredToday).length;
  const pending = active.filter((p) => p.dischargeRecommended).length;
  const o = outcomes(state);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Occupied beds" value={`${occupied} / ${TOTAL_BEDS}`} sub={`${TOTAL_BEDS - occupied} free`} />
        <Stat label="Measured today" value={`${measured} / ${active.length}`} />
        <Stat label="Pending discharges" value={`${pending}`} sub="recommended by doctor" />
        <Stat
          label="Mortality rate"
          value={`${o.mortalityRate.toFixed(1)}%`}
          sub={`${o.closed} closed cases`}
          tone={o.mortalityRate > 15 ? "red" : o.mortalityRate >= 13 ? "amber" : "green"}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="p-5 flex flex-col items-center justify-center">
          <MortalityGauge rate={o.mortalityRate} />
        </Card>
        <Card className="p-5 lg:col-span-2">
          <p className="text-sm font-medium mb-3">Ward bed map · {TOTAL_BEDS} beds</p>
          <BedMap />
        </Card>
      </div>
    </div>
  );
}

export function AdminDischarges() {
  const { state, confirmDischarge } = useStore();
  const { show } = useToast();

  const recommended = useMemo(
    () => activePatients(state).filter((p) => p.dischargeRecommended),
    [state]
  );
  const awaitingDoctor = useMemo(
    () =>
      activePatients(state).filter(
        (p) => !p.dischargeRecommended && derive(p, state.currentDay).eligible
      ),
    [state]
  );

  function confirm(id: string) {
    const res = confirmDischarge(id);
    show(res.ok ? "Discharge confirmed · bed freed" : res.error || "Failed", res.ok ? "success" : "error");
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium mb-2">
          Ready to confirm{" "}
          <span className="text-[var(--color-muted)]">({recommended.length})</span>
        </p>
        {recommended.length === 0 ? (
          <ListCard>
            <EmptyState title="No discharges to confirm" hint="Doctor recommendations appear here." />
          </ListCard>
        ) : (
          <ListCard>
            {recommended.map((p) => (
              <PatientRow
                key={p.id}
                patient={p}
                actions={
                  <Button variant="primary" onClick={() => confirm(p.id)}>
                    Confirm discharge
                  </Button>
                }
              />
            ))}
          </ListCard>
        )}
      </section>

      <section>
        <p className="text-sm font-medium mb-2">
          Awaiting doctor{" "}
          <span className="text-[var(--color-muted)]">({awaitingDoctor.length})</span>
        </p>
        {awaitingDoctor.length === 0 ? (
          <ListCard>
            <EmptyState title="Nothing waiting" hint="Eligible patients without a recommendation show here." />
          </ListCard>
        ) : (
          <ListCard>
            {awaitingDoctor.map((p) => (
              <PatientRow
                key={p.id}
                patient={p}
                actions={<Badge tone="amber">Needs doctor</Badge>}
              />
            ))}
          </ListCard>
        )}
      </section>
    </div>
  );
}

export function AdminAdmissions() {
  const { state, admitPatient } = useStore();
  const { show } = useToast();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");

  const occupied = occupiedBeds(state);
  const free = TOTAL_BEDS - occupied;
  const full = free === 0;

  const admittedToday = useMemo(
    () =>
      activePatients(state)
        .filter((p) => p.admittedDay === state.currentDay)
        .sort((a, b) => b.bed - a.bed),
    [state]
  );

  function submit() {
    const res = admitPatient(name, parseInt(age, 10));
    if (res.ok) {
      show("Patient admitted · bed assigned", "success");
      setName("");
      setAge("");
    } else {
      show(res.error || "Could not admit", "error");
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium">Admit a new patient</p>
          <Badge tone={full ? "red" : "green"}>
            {full ? "All beds full" : `${free} beds free`}
          </Badge>
        </div>
        <div className="space-y-4">
          <Field label="Full name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              className={inputClass}
              disabled={full}
            />
          </Field>
          <Field label="Age" hint="0 to 120. The lowest free bed is assigned automatically.">
            <input
              value={age}
              onChange={(e) => setAge(e.target.value)}
              inputMode="numeric"
              placeholder="e.g. 34"
              className={inputClass}
              disabled={full}
            />
          </Field>
          <Button variant="primary" disabled={full} onClick={submit}>
            Admit patient
          </Button>
        </div>
      </Card>

      {admittedToday.length > 0 && (
        <section>
          <p className="text-sm font-medium mb-2">Admitted today</p>
          <ListCard>
            {admittedToday.map((p) => (
              <PatientRow
                key={p.id}
                patient={p}
                actions={<Badge tone="blue">Bed {p.bed}</Badge>}
              />
            ))}
          </ListCard>
        </section>
      )}
    </div>
  );
}

export function AdminOutcomes() {
  const { state } = useStore();
  const o = outcomes(state);

  const closed = useMemo(
    () =>
      state.patients
        .filter((p) => p.outcome)
        .sort((a, b) => (b.outcome!.day - a.outcome!.day)),
    [state]
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          label="Success rate"
          value={`${o.successRate.toFixed(1)}%`}
          sub={`target ${SUCCESS_BENCHMARK}%`}
          tone={o.successRate >= SUCCESS_BENCHMARK ? "green" : "amber"}
        />
        <Stat
          label="Mortality rate"
          value={`${o.mortalityRate.toFixed(1)}%`}
          sub="15% ceiling"
          tone={o.mortalityRate > 15 ? "red" : o.mortalityRate >= 13 ? "amber" : "green"}
        />
        <Stat label="Discharged" value={`${o.discharged}`} />
        <Stat label="Deceased" value={`${o.deceased}`} />
      </div>

      <Card className="p-5 max-w-md">
        <MortalityGauge rate={o.mortalityRate} />
      </Card>

      <section>
        <p className="text-sm font-medium mb-2">Recent closed cases</p>
        {closed.length === 0 ? (
          <ListCard>
            <EmptyState title="No closed cases yet" />
          </ListCard>
        ) : (
          <ListCard>
            {closed.slice(0, 20).map((p) => (
              <PatientRow
                key={p.id}
                patient={p}
                actions={
                  <span className="text-xs text-[var(--color-muted)]">
                    Day {p.outcome!.day}
                  </span>
                }
              />
            ))}
          </ListCard>
        )}
      </section>
    </div>
  );
}
