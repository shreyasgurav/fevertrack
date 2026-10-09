"use client";

import React, { useEffect } from "react";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-2xl bg-white border border-[var(--color-line)] shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        className
      )}
    >
      {children}
    </div>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  variant = "secondary",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100";
  const styles: Record<ButtonVariant, string> = {
    primary: "bg-[var(--color-accent)] text-white hover:bg-[#0063c7]",
    secondary:
      "bg-[#f0f0f3] text-[var(--color-ink)] hover:bg-[#e6e6eb] border border-[var(--color-line)]",
    ghost: "text-[var(--color-accent)] hover:bg-[#f0f0f3]",
    danger: "bg-[#ff3b30] text-white hover:bg-[#e0352b]",
  };
  return (
    <button className={cx(base, styles[variant], className)} {...props}>
      {children}
    </button>
  );
}

type Tone = "neutral" | "green" | "amber" | "red" | "blue";

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  const tones: Record<Tone, string> = {
    neutral: "bg-[#f0f0f3] text-[var(--color-muted)]",
    green: "bg-[#e3f6e9] text-[#1a7f37]",
    amber: "bg-[#fff3dc] text-[#9a6700]",
    red: "bg-[#ffe5e3] text-[#c3271d]",
    blue: "bg-[#e5f0ff] text-[#0063c7]",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-[var(--color-ink)] mb-1.5">
        {label}
      </span>
      {children}
      {hint && <span className="block text-xs text-[var(--color-muted)] mt-1.5">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-[var(--color-line)] bg-white px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 placeholder:text-[#b0b0b5]";

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/25 backdrop-blur-sm p-0 sm:p-4"
      onMouseDown={onClose}
    >
      <div
        className={cx(
          "bg-white w-full rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[92vh] overflow-hidden flex flex-col",
          wide ? "sm:max-w-3xl" : "sm:max-w-md"
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-[var(--color-line)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">{title}</h2>
            {subtitle && (
              <p className="text-sm text-[var(--color-muted)] mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full w-8 h-8 flex items-center justify-center text-[var(--color-muted)] hover:bg-[#f0f0f3] text-lg leading-none"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-[var(--color-line)] bg-[#fbfbfd] flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="text-center py-16 px-6">
      <p className="text-[var(--color-ink)] font-medium">{title}</p>
      {hint && <p className="text-sm text-[var(--color-muted)] mt-1">{hint}</p>}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] text-sm">
        ⌕
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Search"}
        className={cx(inputClass, "pl-8")}
      />
    </div>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex bg-[#ececf0] rounded-full p-0.5 text-sm">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "px-3.5 py-1.5 rounded-full font-medium transition",
            value === o.value
              ? "bg-white text-[var(--color-ink)] shadow-sm"
              : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          )}
        >
          {o.label}
          {o.count !== undefined && (
            <span className="ml-1.5 text-xs opacity-70">{o.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
