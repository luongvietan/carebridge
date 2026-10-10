"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  Calendar03Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Clock01Icon,
  Icon,
} from "@/components/ui/icon";
import { Select } from "@/components/ui/select";
import { usePortalLocale } from "@/components/portal-locale";
import type { PortalLocale } from "@/lib/i18n/portal";

/* ---------- date helpers (local-time, no deps) ---------- */

type CalendarWords = {
  tag: string;
  weekdays: string[];
  months: string[];
  monthsShort: string[];
  today: string;
  clear: string;
  selectDate: string;
  selectDateTime: string;
  chooseDate: string;
  chooseDateTime: string;
};

const WORDS: Record<PortalLocale, CalendarWords> = {
  "en-GB": {
    tag: "en-GB",
    weekdays: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
    months: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ],
    monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    today: "Today",
    clear: "Clear",
    selectDate: "Select date",
    selectDateTime: "Select date & time",
    chooseDate: "Choose date",
    chooseDateTime: "Choose date and time",
  },
  "pt-PT": {
    tag: "pt-PT",
    weekdays: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
    months: [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
    ],
    monthsShort: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
    today: "Hoje",
    clear: "Limpar",
    selectDate: "Selecione a data",
    selectDateTime: "Selecione a data e a hora",
    chooseDate: "Escolha a data",
    chooseDateTime: "Escolha a data e a hora",
  },
};

/** The picker's words in the signed-in app's language (the market being used). */
function useWords(): CalendarWords {
  return WORDS[usePortalLocale()];
}

type CalendarPanel = "days" | "months" | "years";

const YEARS_PER_PAGE = 12;

const navBtnClass =
  "grid h-8 w-8 place-items-center rounded-full text-ink transition hover:bg-surface-hover hover:text-brand-strong";
const headerBtnClass =
  "rounded-md px-2 py-1 text-sm font-semibold text-brand-ink transition hover:bg-surface-hover";

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

function formatLong(d: Date, tag = "en-GB") {
  // Preserve the chosen calendar day when formatting across time zones.
  const calendarDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  return calendarDate.toLocaleDateString(tag, {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ---------- shared popover behaviour ---------- */

function usePopover() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverId = useId();
  function close() { setOpen(false); triggerRef.current?.focus(); }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node) && !(e.target as Element).closest?.("[role=listbox]")) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !e.defaultPrevented) close();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return { open, setOpen, rootRef, triggerRef, popoverId, close };
}

const triggerClass =
  "flex w-full items-center justify-between gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-left text-sm text-brand-ink transition focus:border-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-strong/15 disabled:cursor-not-allowed disabled:opacity-50";

function useToday() {
  // `today` only drives the "current day" highlight. Initialise it after mount so
  // the server and client first render agree, and keep a stable reference for the
  // component's lifetime — returning a fresh `new Date()` each call (as a
  // useSyncExternalStore getSnapshot) throws "getSnapshot should be cached".
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);
  return today;
}

/* ---------- calendar grid ---------- */

function yearPageStart(year: number) {
  return year - (year % YEARS_PER_PAGE);
}

