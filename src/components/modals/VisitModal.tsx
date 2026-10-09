"use client";

import { useState } from "react";
import { Patient } from "@/lib/types";
import { useStore } from "@/lib/store";
import { useToast } from "../toast";
import { Modal, Button, Field, inputClass, Badge } from "../ui";
import { TempChart } from "../TempChart";
import { derive } from "@/lib/logic";
import { FEVER_FREE_DAYS_REQUIRED } from "@/lib/constants";

export function VisitModal({
  patient,
  onClose,
}: {
  patient: Patient;
  onClose: () => void;
}) {
  const { state, addVisit } = useStore();
  const { show } = useToast();
  const [plan, setPlan] = useState("");
  const [notes, setNotes] = useState("");

  const d = derive(patient, state.currentDay);

  function submit(recommend: boolean) {
    const res = addVisit(patient.id, plan, notes, recommend);
    if (res.ok) {
      show(recommend ? "Visit saved · discharge recommended" : "Visit saved", "success");
      onClose();
    } else {
      show(res.error || "Could not save visit", "error");
    }
  }

  return (
    <Modal
      title="Doctor visit"
      subtitle={`${patient.name} · Bed ${patient.bed} · ${patient.age} yrs`}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => submit(false)}>
            Save visit
          </Button>
          <Button
            variant="primary"
            disabled={!d.eligible}
            onClick={() => submit(true)}
          >
            Save & recommend discharge
          </Button>
        </>
      }
    >
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div className="rounded-2xl border border-[var(--color-line)] p-4">
          <p className="text-xs text-[var(--color-muted)]">Today&apos;s reading</p>
          <p
            className={
              "text-2xl font-semibold mt-1 " +
              (d.feverToday ? "text-[#c3271d]" : "text-[var(--color-ink)]")
            }
          >
            {d.todayReading ? `${d.todayReading.tempC.toFixed(1)} °C` : "—"}
          </p>
          <p className="text-xs text-[var(--color-muted)] mt-1">
            {d.todayReading
              ? `${d.todayReading.time} · ${d.todayReading.by}`
              : "Not measured"}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-line)] p-4">
          <p className="text-xs text-[var(--color-muted)]">Discharge eligibility</p>
          <div className="mt-2">
            {d.eligible ? (
              <Badge tone="green">
                Eligible · {d.streakToday}/{FEVER_FREE_DAYS_REQUIRED} fever-free days
              </Badge>
            ) : (
              <Badge tone="amber">
                {d.displayStreak}/{FEVER_FREE_DAYS_REQUIRED} fever-free days
              </Badge>
            )}
          </div>
          <p className="text-xs text-[var(--color-muted)] mt-2">
            {d.eligible
              ? "Meets the 3-day rule. You can recommend discharge."
              : "Needs 3 consecutive fever-free days to recommend."}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-line)] p-4 mb-4">
        <TempChart patient={patient} currentDay={state.currentDay} />
      </div>

      <div className="space-y-4">
        <Field label="Treatment plan" hint="Required.">
          <textarea
            autoFocus
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            rows={2}
            placeholder="e.g. Continue IV antibiotics, review in 24h"
            className={inputClass}
          />
        </Field>
        <Field label="Notes (optional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Observations"
            className={inputClass}
          />
        </Field>
      </div>
    </Modal>
  );
}
