"use client";

import { useState } from "react";
import { Patient } from "@/lib/types";
import { useStore } from "@/lib/store";
import { useToast } from "../toast";
import { Modal, Button, Field, inputClass } from "../ui";

export function DeathModal({
  patient,
  onClose,
}: {
  patient: Patient;
  onClose: () => void;
}) {
  const { recordDeath } = useStore();
  const { show } = useToast();
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(false);

  function submit() {
    const res = recordDeath(patient.id, note);
    if (res.ok) {
      show("Death recorded · case closed", "info");
      onClose();
    } else {
      show(res.error || "Could not record", "error");
    }
  }

  return (
    <Modal
      title="Record death"
      subtitle={`${patient.name} · Bed ${patient.bed}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" disabled={!confirm} onClick={submit}>
            Record death
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-[#ffe5e3] text-[#c3271d] text-sm px-4 py-3">
          This closes the case and frees the bed. It cannot be undone from the
          app.
        </div>
        <Field label="Cause / note (optional)">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="e.g. Cardiac arrest"
            className={inputClass}
          />
        </Field>
        <label className="flex items-start gap-2.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={confirm}
            onChange={(e) => setConfirm(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[#ff3b30]"
          />
          <span>
            I confirm this record for <b>{patient.name}</b> is correct.
          </span>
        </label>
      </div>
    </Modal>
  );
}
