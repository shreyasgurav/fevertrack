import { Role } from "./types";

export const TOTAL_BEDS = 74;

export const MIN_TEMP = 34.0;
export const MAX_TEMP = 42.0;
export const FEVER_TEMP = 38.0;
export const CRITICAL_TEMP = 40.0;
export const LOW_TEMP = 35.5;

export const FEVER_FREE_DAYS_REQUIRED = 3;

// Benchmark: 85% success target => 15% mortality ceiling.
export const SUCCESS_BENCHMARK = 85;
export const MORTALITY_LIMIT = 15;
export const MORTALITY_AMBER = 13;

export const STORAGE_KEY = "fevertrack.state.v1";
export const ROLE_KEY = "fevertrack.role.v1";

export const ACTORS: Record<Role, string> = {
  nurse: "Nurse Riya",
  doctor: "Dr. Mehta",
  admin: "Admin Desk",
};

export const ROLE_LABELS: Record<Role, string> = {
  nurse: "Nurse",
  doctor: "Doctor",
  admin: "Admin",
};
