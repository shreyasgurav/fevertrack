"use client";

import { useStore } from "@/lib/store";
import { useNav } from "./nav";
import { useToast } from "./toast";
import { Modal, Badge, Button } from "./ui";
import { TempChart } from "./TempChart";
import { derive, latestReadingOnDay } from "@/lib/logic";
import { FEVER_TEMP } from "@/lib/constants";
import { StatusChips } from "./chips";

export function PatientRecord() {
  const { state, role, confirmDischarge } = useStore();
  const { openPatientId, closePatient, openAction } = useNav();
  const { show } = useToast();
  const patient = state.patients.find((p) => p.id === openPatientId);
  if (!patient) return null;

  const d = derive(patient, state.currentDay);
  const isActive = patient.status === "admitted";

  const footer = (() => {
    if (!isActive) return undefined;
    if (role === "nurse")
      return d.measuredToday ? (
        <Button
          variant="secondary"
          onClick={() =>
            openAction({
              kind: "correct",
              patientId: patient.id,
              readingId: latestReadingOnDay(patient, state.currentDay)?.id,
            })
          }
        >
          Correct reading
        </Button>
      ) : (
        <Button
          variant="primary"
          onClick={() => openAction({ kind: "record", patientId: patient.id })}
        >
          Record temperature
        </Button>
      );
    if (role === "doctor")
      return (
        <>
          <Button
            variant="danger"
            onClick={() => openAction({ kind: "death", patientId: patient.id })}
          >
            Record death
          </Button>
          {d.measuredToday && !d.visitedToday && (
            <Button
              variant="primary"
              onClick={() => openAction({ kind: "visit", patientId: patient.id })}
            >
              Log visit
            </Button>
          )}
        </>
      );
    if (role === "admin" && patient.dischargeRecommended)
      return (
        <Button
          variant="primary"
          onClick={() => {
            const res = confirmDischarge(patient.id);
            show(
              res.ok ? "Discharge confirmed · bed freed" : res.error || "Failed",
              res.ok ? "success" : "error"
            );
            if (res.ok) closePatient();
          }}
        >
          Confirm discharge
        </Button>
      );
    return undefined;
  })();

  const start = state.currentDay - 6;
  const historyDays: number[] = [];
  for (let day = state.currentDay; day >= start; day--) historyDays.push(day);

  const corrections = patient.readings.filter((r) => r.corrected);

  return (
    <Modal
      title={patient.name}
      subtitle={`${patient.age} yrs · ${
        patient.bed ? `Bed ${patient.bed}` : "No bed"
      } · Admitted day ${patient.admittedDay}`}
      onClose={closePatient}
      wide
      footer={footer}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <StatusChips patient={patient} currentDay={state.currentDay} />
      </div>

      <div className="rounded-2xl border border-[var(--color-line)] p-4 mb-5">
        <p className="text-sm font-medium mb-2">Temperature — last 7 days</p>
        <TempChart patient={patient} currentDay={state.currentDay} />
      </div>

      <p className="text-sm font-medium mb-2">Daily readings</p>
      <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] mb-5">
        <table className="w-full text-sm">
          <thead className="bg-[#fbfbfd] text-[var(--color-muted)]">
            <tr>
              <th className="text-left font-medium px-4 py-2">Day</th>
              <th className="text-left font-medium px-4 py-2">Temp</th>
              <th className="text-left font-medium px-4 py-2">Status</th>
              <th className="text-left font-medium px-4 py-2">Time · By</th>
            </tr>
          </thead>
          <tbody>
            {historyDays.map((day) => {
              const r = latestReadingOnDay(patient, day);
              const missed = !r && day >= patient.admittedDay;
              return (
                <tr key={day} className="border-t border-[var(--color-line)]">
                  <td className="px-4 py-2 text-[var(--color-muted)]">
                    D{day}
                    {day === state.currentDay && (
                      <span className="ml-1 text-[var(--color-accent)]">·today</span>
                    )}
                  </td>
                  <td className="px-4 py-2 font-medium">
                    {r ? `${r.tempC.toFixed(1)} °C` : "—"}
                  </td>
                  <td className="px-4 py-2">
                    {r ? (
                      r.tempC >= FEVER_TEMP ? (
                        <Badge tone="red">Fever</Badge>
                      ) : (
                        <Badge tone="green">Clear</Badge>
                      )
                    ) : day < patient.admittedDay ? (
                      <span className="text-[var(--color-muted)]">—</span>
                    ) : (
                      <Badge tone="amber">Missed</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2 text-[var(--color-muted)]">
                    {r ? `${r.time} · ${r.by}` : missed ? "No reading" : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {corrections.length > 0 && (
        <>
          <p className="text-sm font-medium mb-2">Correction history</p>
          <div className="space-y-2 mb-5">
            {corrections.map((r) => (
              <div
                key={r.id}
                className="text-sm rounded-xl bg-[#fbfbfd] border border-[var(--color-line)] px-4 py-2.5"
              >
                <span className="text-[var(--color-muted)]">D{r.day}: </span>
                {r.originalTemp?.toFixed(1)} → {r.tempC.toFixed(1)} °C
                <span className="text-[var(--color-muted)]">
                  {" "}
                  · {r.reason} · {r.by} {r.time}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="text-sm font-medium mb-2">Doctor visits</p>
      {patient.visits.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)] mb-2">No visits logged.</p>
      ) : (
        <div className="space-y-2 mb-2">
          {[...patient.visits]
            .sort((a, b) => b.day - a.day)
            .map((v) => (
              <div
                key={v.id}
                className="text-sm rounded-xl border border-[var(--color-line)] px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Day {v.day}</span>
                  <span className="text-xs text-[var(--color-muted)]">
                    {v.time} · {v.by}
                  </span>
                </div>
                <p className="mt-1">{v.treatmentPlan}</p>
                {v.notes && (
                  <p className="text-[var(--color-muted)] mt-0.5">{v.notes}</p>
                )}
              </div>
            ))}
        </div>
      )}

      {patient.outcome && (
        <div className="mt-4 rounded-xl px-4 py-3 text-sm bg-[#fbfbfd] border border-[var(--color-line)]">
          <span className="font-medium">
            {patient.outcome.type === "deceased" ? "Deceased" : "Discharged"}
          </span>{" "}
          on day {patient.outcome.day} · {patient.outcome.time} ·{" "}
          {patient.outcome.by}
          {patient.outcome.note && (
            <p className="text-[var(--color-muted)] mt-0.5">
              {patient.outcome.note}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
