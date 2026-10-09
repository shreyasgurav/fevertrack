"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ActionResult, AppState, Patient, Role } from "./types";
import {
  ACTORS,
  MAX_TEMP,
  MIN_TEMP,
  ROLE_KEY,
  STORAGE_KEY,
  TOTAL_BEDS,
} from "./constants";
import { buildSeed } from "./seed";
import {
  derive,
  latestReadingOnDay,
  occupiedBedSet,
  streakEndingAt,
} from "./logic";

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function nowTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

interface StoreValue {
  ready: boolean;
  state: AppState;
  role: Role;
  setRole: (r: Role) => void;
  recordTemperature: (patientId: string, tempC: number) => ActionResult;
  correctTemperature: (
    patientId: string,
    readingId: string,
    tempC: number,
    reason: string
  ) => ActionResult;
  addVisit: (
    patientId: string,
    plan: string,
    notes: string,
    recommend: boolean
  ) => ActionResult;
  recommendDischarge: (patientId: string) => ActionResult;
  confirmDischarge: (patientId: string) => ActionResult;
  recordDeath: (patientId: string, note: string) => ActionResult;
  admitPatient: (name: string, age: number) => ActionResult;
  startNextDay: () => void;
  resetData: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

// Clear a discharge recommendation that no longer meets the criteria.
function reconcile(p: Patient, currentDay: number): Patient {
  if (p.dischargeRecommended) {
    const d = derive(p, currentDay);
    if (!d.eligible) {
      return { ...p, dischargeRecommended: false, dischargeRecommendedBy: undefined };
    }
  }
  return p;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => buildSeed());
  const [role, setRoleState] = useState<Role>("nurse");
  const [ready, setReady] = useState(false);
  const writing = useRef(false);

