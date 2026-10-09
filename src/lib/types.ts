export type Role = "nurse" | "doctor" | "admin";

export type PatientStatus = "admitted" | "discharged" | "deceased";

export interface Reading {
  id: string;
  day: number;
  tempC: number;
  by: string;
  time: string; // display HH:MM
  corrected?: boolean;
  reason?: string;
  originalTemp?: number;
}

export interface Visit {
  id: string;
  day: number;
  by: string;
  treatmentPlan: string;
  notes?: string;
  time: string;
}

export interface Outcome {
  type: "discharged" | "deceased";
  day: number;
  by: string;
  time: string;
  note?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  bed: number; // 0 means not occupying a bed (closed case)
  status: PatientStatus;
  admittedDay: number;
  readings: Reading[];
  visits: Visit[];
  dischargeRecommended: boolean;
  dischargeRecommendedBy?: string;
  outcome?: Outcome;
}

export interface AppState {
  schema: number;
  currentDay: number;
  patients: Patient[];
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}
