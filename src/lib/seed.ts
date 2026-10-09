import { AppState, Patient, Reading, Visit } from "./types";

// Deterministic PRNG so the sample ward is identical on every reset.
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = [
  "Aarav", "Diya", "Vihaan", "Ananya", "Reyansh", "Ishita", "Kabir", "Myra",
  "Arjun", "Sara", "Vivaan", "Aisha", "Dhruv", "Kiara", "Rohan", "Nisha",
  "Krishna", "Pooja", "Aditya", "Meera", "Yash", "Tara", "Rahul", "Zara",
  "Karan", "Riya", "Nikhil", "Anvi", "Siddharth", "Ira", "Varun", "Saanvi",
  "Manav", "Avni", "Dev", "Jiya", "Harsh", "Kavya", "Om", "Navya",
  "Raj", "Prisha", "Veer", "Aarohi", "Shaan", "Mahi", "Laksh", "Nitya",
  "Parth", "Ridhi", "Tanish", "Siya", "Ayaan", "Diya", "Reyaan", "Anaya",
  "Kian", "Pari", "Rudra", "Mira",
];

const LAST = [
  "Sharma", "Verma", "Patel", "Reddy", "Nair", "Iyer", "Gupta", "Mehta",
  "Shah", "Rao", "Das", "Bose", "Kapoor", "Chawla", "Menon", "Pillai",
  "Joshi", "Desai", "Bhat", "Sinha",
];

let readingSeq = 0;
function makeReading(
  day: number,
  tempC: number,
  time: string,
  by = "Nurse Riya"
): Reading {
  return {
    id: `seed_r_${readingSeq++}`,
    day,
    tempC: Math.round(tempC * 10) / 10,
    by,
    time,
  };
}

const TIMES = ["07:40", "08:05", "08:20", "08:45", "09:10", "09:30"];

type Category =
  | "fever-today"
  | "ready-unrecommended"
  | "ready-recommended"
  | "unmeasured"
  | "normal";

export function buildSeed(): AppState {
  readingSeq = 0;
  const rand = mulberry32(20240607);
  const currentDay = 6;
  const patients: Patient[] = [];

  const usedNames = new Set<string>();
  function name(): string {
    for (let i = 0; i < 50; i++) {
      const n = `${FIRST[Math.floor(rand() * FIRST.length)]} ${
        LAST[Math.floor(rand() * LAST.length)]
      }`;
      if (!usedNames.has(n)) {
        usedNames.add(n);
        return n;
      }
    }
    const n = `Patient ${usedNames.size + 1}`;
    usedNames.add(n);
    return n;
  }

  function normalTemp(): number {
    return 36.2 + rand() * 1.3; // 36.2 - 37.5
  }
  function feverTemp(): number {
    return 38.2 + rand() * 1.4; // 38.2 - 39.6
  }

  // Build the active ward: 60 occupied beds (1..60).
  const plan: Category[] = [];
  for (let i = 0; i < 8; i++) plan.push("fever-today");
  for (let i = 0; i < 8; i++) plan.push("ready-unrecommended");
  for (let i = 0; i < 4; i++) plan.push("ready-recommended");
  for (let i = 0; i < 10; i++) plan.push("unmeasured");
  while (plan.length < 60) plan.push("normal");

  // Shuffle so categories are spread across beds.
  for (let i = plan.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [plan[i], plan[j]] = [plan[j], plan[i]];
  }

  let seq = 0;
  plan.forEach((category, idx) => {
    const bed = idx + 1;
    const admittedDay = category.startsWith("ready")
      ? currentDay - 5
      : category === "fever-today"
      ? currentDay - 3
      : currentDay - (2 + Math.floor(rand() * 4));
    const readings: Reading[] = [];
    const visits: Visit[] = [];

    const measuredToday = category !== "unmeasured";
    const lastDay = measuredToday ? currentDay : currentDay - 1;

    for (let d = admittedDay; d <= lastDay; d++) {
      let temp: number;
      if (category === "fever-today" && d === currentDay) {
        temp = feverTemp();
      } else if (category.startsWith("ready")) {
        // Early fever that resolves into 3+ clear days.
        const clearFrom = currentDay - 2;
        temp = d < clearFrom && d === admittedDay ? feverTemp() : normalTemp();
      } else if (category === "fever-today") {
        temp = normalTemp();
      } else {
        // Normal / unmeasured: occasional spike earlier in the stay.
        temp = d === admittedDay && rand() < 0.3 ? feverTemp() : normalTemp();
      }
      readings.push(makeReading(d, temp, TIMES[Math.floor(rand() * TIMES.length)]));
    }

    let dischargeRecommended = false;
    let dischargeRecommendedBy: string | undefined;

    if (category === "ready-recommended") {
      visits.push({
        id: `v_${bed}_${seq++}`,
        day: currentDay,
        by: "Dr. Mehta",
        treatmentPlan: "Stable, afebrile 3 days. Stop IV, oral meds only.",
        notes: "Vitals normal. Fit for discharge.",
        time: "10:30",
      });
      dischargeRecommended = true;
      dischargeRecommendedBy = "Dr. Mehta";
    } else if (
      measuredToday &&
      category !== "fever-today" &&
      rand() < 0.4
    ) {
      // Some normal/ready patients already seen by the doctor today.
      visits.push({
        id: `v_${bed}_${seq++}`,
        day: currentDay,
        by: "Dr. Mehta",
        treatmentPlan: "Continue current medication. Monitor temperature.",
        time: "10:05",
      });
    }

    patients.push({
      id: `p_${bed}`,
      name: name(),
      age: 8 + Math.floor(rand() * 78),
      bed,
      status: "admitted",
      admittedDay,
      readings,
      visits,
      dischargeRecommended,
      dischargeRecommendedBy,
    });
  });

  // Closed cases drive the outcome metrics: 2 deaths + 14 discharges => 12.5%.
  const closedCount = 16;
  for (let i = 0; i < closedCount; i++) {
    const deceased = i < 2;
    const admittedDay = -3 - Math.floor(rand() * 3);
    const closeDay = currentDay - 1 - Math.floor(rand() * 3);
    const readings: Reading[] = [];
    for (let d = admittedDay; d <= closeDay; d++) {
      readings.push(
        makeReading(d, deceased ? feverTemp() : normalTemp(), "08:30")
      );
    }
    patients.push({
      id: `c_${i}`,
      name: name(),
      age: 20 + Math.floor(rand() * 70),
      bed: 0,
      status: deceased ? "deceased" : "discharged",
      admittedDay,
      readings,
      visits: [],
      dischargeRecommended: false,
      outcome: {
        type: deceased ? "deceased" : "discharged",
        day: closeDay,
        by: deceased ? "Dr. Mehta" : "Admin Desk",
        time: "16:20",
        note: deceased ? "Sepsis, multi-organ failure." : undefined,
      },
    });
  }

  return { schema: 1, currentDay, patients };
}
