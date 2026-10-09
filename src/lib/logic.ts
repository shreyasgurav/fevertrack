import { AppState, Patient, Reading } from "./types";
import { FEVER_TEMP, FEVER_FREE_DAYS_REQUIRED } from "./constants";

export function matchesQuery(p: Patient, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return (
    p.name.toLowerCase().includes(s) ||
    String(p.bed) === s ||
    `bed ${p.bed}`.includes(s)
  );
}

export function readingsOnDay(p: Patient, day: number): Reading[] {
  return p.readings.filter((r) => r.day === day);
}

export function latestReadingOnDay(p: Patient, day: number): Reading | undefined {
  const list = readingsOnDay(p, day);
  return list.length ? list[list.length - 1] : undefined;
}

export function hasReadingOnDay(p: Patient, day: number): boolean {
  return readingsOnDay(p, day).length > 0;
}

// A day is fever-free if it has at least one reading and every reading < 38.0.
export function isFeverFreeDay(p: Patient, day: number): boolean {
  const list = readingsOnDay(p, day);
  if (list.length === 0) return false;
  return list.every((r) => r.tempC < FEVER_TEMP);
}

export function isFeverDay(p: Patient, day: number): boolean {
  const list = readingsOnDay(p, day);
  return list.some((r) => r.tempC >= FEVER_TEMP);
}

// Consecutive fever-free days ending exactly at `endDay`. A missing day breaks it.
export function streakEndingAt(p: Patient, endDay: number): number {
  let streak = 0;
  for (let d = endDay; d >= p.admittedDay; d--) {
    const list = readingsOnDay(p, d);
    if (list.length === 0) break;
    if (list.every((r) => r.tempC < FEVER_TEMP)) streak++;
    else break;
  }
  return streak;
}

export interface Derived {
  measuredToday: boolean;
  visitedToday: boolean;
  todayReading?: Reading;
  feverToday: boolean;
  streakToday: number; // streak ending today (0 if today not measured / fever)
  displayStreak: number; // best-known streak for display
  eligible: boolean; // meets discharge criteria right now
  needsTodayReading: boolean; // 2+ clear days but today unmeasured
}

export function derive(p: Patient, currentDay: number): Derived {
  const todayReading = latestReadingOnDay(p, currentDay);
  const measuredToday = hasReadingOnDay(p, currentDay);
  const visitedToday = p.visits.some((v) => v.day === currentDay);
  const feverToday = isFeverDay(p, currentDay);

  const streakToday = streakEndingAt(p, currentDay);
  const priorStreak = streakEndingAt(p, currentDay - 1);
  const displayStreak = measuredToday ? streakToday : priorStreak;

  const eligible =
    p.status === "admitted" && streakToday >= FEVER_FREE_DAYS_REQUIRED;
  const needsTodayReading =
    p.status === "admitted" &&
    !measuredToday &&
    priorStreak >= FEVER_FREE_DAYS_REQUIRED - 1;

  return {
    measuredToday,
    visitedToday,
    todayReading,
    feverToday,
    streakToday,
    displayStreak,
    eligible,
    needsTodayReading,
  };
}

export function activePatients(state: AppState): Patient[] {
  return state.patients.filter((p) => p.status === "admitted");
}

export function occupiedBeds(state: AppState): number {
  return activePatients(state).length;
}

export function occupiedBedSet(state: AppState): Set<number> {
  return new Set(activePatients(state).map((p) => p.bed));
}

export function patientAtBed(state: AppState, bed: number): Patient | undefined {
  return activePatients(state).find((p) => p.bed === bed);
}

export interface Outcomes {
  discharged: number;
  deceased: number;
  closed: number;
  mortalityRate: number; // percent
  successRate: number; // percent
}

export function outcomes(state: AppState): Outcomes {
  const discharged = state.patients.filter(
    (p) => p.status === "discharged"
  ).length;
  const deceased = state.patients.filter((p) => p.status === "deceased").length;
  const closed = discharged + deceased;
  const mortalityRate = closed === 0 ? 0 : (deceased / closed) * 100;
  const successRate = closed === 0 ? 100 : (discharged / closed) * 100;
  return { discharged, deceased, closed, mortalityRate, successRate };
}
