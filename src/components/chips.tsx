"use client";

import { Patient } from "@/lib/types";
import { derive } from "@/lib/logic";
import { CRITICAL_TEMP, FEVER_FREE_DAYS_REQUIRED } from "@/lib/constants";
import { Badge } from "./ui";

export function StatusChips({
  patient,
  currentDay,
}: {
  patient: Patient;
  currentDay: number;
}) {
  if (patient.status === "discharged")
    return <Badge tone="green">Discharged</Badge>;
  if (patient.status === "deceased") return <Badge tone="neutral">Deceased</Badge>;

  const d = derive(patient, currentDay);
  const chips = [];

  if (!d.measuredToday) chips.push(<Badge key="tm" tone="amber">To measure</Badge>);
  else if (d.feverToday) {
    const critical = (d.todayReading?.tempC ?? 0) >= CRITICAL_TEMP;
    chips.push(
      <Badge key="fv" tone="red">
        {critical ? "Critical" : "Fever"} {d.todayReading?.tempC.toFixed(1)}°
      </Badge>
    );
  } else {
    chips.push(
      <Badge key="ok" tone="green">
        {d.todayReading?.tempC.toFixed(1)}° clear
      </Badge>
    );
  }

  if (patient.dischargeRecommended)
    chips.push(<Badge key="rec" tone="blue">Discharge recommended</Badge>);
  else if (d.eligible)
    chips.push(<Badge key="elig" tone="green">Eligible · {d.streakToday}/{FEVER_FREE_DAYS_REQUIRED} days</Badge>);
  else if (d.needsTodayReading)
    chips.push(
      <Badge key="need" tone="amber">
        {d.displayStreak}/{FEVER_FREE_DAYS_REQUIRED} · needs today
      </Badge>
    );

  return <>{chips}</>;
}