function Calendar({
  selected,
  onSelect,
  minDate,
}: {
  selected: Date | null;
  onSelect: (d: Date) => void;
  minDate?: Date;
}) {
  const today = useToday();
  const w = useWords();
  const initialDate = selected && (!minDate || selected >= minDate) ? selected : minDate ?? new Date();
  const [view, setView] = useState(() => initialDate);
  const [focused, setFocused] = useState(() => initialDate);
  const [panel, setPanel] = useState<CalendarPanel>("days");
  const [yearPage, setYearPage] = useState(() => yearPageStart((selected ?? new Date()).getFullYear()));
  const gridRef = useRef<HTMLDivElement>(null);

  const minDay = minDate
    ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
    : null;
  const minYear = minDay?.getFullYear() ?? null;
  const minMonth = minDay ? minDay.getFullYear() * 12 + minDay.getMonth() : null;
  const isDisabled = (d: Date) => (minDay ? d.getTime() < minDay.getTime() : false);
  const isMonthDisabled = (year: number, month: number) =>
    minMonth !== null && year * 12 + month < minMonth;
  const isYearDisabled = (year: number) => minYear !== null && year < minYear;

  // Keep keyboard focus on the active day button.
  useEffect(() => {
    if (panel !== "days") return;
    const el = gridRef.current?.querySelector<HTMLButtonElement>(`[data-ymd="${toYMD(focused)}"]`);
    el?.focus();
  }, [focused, panel]);

  function move(days: number) {
    const next = new Date(focused);
    next.setDate(focused.getDate() + days);
    if (isDisabled(next)) return;
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
      case " ": e.preventDefault(); if (!isDisabled(focused)) onSelect(focused); break;
    }
  }

  function shiftMonth(delta: number) {
    const next = new Date(view.getFullYear(), view.getMonth() + delta, 1);
    setView(next);
    setFocused(minDay && next < minDay && minDay.getMonth() === next.getMonth() && minDay.getFullYear() === next.getFullYear() ? minDay : next);
  }

  function openMonths() {
    setPanel("months");
  }

  function openYears() {
    setYearPage(yearPageStart(view.getFullYear()));
    setPanel("years");
  }

  function pickMonth(month: number) {
    const next = new Date(view.getFullYear(), month, 1);
    setView(next);
    setFocused(minDay && next < minDay ? minDay : next);
    setPanel("days");
  }

  function pickYear(year: number) {
    setView(new Date(year, view.getMonth(), 1));
    setPanel("months");
  }

  function goBack() {
    setPanel((p) => (p === "years" ? "months" : "days"));
  }

  const days = calendarDays(view);
  const years = Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearPage + i);

  return (
    <div>
      <div className="flex items-center justify-between px-1 pb-2">
        {panel === "days" ? (
          <button
            type="button"
            aria-label={w.tag === "pt-PT" ? "Mês anterior" : "Previous month"}
            onClick={() => shiftMonth(-1)}
            className={navBtnClass}
          >
            <Icon icon={ChevronLeftIcon} size={16} strokeWidth={2} aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            aria-label={w.tag === "pt-PT" ? (panel === "years" ? "Voltar aos meses" : "Voltar aos dias") : (panel === "years" ? "Back to months" : "Back to days")}
            onClick={goBack}
            className={navBtnClass}
          >
            <Icon icon={ChevronLeftIcon} size={16} strokeWidth={2} aria-hidden />
          </button>
        )}

        {panel === "days" && (
          <button
            type="button"
            aria-label={`${w.months[view.getMonth()]} ${view.getFullYear()}, ${w.tag === "pt-PT" ? "escolher mês e ano" : "choose month and year"}`}
            onClick={openMonths}
            className={headerBtnClass}
          >
            {w.months[view.getMonth()]} {view.getFullYear()}
          </button>
        )}
        {panel === "months" && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              aria-label={w.tag === "pt-PT" ? "Ano anterior" : "Previous year"}
              onClick={() => setView(new Date(view.getFullYear() - 1, view.getMonth(), 1))}
              className={navBtnClass}
            >
              <Icon icon={ChevronLeftIcon} size={16} strokeWidth={2} aria-hidden />
            </button>
            <button
              type="button"
              aria-label={`${view.getFullYear()}, ${w.tag === "pt-PT" ? "escolher ano" : "choose year"}`}
              onClick={openYears}
              className={headerBtnClass}
            >
              {view.getFullYear()}
            </button>
            <button
              type="button"
              aria-label={w.tag === "pt-PT" ? "Ano seguinte" : "Next year"}
              onClick={() => setView(new Date(view.getFullYear() + 1, view.getMonth(), 1))}
              className={navBtnClass}
            >
              <Icon icon={ChevronRightIcon} size={16} strokeWidth={2} aria-hidden />
            </button>
          </div>
        )}
        {panel === "years" && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              aria-label={w.tag === "pt-PT" ? "Anos anteriores" : "Previous years"}
              onClick={() => setYearPage((p) => p - YEARS_PER_PAGE)}
              className={navBtnClass}
            >
              <Icon icon={ChevronLeftIcon} size={16} strokeWidth={2} aria-hidden />
            </button>
            <span className="min-w-[6.5rem] text-center text-sm font-semibold text-brand-ink">
              {yearPage} – {yearPage + YEARS_PER_PAGE - 1}
            </span>
            <button
              type="button"
              aria-label={w.tag === "pt-PT" ? "Anos seguintes" : "Next years"}
              onClick={() => setYearPage((p) => p + YEARS_PER_PAGE)}
              className={navBtnClass}
            >
              <Icon icon={ChevronRightIcon} size={16} strokeWidth={2} aria-hidden />
            </button>
          </div>
        )}

        {panel === "days" ? (
          <button
            type="button"
            aria-label={w.tag === "pt-PT" ? "Mês seguinte" : "Next month"}
            onClick={() => shiftMonth(1)}
            className={navBtnClass}
          >
            <Icon icon={ChevronRightIcon} size={16} strokeWidth={2} aria-hidden />
          </button>
        ) : (
          <span className="h-8 w-8" aria-hidden />
        )}
      </div>

      {panel === "days" && (
        <>
          <div className="grid grid-cols-7 gap-0.5 px-1 pb-1 text-center text-xs font-medium text-muted">
            {w.weekdays.map((w) => (
              <span key={w} className="py-1">{w}</span>
            ))}
          </div>

          <div ref={gridRef} role="group" aria-label={w.chooseDate} tabIndex={-1} onKeyDown={onKeyDown} className="grid grid-cols-7 gap-0.5 px-1">
            {days.map((d) => {
              const inMonth = d.getMonth() === view.getMonth();
              const isSelected = selected ? sameDay(d, selected) : false;
              const isToday = today ? sameDay(d, today) : false;
              const isFocusable = sameDay(d, focused);
              const disabled = isDisabled(d);
              return (
                <button
                  key={toYMD(d)}
                  type="button"
                  data-ymd={toYMD(d)}
                  aria-pressed={isSelected}
                  aria-disabled={disabled}
                  disabled={disabled}
                  aria-label={formatLong(d, w.tag)}
                  tabIndex={isFocusable ? 0 : -1}
                  onClick={() => !disabled && onSelect(d)}
                  className={`grid h-9 w-9 place-items-center rounded-full text-sm transition ${
                    disabled
                      ? "cursor-not-allowed text-[#c5cec8]"
                      : isSelected
                        ? "bg-brand-strong font-semibold text-white"
                        : isToday
                          ? "font-semibold text-brand-strong ring-1 ring-inset ring-line-hover hover:bg-surface-hover"
                          : inMonth
                            ? "text-brand-ink hover:bg-surface-hover"
                            : "text-muted hover:bg-surface"
                  } focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-strong/40`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </>
      )}

      {panel === "months" && (
        <div role="group" aria-label={w.chooseDate} className="grid grid-cols-3 gap-1 px-1">
          {w.monthsShort.map((label, month) => {
            const isCurrent = today
              ? today.getFullYear() === view.getFullYear() && today.getMonth() === month
              : false;
            const isSelectedMonth =
              selected?.getFullYear() === view.getFullYear() && selected.getMonth() === month;
            const disabled = isMonthDisabled(view.getFullYear(), month);
            return (
              <button
                key={label}
                type="button"
                aria-pressed={isSelectedMonth}
                aria-disabled={disabled}
                disabled={disabled}
                aria-label={w.months[month]}
                onClick={() => !disabled && pickMonth(month)}
                className={`rounded-lg py-2.5 text-sm transition ${
                  disabled
                    ? "cursor-not-allowed text-[#c5cec8]"
                    : isSelectedMonth
                      ? "bg-brand-strong font-semibold text-white"
                      : isCurrent
                        ? "font-semibold text-brand-strong ring-1 ring-inset ring-line-hover hover:bg-surface-hover"
                        : "text-brand-ink hover:bg-surface-hover"
                } focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-strong/40`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {panel === "years" && (
        <div role="group" aria-label={w.chooseDate} className="grid grid-cols-3 gap-1 px-1">
          {years.map((year) => {
            const isCurrent = today ? today.getFullYear() === year : false;
            const isSelectedYear = selected?.getFullYear() === year;
            const disabled = isYearDisabled(year);
            return (
              <button
                key={year}
                type="button"
                aria-pressed={isSelectedYear}
                aria-disabled={disabled}
                disabled={disabled}
                aria-label={String(year)}
                onClick={() => !disabled && pickYear(year)}
                className={`rounded-lg py-2.5 text-sm transition ${
                  disabled
                    ? "cursor-not-allowed text-[#c5cec8]"
                    : isSelectedYear
                      ? "bg-brand-strong font-semibold text-white"
                      : isCurrent
                        ? "font-semibold text-brand-strong ring-1 ring-inset ring-line-hover hover:bg-surface-hover"
                        : "text-brand-ink hover:bg-surface-hover"
                } focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-strong/40`}
              >
                {year}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const popoverClass =
  "absolute z-30 mt-1.5 m-0 w-[18rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-white p-3 shadow-[0_12px_36px_-12px_rgba(15,38,28,0.22)] [&::backdrop]:hidden";

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
  /** Earliest selectable day; earlier days are disabled (e.g. disallow past dates). */
  minDate?: Date;
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
  placeholder,
  "aria-label": ariaLabel,
  minDate,
}: BaseProps) {
  const w = useWords();
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? "");
  const current = isControlled ? value : internal;
  const { open, setOpen, rootRef, triggerRef, popoverId, close } = usePopover();

  const selected = parseYMD(current);

  function setValue(v: string) {
    if (!isControlled) setInternal(v);
    onValueChange?.(v);
  }

  function pick(d: Date) {
    setValue(toYMD(d));
    close();
  }

  function pickToday() {
    pick(new Date());
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {name && <input aria-hidden="true" tabIndex={-1} className="pointer-events-none absolute h-px w-px opacity-0" name={name} value={current} required={required} disabled={disabled} onChange={() => {}}
        onInvalid={(event) => { event.preventDefault(); triggerRef.current?.focus(); setOpen(true); }} />}
      <button
        type="button"
        id={id}
        ref={triggerRef}
        aria-controls={open ? popoverId : undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={triggerClass}
      >
        <span className={selected ? "" : "text-muted"}>
          {selected ? formatLong(selected, w.tag) : placeholder ?? w.selectDate}
        </span>
        <Icon icon={Calendar03Icon} size={16} strokeWidth={2} aria-hidden className="shrink-0 text-ink" />
      </button>

      {open && (
        <div role="dialog" id={popoverId} aria-modal="false" aria-label={ariaLabel ?? w.chooseDate} className={popoverClass}>
          <Calendar selected={selected} onSelect={pick} minDate={minDate} />
          <div className="mt-2 flex items-center justify-between border-t border-surface-hover px-1 pt-2 text-sm">
            <button type="button" disabled={!!minDate && toYMD(new Date()) < toYMD(minDate)} onClick={pickToday} className="font-medium text-brand-strong hover:underline">
              {w.today}
            </button>
            <button
              type="button"
              onClick={() => {
                setValue("");
                close();
              }}
              className="font-medium text-ink hover:text-heading hover:underline"
            >
              {w.clear}
            </button>
          </div>
        </div>
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
  placeholder,
  "aria-label": ariaLabel,
  minDate,
}: BaseProps) {
  const w = useWords();
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? "");
  const current = isControlled ? value : internal;
  const { open, setOpen, rootRef, triggerRef, popoverId } = usePopover();

  const { date, hour, minute } = splitDateTime(current);
  const selected = parseYMD(date);

  function commit(nextDate: string, nextHour: string, nextMinute: string) {
    const v = nextDate && nextHour !== "" && nextMinute !== "" ? `${nextDate}T${nextHour}:${nextMinute}` : "";
    if (!isControlled) setInternal(v);
    onValueChange?.(v);
  }

  const display =
    selected && hour !== "" && minute !== "" ? `${formatLong(selected, w.tag)} · ${hour}:${minute}` : null;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {name && <input aria-hidden="true" tabIndex={-1} className="pointer-events-none absolute h-px w-px opacity-0" name={name} value={current} required={required} disabled={disabled} onChange={() => {}}
        onInvalid={(event) => { event.preventDefault(); triggerRef.current?.focus(); setOpen(true); }} />}
      <button
        type="button"
        id={id}
        ref={triggerRef}
        aria-controls={open ? popoverId : undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={triggerClass}
      >
        <span className={display ? "" : "text-muted"}>{display ?? placeholder ?? w.selectDateTime}</span>
        <Icon icon={Calendar03Icon} size={16} strokeWidth={2} aria-hidden className="shrink-0 text-ink" />
      </button>

      {open && (
        <div role="dialog" id={popoverId} aria-modal="false" aria-label={ariaLabel ?? w.chooseDateTime} className={popoverClass}>
          <Calendar selected={selected} minDate={minDate} onSelect={(d) => commit(toYMD(d), hour || "09", minute || "00")} />
          <div className="mt-2 flex items-center gap-2 border-t border-surface-hover px-1 pt-3">
            <Icon icon={Clock01Icon} size={16} strokeWidth={2} aria-hidden className="text-ink" />
            <Select
              aria-label={w.tag === "pt-PT" ? "Hora" : "Hour"}
              className="w-20"
              placeholder="HH"
              value={hour}
              onValueChange={(h) => commit(date, h, minute || "00")}
              options={HOURS}
            />
            <span className="text-ink">:</span>
            <Select
              aria-label={w.tag === "pt-PT" ? "Minuto" : "Minute"}
              className="w-20"
              placeholder="mm"
              value={minute}
              onValueChange={(m) => commit(date, hour || "09", m)}
              options={MINUTES}
            />
          </div>
        </div>
      )}
    </div>
  );
}
