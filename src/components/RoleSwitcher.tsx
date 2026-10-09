"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Role } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/constants";

const ROLE_DESC: Record<Role, string> = {
  nurse: "Record temperatures",
  doctor: "Visits & discharge",
  admin: "Beds & outcomes",
};

const ROLES: Role[] = ["nurse", "doctor", "admin"];

export function RoleSwitcher() {
  const { role, setRole } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white pl-3 pr-2.5 py-1.5 text-sm font-medium hover:bg-[#fbfbfd] transition"
      >
        <span className="w-6 h-6 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center text-xs">
          {ROLE_LABELS[role][0]}
        </span>
        <span>{ROLE_LABELS[role]}</span>
        <span className="text-[var(--color-muted)] text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-[var(--color-line)] shadow-xl overflow-hidden z-40">
          <p className="px-4 pt-3 pb-1 text-xs text-[var(--color-muted)]">
            View as
          </p>
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => {
                setRole(r);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#f5f5f7] transition ${
                r === role ? "bg-[#f5f5f7]" : ""
              }`}
            >
              <span className="w-8 h-8 rounded-full bg-[#f0f0f3] flex items-center justify-center text-sm font-semibold">
                {ROLE_LABELS[r][0]}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">
                  {ROLE_LABELS[r]}
                </span>
                <span className="block text-xs text-[var(--color-muted)]">
                  {ROLE_DESC[r]}
                </span>
              </span>
              {r === role && (
                <span className="ml-auto text-[var(--color-accent)]">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
