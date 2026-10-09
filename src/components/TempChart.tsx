"use client";

import { Patient } from "@/lib/types";
import { latestReadingOnDay } from "@/lib/logic";
import { FEVER_TEMP } from "@/lib/constants";

// Compact SVG line chart of the latest reading per day over a window of days.
export function TempChart({
  patient,
  currentDay,
  days = 7,
}: {
  patient: Patient;
  currentDay: number;
  days?: number;
}) {
  const start = currentDay - (days - 1);
  const points: { day: number; temp: number | null }[] = [];
  for (let d = start; d <= currentDay; d++) {
    const r = latestReadingOnDay(patient, d);
    points.push({ day: d, temp: r ? r.tempC : null });
  }

  const w = 520;
  const h = 160;
  const padX = 28;
  const padY = 20;
  const minT = 35;
  const maxT = 41;
  const x = (i: number) =>
    padX + (i * (w - padX * 2)) / Math.max(1, points.length - 1);
  const y = (t: number) =>
    padY + ((maxT - t) * (h - padY * 2)) / (maxT - minT);

  const valued = points
    .map((p, i) => ({ ...p, i }))
    .filter((p) => p.temp !== null) as { day: number; temp: number; i: number }[];
  const path = valued
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${x(p.i)} ${y(p.temp)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-auto"
      role="img"
      aria-label="Temperature history chart"
    >
      {/* fever threshold line */}
      <line
        x1={padX}
        x2={w - padX}
        y1={y(FEVER_TEMP)}
        y2={y(FEVER_TEMP)}
        stroke="#ff3b30"
        strokeDasharray="4 4"
        strokeWidth={1}
      />
      <text x={w - padX} y={y(FEVER_TEMP) - 5} textAnchor="end" fontSize="10" fill="#ff3b30">
        38.0 fever
      </text>

      {/* baseline grid */}
      {[36, 37, 39, 40].map((t) => (
        <line
          key={t}
          x1={padX}
          x2={w - padX}
          y1={y(t)}
          y2={y(t)}
          stroke="#f0f0f3"
          strokeWidth={1}
        />
      ))}

      {path && <path d={path} fill="none" stroke="#0071e3" strokeWidth={2} />}

      {points.map((p, i) =>
        p.temp === null ? (
          <circle key={i} cx={x(i)} cy={h - 6} r={2} fill="#c7c7cc" />
        ) : (
          <g key={i}>
            <circle
              cx={x(i)}
              cy={y(p.temp)}
              r={3.5}
              fill={p.temp >= FEVER_TEMP ? "#ff3b30" : "#0071e3"}
            />
            <text
              x={x(i)}
              y={y(p.temp) - 8}
              textAnchor="middle"
              fontSize="10"
              fill="#6e6e73"
            >
              {p.temp.toFixed(1)}
            </text>
          </g>
        )
      )}

      {points.map((p, i) => (
        <text
          key={`l${i}`}
          x={x(i)}
          y={h - 2}
          textAnchor="middle"
          fontSize="9"
          fill="#b0b0b5"
        >
          D{p.day}
        </text>
      ))}
    </svg>
  );
}
