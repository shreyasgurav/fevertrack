"use client";

import { useMemo, useState } from "react";
import { Patient, Reading } from "@/lib/types";
import { useStore } from "@/lib/store";
import { useToast } from "../toast";
import { Modal, Button, Field, inputClass } from "../ui";
import {
  CRITICAL_TEMP,
  FEVER_TEMP,
  LOW_TEMP,
  MAX_TEMP,
  MIN_TEMP,
} from "@/lib/constants";

function validate(value: string): {
  temp: number;
  level: "ok" | "error" | "fever" | "critical" | "low" | "empty";
  message: string;
} {
  if (value.trim() === "")
    return { temp: NaN, level: "empty", message: "" };
  const temp = parseFloat(value);
  if (Number.isNaN(temp))
    return { temp: NaN, level: "error", message: "Enter a number." };
  if (temp < MIN_TEMP || temp > MAX_TEMP)
    return {
      temp,
      level: "error",
      message: `Out of range. Must be ${MIN_TEMP}–${MAX_TEMP} °C.`,
    };
  if (temp >= CRITICAL_TEMP)
    return {
      temp,
      level: "critical",
      message: "Critical temperature. Patient will be pinned to the doctor queue.",
    };
  if (temp >= FEVER_TEMP)
    return {
      temp,
      level: "fever",
      message: "Fever. The fever-free count resets to 0.",
    };
  if (temp < LOW_TEMP)
    return {
      temp,
      level: "low",
      message: "Unusually low. Please confirm thermometer placement.",
    };
  return { temp, level: "ok", message: "" };
}

export function TemperatureModal({
  patient,
  mode,
  reading,
  onClose,
}: {
  patient: Patient;
  mode: "record" | "correct";
  reading?: Reading;
  onClose: () => void;
}) {
  const { recordTemperature, correctTemperature } = useStore();
  const { show } = useToast();
  const [value, setValue] = useState(
    mode === "correct" && reading ? String(reading.tempC) : ""
  );
  const [reason, setReason] = useState("");

  const v = useMemo(() => validate(value), [value]);
  const canSave =
    v.level !== "empty" &&
    v.level !== "error" &&
    (mode === "record" || reason.trim().length > 0);

  const toneClass =
    v.level === "error" || v.level === "critical"
      ? "text-[#c3271d]"
      : v.level === "fever" || v.level === "low"
      ? "text-[#9a6700]"
      : "text-[#1a7f37]";

  function save() {
    const res =
      mode === "record"
        ? recordTemperature(patient.id, v.temp)
        : correctTemperature(patient.id, reading!.id, v.temp, reason);
    if (res.ok) {
      show(
        mode === "record" ? "Temperature recorded" : "Reading corrected",
        "success"
      );
      onClose();
    } else {
      show(res.error || "Could not save", "error");
    }
  }

  return (
    <Modal
      title={mode === "record" ? "Record temperature" : "Correct reading"}
      subtitle={`${patient.name} · Bed ${patient.bed}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!canSave} onClick={save}>
            {mode === "record" ? "Save reading" : "Save correction"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Temperature (°C)">
          <input
            autoFocus
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 37.2"
            className={inputClass}
          />
        </Field>

        {v.message && <p className={`text-sm -mt-1 ${toneClass}`}>{v.message}</p>}

        {mode === "correct" && reading && (
          <>
            <p className="text-sm text-[var(--color-muted)]">
              Current reading: <b>{reading.tempC.toFixed(1)} °C</b> at{" "}
              {reading.time}. The original value is kept in the audit log.
            </p>
            <Field label="Reason for correction" hint="Required.">
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Mis-keyed, actual was 37.1"
                className={inputClass}
              />
            </Field>
          </>
        )}
      </div>
    </Modal>
  );
}
