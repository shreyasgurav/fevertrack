"use client";

import { useStore } from "@/lib/store";
import { useNav } from "./nav";
import { TemperatureModal } from "./modals/TemperatureModal";
import { VisitModal } from "./modals/VisitModal";
import { DeathModal } from "./modals/DeathModal";

export function ActionModals() {
  const { state } = useStore();
  const { action, closeAction } = useNav();
  if (!action) return null;
  const patient = state.patients.find((p) => p.id === action.patientId);
  if (!patient) return null;

  if (action.kind === "record")
    return (
      <TemperatureModal patient={patient} mode="record" onClose={closeAction} />
    );
  if (action.kind === "correct") {
    const reading = patient.readings.find((r) => r.id === action.readingId);
    return (
      <TemperatureModal
        patient={patient}
        mode="correct"
        reading={reading}
        onClose={closeAction}
      />
    );
  }
  if (action.kind === "visit")
    return <VisitModal patient={patient} onClose={closeAction} />;
  if (action.kind === "death")
    return <DeathModal patient={patient} onClose={closeAction} />;
  return null;
}
