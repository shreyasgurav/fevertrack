"use client";

import React, { createContext, useContext, useState } from "react";

export type ActionKind = "record" | "correct" | "visit" | "death";

export interface Action {
  kind: ActionKind;
  patientId: string;
  readingId?: string;
}

const NavContext = createContext<{
  openPatientId: string | null;
  openPatient: (id: string) => void;
  closePatient: () => void;
  action: Action | null;
  openAction: (a: Action) => void;
  closeAction: () => void;
} | null>(null);

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [openPatientId, setOpenPatientId] = useState<string | null>(null);
  const [action, setAction] = useState<Action | null>(null);

  return (
    <NavContext.Provider
      value={{
        openPatientId,
        openPatient: setOpenPatientId,
        closePatient: () => setOpenPatientId(null),
        action,
        openAction: (a) => {
          setOpenPatientId(null);
          setAction(a);
        },
        closeAction: () => setAction(null),
      }}
    >
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav must be used within NavProvider");
  return ctx;
}
