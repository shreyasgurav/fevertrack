"use client";

import { MORTALITY_AMBER, MORTALITY_LIMIT } from "@/lib/constants";

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

// Semicircle gauge from 180° (left) to 360°/0° (right).
function arcPath(cx: number, cy: number, r: number, startVal: number, endVal: number, max: number) {
  const a0 = 180 + (startVal / max) * 180;
  const a1 = 180 + (endVal / max) * 180;
  const p0 = polar(cx, cy, r, a0);
  const p1 = polar(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 1 ${p1.x} ${p1.y}`;
}

export function MortalityGauge({ rate }: { rate: number }) {
  const max = 30;
  const cx = 110;
  const cy = 110;
  const r = 90;
  const clamped = Math.min(rate, max);

  const zone =
    rate > MORTALITY_LIMIT ? "red" : rate >= MORTALITY_AMBER ? "amber" : "green";
  const color =
    zone === "red" ? "#ff3b30" : zone === "amber" ? "#f5a623" : "#1a7f37";
  const label =
    zone === "red" ? "Over limit" : zone === "amber" ? "Watch" : "Within target";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 220 140" className="w-full max-w-[260px] h-auto">
        {/* track */}
        <path
          d={arcPath(cx, cy, r, 0, max, max)}
          fill="none"
          stroke="#ececf0"
          strokeWidth={14}
          strokeLinecap="round"
        />
        {/* value */}
        <path
          d={arcPath(cx, cy, r, 0, Math.max(0.1, clamped), max)}
          fill="none"
          stroke={color}
          strokeWidth={14}
          strokeLinecap="round"
        />
        {/* 15% limit tick */}
        {(() => {
          const p = polar(cx, cy, r, 180 + (MORTALITY_LIMIT / max) * 180);
          const pi = polar(cx, cy, r - 12, 180 + (MORTALITY_LIMIT / max) * 180);
          return (
            <line
              x1={pi.x}
              y1={pi.y}
              x2={p.x}
              y2={p.y}
              stroke="#1d1d1f"
              strokeWidth={2}
            />
          );
        })()}
        <text x={cx} y={cy - 18} textAnchor="middle" fontSize="30" fontWeight="600" fill="#1d1d1f">
          {rate.toFixed(1)}%
        </text>
        <text x={cx} y={cy + 2} textAnchor="middle" fontSize="12" fill={color}>
          {label}
        </text>
      </svg>
      <p className="text-xs text-[var(--color-muted)] -mt-2">
        Mortality rate · 15% ceiling (85% success target)
      </p>
    </div>
  );
}
