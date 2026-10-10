"use client";

import { useEffect, useReducer, useId, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { usePortalLocale } from "@/components/portal-locale";
import { ChevronDownIcon, Icon, Tick01Icon } from "@/components/ui/icon";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
  /** Optional heading the option sits under. Options sharing a group must be adjacent. */
  group?: string;
};

type SelectProps = {
  options: SelectOption[];
  /** Controlled value. Omit for uncontrolled (use defaultValue). */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** When set, a hidden input is rendered so the value submits with the form. */
  name?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
};

const controlClass =
  "flex w-full items-center justify-between gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-left text-sm text-brand-ink transition focus:border-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-strong/15 disabled:cursor-not-allowed disabled:opacity-50";

type MenuRect = { top: number; left: number; width: number; placement: "below" | "above"; maxHeight: number };

type SelectUiState = {
  internal: string;
  open: boolean;
  activeIndex: number;
  rect: MenuRect | null;
};

type SelectUiAction =
  | { type: "setInternal"; value: string }
  | { type: "setOpen"; open: boolean }
  | { type: "setActiveIndex"; index: number }
  | { type: "setRect"; rect: MenuRect | null }
  | { type: "openMenu"; activeIndex: number; rect: MenuRect };

function selectUiReducer(state: SelectUiState, action: SelectUiAction): SelectUiState {
  switch (action.type) {
    case "setInternal":
      return { ...state, internal: action.value };
    case "setOpen":
      return { ...state, open: action.open };
    case "setActiveIndex":
      return { ...state, activeIndex: action.index };
    case "setRect":
      return { ...state, rect: action.rect };
    case "openMenu":
      return { ...state, open: true, activeIndex: action.activeIndex, rect: action.rect };
    default:
      return state;
  }
}