  // Hydrate from localStorage on mount (browser only).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        if (parsed && parsed.patients) setState(parsed);
      }
      const r = localStorage.getItem(ROLE_KEY) as Role | null;
      if (r === "nurse" || r === "doctor" || r === "admin") setRoleState(r);
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  // Persist on every change.
  useEffect(() => {
    if (!ready) return;
    writing.current = true;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full / blocked */
    }
    writing.current = false;
  }, [state, ready]);

  // Keep other tabs in sync.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setState(JSON.parse(e.newValue) as AppState);
        } catch {
          /* ignore */
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    try {
      localStorage.setItem(ROLE_KEY, r);
    } catch {
      /* ignore */
    }
  }, []);

  const mutate = useCallback(
    (fn: (draft: AppState) => void) => {
      setState((prev) => {
        const next: AppState = JSON.parse(JSON.stringify(prev));
        fn(next);
        return next;
      });
    },
    []
  );

  const find = (s: AppState, id: string) => s.patients.find((p) => p.id === id);

  const recordTemperature = useCallback(
    (patientId: string, tempC: number): ActionResult => {
      let result: ActionResult = { ok: true };
      mutate((s) => {
        const p = find(s, patientId);
        if (!p || p.status !== "admitted") {
          result = { ok: false, error: "Patient is not active." };
          return;
        }
        if (latestReadingOnDay(p, s.currentDay)) {
          const existing = latestReadingOnDay(p, s.currentDay)!;
          result = {
            ok: false,
            error: `Already recorded today at ${existing.time} by ${existing.by}. Use Correct to change it.`,
          };
          return;
        }
        if (Number.isNaN(tempC) || tempC < MIN_TEMP || tempC > MAX_TEMP) {
          result = {
            ok: false,
            error: `Temperature must be between ${MIN_TEMP} and ${MAX_TEMP} °C.`,
          };
          return;
        }
        p.readings.push({
          id: uid("r"),
          day: s.currentDay,
          tempC: Math.round(tempC * 10) / 10,
          by: ACTORS.nurse,
          time: nowTime(),
        });
        const idx = s.patients.findIndex((x) => x.id === patientId);
        s.patients[idx] = reconcile(p, s.currentDay);
      });
      return result;
    },
    [mutate]
  );

  const correctTemperature = useCallback(
    (
      patientId: string,
      readingId: string,
      tempC: number,
      reason: string
    ): ActionResult => {
      let result: ActionResult = { ok: true };
      mutate((s) => {
        const p = find(s, patientId);
        if (!p) {
          result = { ok: false, error: "Patient not found." };
          return;
        }
        const r = p.readings.find((x) => x.id === readingId);
        if (!r) {
          result = { ok: false, error: "Reading not found." };
          return;
        }
        if (r.day !== s.currentDay) {
          result = { ok: false, error: "Only today's reading can be corrected." };
          return;
        }
        if (!reason.trim()) {
          result = { ok: false, error: "A reason is required for a correction." };
          return;
        }
        if (Number.isNaN(tempC) || tempC < MIN_TEMP || tempC > MAX_TEMP) {
          result = {
            ok: false,
            error: `Temperature must be between ${MIN_TEMP} and ${MAX_TEMP} °C.`,
          };
          return;
        }
        if (r.originalTemp === undefined) r.originalTemp = r.tempC;
        r.tempC = Math.round(tempC * 10) / 10;
        r.corrected = true;
        r.reason = reason.trim();
        r.by = ACTORS.nurse;
        r.time = nowTime();
        const idx = s.patients.findIndex((x) => x.id === patientId);
        s.patients[idx] = reconcile(p, s.currentDay);
      });
      return result;
    },
    [mutate]
  );

  const addVisit = useCallback(
    (
      patientId: string,
      plan: string,
      notes: string,
      recommend: boolean
    ): ActionResult => {
      let result: ActionResult = { ok: true };
      mutate((s) => {
        const p = find(s, patientId);
        if (!p || p.status !== "admitted") {
          result = { ok: false, error: "Patient is not active." };
          return;
        }
        if (!latestReadingOnDay(p, s.currentDay)) {
          result = { ok: false, error: "Waiting for today's temperature." };
          return;
        }
        if (p.visits.some((v) => v.day === s.currentDay)) {
          result = { ok: false, error: "A visit is already logged today." };
          return;
        }
        if (!plan.trim()) {
          result = { ok: false, error: "A treatment plan is required." };
          return;
        }
        p.visits.push({
          id: uid("v"),
          day: s.currentDay,
          by: ACTORS.doctor,
          treatmentPlan: plan.trim(),
          notes: notes.trim() || undefined,
          time: nowTime(),
        });
        if (recommend) {
          const d = derive(p, s.currentDay);
          if (!d.eligible) {
            result = {
              ok: false,
              error: "Patient is not yet eligible for discharge.",
            };
            return;
          }
          p.dischargeRecommended = true;
          p.dischargeRecommendedBy = ACTORS.doctor;
        }
      });
      return result;
    },
    [mutate]
  );

  const recommendDischarge = useCallback(
    (patientId: string): ActionResult => {
      let result: ActionResult = { ok: true };
      mutate((s) => {
        const p = find(s, patientId);
        if (!p || p.status !== "admitted") {
          result = { ok: false, error: "Patient is not active." };
          return;
        }
        const d = derive(p, s.currentDay);
        if (!d.eligible) {
          result = { ok: false, error: "Patient is not eligible for discharge." };
          return;
        }
        if (!d.visitedToday) {
          result = {
            ok: false,
            error: "Log today's visit before recommending discharge.",
          };
          return;
        }
        p.dischargeRecommended = true;
        p.dischargeRecommendedBy = ACTORS.doctor;
      });
      return result;
    },
    [mutate]
  );

  const confirmDischarge = useCallback(
    (patientId: string): ActionResult => {
      let result: ActionResult = { ok: true };
      mutate((s) => {
        const p = find(s, patientId);
        if (!p || p.status !== "admitted") {
          result = { ok: false, error: "Patient is not active." };
          return;
        }
        if (!p.dischargeRecommended) {
          result = { ok: false, error: "No discharge recommendation on record." };
          return;
        }
        if (streakEndingAt(p, s.currentDay) < 3) {
          result = { ok: false, error: "Patient no longer meets the criteria." };
          return;
        }
        p.status = "discharged";
        p.outcome = {
          type: "discharged",
          day: s.currentDay,
          by: ACTORS.admin,
          time: nowTime(),
        };
      });
      return result;
    },
    [mutate]
  );

  const recordDeath = useCallback(
    (patientId: string, note: string): ActionResult => {
      let result: ActionResult = { ok: true };
      mutate((s) => {
        const p = find(s, patientId);
        if (!p || p.status !== "admitted") {
          result = { ok: false, error: "Patient is not active." };
          return;
        }
        p.status = "deceased";
        p.dischargeRecommended = false;
        p.outcome = {
          type: "deceased",
          day: s.currentDay,
          by: ACTORS.doctor,
          time: nowTime(),
          note: note.trim() || undefined,
        };
      });
      return result;
    },
    [mutate]
  );

  const admitPatient = useCallback(
    (name: string, age: number): ActionResult => {
      let result: ActionResult = { ok: true };
      mutate((s) => {
        const trimmed = name.trim();
        if (trimmed.length < 2) {
          result = { ok: false, error: "Name must be at least 2 characters." };
          return;
        }
        if (Number.isNaN(age) || age < 0 || age > 120) {
          result = { ok: false, error: "Age must be between 0 and 120." };
          return;
        }
        const dup = s.patients.some(
          (p) =>
            p.status === "admitted" &&
            p.name.toLowerCase() === trimmed.toLowerCase() &&
            p.age === age
        );
        if (dup) {
          result = { ok: false, error: "A patient with this name and age is already admitted." };
          return;
        }
        const taken = occupiedBedSet(s);
        let bed = 0;
        for (let b = 1; b <= TOTAL_BEDS; b++) {
          if (!taken.has(b)) {
            bed = b;
            break;
          }
        }
        if (bed === 0) {
          result = { ok: false, error: `All ${TOTAL_BEDS} beds are in use.` };
          return;
        }
        s.patients.push({
          id: uid("p"),
          name: trimmed,
          age,
          bed,
          status: "admitted",
          admittedDay: s.currentDay,
          readings: [],
          visits: [],
          dischargeRecommended: false,
        });
      });
      return result;
    },
    [mutate]
  );

  const startNextDay = useCallback(() => {
    mutate((s) => {
      s.currentDay += 1;
    });
  }, [mutate]);

  const resetData = useCallback(() => {
    setState(buildSeed());
  }, []);

  const value: StoreValue = {
    ready,
    state,
    role,
    setRole,
    recordTemperature,
    correctTemperature,
    addVisit,
    recommendDischarge,
    confirmDischarge,
    recordDeath,
    admitPatient,
    startNextDay,
    resetData,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
