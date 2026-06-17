"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ArrowRight01Icon,
  Calendar03Icon,
  Clock01Icon,
  Icon,
} from "@/components/ui/icon";
import { Select } from "@/components/ui/select";

/* ---------- date helpers (local-time, no deps) ---------- */

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toYMD(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parse "YYYY-MM-DD" (optionally with a time suffix) into a local Date. */
function parseYMD(value: string | undefined | null): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** 42 days (6 weeks) covering the month of `view`, Monday-first. */
function calendarDays(view: Date) {
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7; // Monday = 0
  const start = new Date(first);
  start.setDate(1 - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function formatLong(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/* ---------- shared popover behaviour ---------- */

function usePopover() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return { open, setOpen, rootRef };
}

const triggerClass =
  "flex w-full items-center justify-between gap-2 rounded-xl border border-[#dbe7e0] bg-white px-3.5 py-2.5 text-left text-sm text-[#0c4a35] transition focus:border-[#198038] focus:outline-none focus:ring-2 focus:ring-[#198038]/15 disabled:cursor-not-allowed disabled:opacity-50";

function subscribeNoop() {
  return () => {};
}

function getToday() {
  return new Date();
}

function getTodayServerSnapshot() {
  return null;
}

function useToday() {
  return useSyncExternalStore(subscribeNoop, getToday, getTodayServerSnapshot);
}

/* ---------- calendar grid ---------- */

function Calendar({
  selected,
  onSelect,
}: {
  selected: Date | null;
  onSelect: (d: Date) => void;
}) {
  const today = useToday();
  const [view, setView] = useState(() => selected ?? new Date());
  const [focused, setFocused] = useState(() => selected ?? new Date());
  const gridRef = useRef<HTMLDivElement>(null);

  // Keep keyboard focus on the active day button.
  useEffect(() => {
    const el = gridRef.current?.querySelector<HTMLButtonElement>(`[data-ymd="${toYMD(focused)}"]`);
    el?.focus();
  }, [focused]);

  function move(days: number) {
    const next = new Date(focused);
    next.setDate(focused.getDate() + days);
    setFocused(next);
    if (next.getMonth() !== view.getMonth() || next.getFullYear() !== view.getFullYear()) {
      setView(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowLeft": e.preventDefault(); move(-1); break;
      case "ArrowRight": e.preventDefault(); move(1); break;
      case "ArrowUp": e.preventDefault(); move(-7); break;
      case "ArrowDown": e.preventDefault(); move(7); break;
      case "Enter":
      case " ": e.preventDefault(); onSelect(focused); break;
    }
  }

  function shiftMonth(delta: number) {
    setView(new Date(view.getFullYear(), view.getMonth() + delta, 1));
  }

  const days = calendarDays(view);

  return (
    <div>
      <div className="flex items-center justify-between px-1 pb-2">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => shiftMonth(-1)}
          className="grid h-8 w-8 place-items-center rounded-full text-[#445049] transition hover:bg-[#eef5f0] hover:text-[#198038]"
        >
          <Icon icon={ArrowRight01Icon} size={16} strokeWidth={2} className="rotate-180" aria-hidden />
        </button>
        <span className="text-sm font-semibold text-[#0c4a35]">
          {MONTHS[view.getMonth()]} {view.getFullYear()}
        </span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => shiftMonth(1)}
          className="grid h-8 w-8 place-items-center rounded-full text-[#445049] transition hover:bg-[#eef5f0] hover:text-[#198038]"
        >
          <Icon icon={ArrowRight01Icon} size={16} strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 px-1 pb-1 text-center text-xs font-medium text-[#7a8a81]">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-1">{w}</span>
        ))}
      </div>

      <div ref={gridRef} role="grid" tabIndex={-1} onKeyDown={onKeyDown} className="grid grid-cols-7 gap-0.5 px-1">
        {days.map((d) => {
          const inMonth = d.getMonth() === view.getMonth();
          const isSelected = selected ? sameDay(d, selected) : false;
          const isToday = today ? sameDay(d, today) : false;
          const isFocusable = sameDay(d, focused);
          return (
            <button
              key={toYMD(d)}
              type="button"
              data-ymd={toYMD(d)}
              role="gridcell"
              aria-selected={isSelected}
              aria-label={formatLong(d)}
              tabIndex={isFocusable ? 0 : -1}
              onClick={() => onSelect(d)}
              className={`grid h-9 w-9 place-items-center rounded-full text-sm transition ${
                isSelected
                  ? "bg-[#0c6e4f] font-semibold text-white"
                  : isToday
                    ? "font-semibold text-[#0c6e4f] ring-1 ring-inset ring-[#bcd8c7] hover:bg-[#eef5f0]"
                    : inMonth
                      ? "text-[#0c4a35] hover:bg-[#eef5f0]"
                      : "text-[#9aa8a0] hover:bg-[#f5f7f6]"
              } focus:outline-none focus-visible:ring-2 focus-visible:ring-[#198038]/40`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const popoverClass =
  "absolute z-30 mt-1.5 m-0 w-[18rem] max-w-none rounded-2xl border border-[#dbe7e0] bg-white p-3 shadow-[0_12px_36px_-12px_rgba(15,38,28,0.22)] [&::backdrop]:hidden";

/* ---------- DatePicker (date only) ---------- */

type BaseProps = {
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
};

export function DatePicker({
  name,
  value,
  defaultValue,
  onValueChange,
  required,
  disabled,
  id,
  className = "",
  placeholder = "Select date",
  "aria-label": ariaLabel,
}: BaseProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? "");
  const current = isControlled ? value : internal;
  const { open, setOpen, rootRef } = usePopover();

  const selected = parseYMD(current);

  function setValue(v: string) {
    if (!isControlled) setInternal(v);
    onValueChange?.(v);
  }

  function pick(d: Date) {
    setValue(toYMD(d));
    setOpen(false);
  }

  function pickToday() {
    pick(new Date());
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={current} required={required} />}
      <button
        type="button"
        id={id}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={triggerClass}
      >
        <span className={selected ? "" : "text-[#9aa8a0]"}>
          {selected ? formatLong(selected) : placeholder}
        </span>
        <Icon icon={Calendar03Icon} size={16} strokeWidth={2} aria-hidden className="shrink-0 text-[#5b6a62]" />
      </button>

      {open && (
        <dialog open aria-label={ariaLabel ?? "Choose date"} className={popoverClass}>
          <Calendar selected={selected} onSelect={pick} />
          <div className="mt-2 flex items-center justify-between border-t border-[#eef5f0] px-1 pt-2 text-sm">
            <button type="button" onClick={pickToday} className="font-medium text-[#0c6e4f] hover:underline">
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                setValue("");
                setOpen(false);
              }}
              className="font-medium text-[#5b6a62] hover:text-[#0f261c] hover:underline"
            >
              Clear
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
}

/* ---------- DateTimePicker (datetime-local) ---------- */

const HOURS = Array.from({ length: 24 }, (_, i) => ({ value: pad(i), label: pad(i) }));
const MINUTES = Array.from({ length: 12 }, (_, i) => ({ value: pad(i * 5), label: pad(i * 5) }));

function splitDateTime(v: string) {
  const [date = "", time = ""] = v.split("T");
  const [hour = "", minute = ""] = time.split(":");
  return { date, hour, minute };
}

export function DateTimePicker({
  name,
  value,
  defaultValue,
  onValueChange,
  required,
  disabled,
  id,
  className = "",
  placeholder = "Select date & time",
  "aria-label": ariaLabel,
}: BaseProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? "");
  const current = isControlled ? value : internal;
  const { open, setOpen, rootRef } = usePopover();

  const { date, hour, minute } = splitDateTime(current);
  const selected = parseYMD(date);

  function commit(nextDate: string, nextHour: string, nextMinute: string) {
    const v = nextDate && nextHour !== "" && nextMinute !== "" ? `${nextDate}T${nextHour}:${nextMinute}` : "";
    if (!isControlled) setInternal(v);
    onValueChange?.(v);
  }

  const display =
    selected && hour !== "" && minute !== "" ? `${formatLong(selected)} · ${hour}:${minute}` : null;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={current} required={required} />}
      <button
        type="button"
        id={id}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={triggerClass}
      >
        <span className={display ? "" : "text-[#9aa8a0]"}>{display ?? placeholder}</span>
        <Icon icon={Calendar03Icon} size={16} strokeWidth={2} aria-hidden className="shrink-0 text-[#5b6a62]" />
      </button>

      {open && (
        <dialog open aria-label={ariaLabel ?? "Choose date and time"} className={popoverClass}>
          <Calendar selected={selected} onSelect={(d) => commit(toYMD(d), hour || "09", minute || "00")} />
          <div className="mt-2 flex items-center gap-2 border-t border-[#eef5f0] px-1 pt-3">
            <Icon icon={Clock01Icon} size={16} strokeWidth={2} aria-hidden className="text-[#5b6a62]" />
            <Select
              aria-label="Hour"
              className="w-20"
              placeholder="HH"
              value={hour}
              onValueChange={(h) => commit(date, h, minute || "00")}
              options={HOURS}
            />
            <span className="text-[#5b6a62]">:</span>
            <Select
              aria-label="Minute"
              className="w-20"
              placeholder="mm"
              value={minute}
              onValueChange={(m) => commit(date, hour || "09", m)}
              options={MINUTES}
            />
          </div>
        </dialog>
      )}
    </div>
  );
}