function subscribeNoop() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function Select({
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  required,
  placeholder,
  disabled,
  id,
  className = "",
  "aria-label": ariaLabel,
}: SelectProps) {
  const locale = usePortalLocale();
  const prompt = placeholder ?? (locale === "pt-PT" ? "Selecione…" : "Select…");
  const isControlled = value !== undefined;
  const [ui, dispatch] = useReducer(selectUiReducer, {
    internal: defaultValue ?? "",
    open: false,
    activeIndex: -1,
    rect: null,
  });
  const current = isControlled ? value : ui.internal;
  const { open, activeIndex, rect } = ui;

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const listId = `${reactId}-listbox`;
  const mounted = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);

  const selected = options.find((o) => o.value === current) ?? null;
  const selectableIndexes: number[] = [];
  for (let i = 0; i < options.length; i++) {
    if (!options[i].disabled) selectableIndexes.push(i);
  }

  function reposition() {
    const el = buttonRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    const placeAbove = spaceBelow < 260 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(256, Math.max(140, (placeAbove ? spaceAbove : spaceBelow) - 16));
    dispatch({
      type: "setRect",
      rect: {
        top: placeAbove ? r.top - 6 : r.bottom + 6,
        left: r.left,
        width: r.width,
        placement: placeAbove ? "above" : "below",
        maxHeight,
      },
    });
  }

  // Outside click + reposition while open.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node;
      if (buttonRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      dispatch({ type: "setOpen", open: false });
    }
    function onScrollResize() {
      reposition();
    }
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("scroll", onScrollResize, true);
    window.addEventListener("resize", onScrollResize);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", onScrollResize, true);
      window.removeEventListener("resize", onScrollResize);
    };
  }, [open]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    menuRef.current?.querySelector<HTMLElement>(`[data-option-index="${activeIndex}"]`)?.scrollIntoView?.({ block: "nearest" });
  }, [open, activeIndex]);

  function openMenu() {
    if (disabled) return;
    const currentIdx = options.findIndex((o) => o.value === current);
    dispatch({
      type: "openMenu",
      activeIndex: currentIdx >= 0 && !options[currentIdx].disabled ? currentIdx : (selectableIndexes[0] ?? -1),
      rect: (() => {
        const el = buttonRef.current;
        if (!el) return { top: 0, left: 0, width: 0, placement: "below" as const, maxHeight: 256 };
        const r = el.getBoundingClientRect();
        const spaceBelow = window.innerHeight - r.bottom;
        const spaceAbove = r.top;
        const placeAbove = spaceBelow < 260 && spaceAbove > spaceBelow;
        const maxHeight = Math.min(256, Math.max(140, (placeAbove ? spaceAbove : spaceBelow) - 16));
        return {
          top: placeAbove ? r.top - 6 : r.bottom + 6,
          left: r.left,
          width: r.width,
          placement: placeAbove ? ("above" as const) : ("below" as const),
          maxHeight,
        };
      })(),
    });
  }

  function commit(idx: number) {
    const opt = options[idx];
    if (!opt || opt.disabled) return;
    if (!isControlled) dispatch({ type: "setInternal", value: opt.value });
    onValueChange?.(opt.value);
    dispatch({ type: "setOpen", open: false });
    buttonRef.current?.focus();
  }

  function moveActive(dir: 1 | -1) {
    if (selectableIndexes.length === 0) return;
    const pos = selectableIndexes.indexOf(activeIndex);
    const next =
      pos === -1
        ? selectableIndexes[dir === 1 ? 0 : selectableIndexes.length - 1]
        : selectableIndexes[(pos + dir + selectableIndexes.length) % selectableIndexes.length];
    dispatch({ type: "setActiveIndex", index: next });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); moveActive(1); break;
      case "ArrowUp": e.preventDefault(); moveActive(-1); break;
      case "Home": e.preventDefault(); dispatch({ type: "setActiveIndex", index: selectableIndexes[0] ?? -1 }); break;
      case "End": e.preventDefault(); dispatch({ type: "setActiveIndex", index: selectableIndexes[selectableIndexes.length - 1] ?? -1 }); break;
      case "Enter":
      case " ": e.preventDefault(); if (activeIndex >= 0) commit(activeIndex); break;
      case "Escape": e.preventDefault(); dispatch({ type: "setOpen", open: false }); buttonRef.current?.focus(); break;
      case "Tab": dispatch({ type: "setOpen", open: false }); break;
    }
  }

  return (
    <div className={`relative ${className}`}>
      {name && <select aria-hidden="true" tabIndex={-1} name={name} value={current} required={required} disabled={disabled}
        className="pointer-events-none absolute h-px w-px opacity-0" onChange={() => {}}
        onInvalid={(event) => { event.preventDefault(); buttonRef.current?.focus(); openMenu(); }}>
        <option value="">{prompt}</option>
        {options.filter((option) => option.value !== "").map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
      </select>}
      <button
        ref={buttonRef}
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-required={required}
        aria-activedescendant={open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? dispatch({ type: "setOpen", open: false }) : openMenu())}
        onKeyDown={onKeyDown}
        className={controlClass}
      >
        <span className={selected ? "truncate" : "truncate text-muted"}>
          {selected ? selected.label : prompt}
        </span>
        <Icon
          icon={ChevronDownIcon}
          size={16}
          strokeWidth={2}
          aria-hidden
          className={`shrink-0 text-ink transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open &&
        mounted &&
        rect &&
        createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            style={{
              position: "fixed",
              left: rect.left,
              width: rect.width,
              maxHeight: rect.maxHeight,
              ...(rect.placement === "above"
                ? { bottom: window.innerHeight - rect.top }
                : { top: rect.top }),
            }}
            className="z-50 overflow-auto rounded-xl border border-line bg-white p-1 shadow-[0_12px_36px_-12px_rgba(15,38,28,0.22)]"
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === current;
              const isActive = i === activeIndex;
              // Group heading whenever the group changes. Headings are plain
              // markup, not options, so activeIndex stays aligned with `options`.
              const heading =
                opt.group && opt.group !== options[i - 1]?.group ? (
                  <div
                    key={`group-${opt.group}`}
                    role="presentation"
                    className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted"
                  >
                    {opt.group}
                  </div>
                ) : null;
              const option = (
                <button
                  key={opt.value}
                  type="button"
                  id={`${listId}-${i}`}
                  data-option-index={i}
                  tabIndex={-1}
                  role="option"
                  aria-disabled={opt.disabled || undefined}
                  onPointerDown={(event) => event.preventDefault()}
                  aria-selected={isSelected}
                  disabled={opt.disabled}
                  onMouseEnter={() => !opt.disabled && dispatch({ type: "setActiveIndex", index: i })}
                  onClick={() => commit(i)}
                  className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                    opt.disabled
                      ? "cursor-not-allowed text-muted"
                      : isActive
                        ? "bg-surface-hover text-brand-ink"
                        : isSelected
                          ? "text-brand-ink"
                          : "text-ink"
                  } ${isSelected ? "font-medium" : ""}`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Icon icon={Tick01Icon} size={16} strokeWidth={2} aria-hidden className="shrink-0 text-brand-strong" />
                  )}
                </button>
              );
              if (!heading) return option;
              return (
                <div key={`grp-${opt.value || opt.label}`} role="presentation">
                  {heading}
                  {option}
                </div>
              );
            })}
          </div>,
          buttonRef.current?.closest("dialog") ?? document.body,
        )}
    </div>
  );
}
