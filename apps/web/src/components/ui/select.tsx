"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDownIcon, Icon, Tick01Icon } from "@/components/ui/icon";

export type SelectOption = { value: string; label: string; disabled?: boolean };

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
  "flex w-full items-center justify-between gap-2 rounded-xl border border-[#dbe7e0] bg-white px-3.5 py-2.5 text-left text-sm text-[#0c4a35] transition focus:border-[#198038] focus:outline-none focus:ring-2 focus:ring-[#198038]/15 disabled:cursor-not-allowed disabled:opacity-50";

type MenuRect = { top: number; left: number; width: number; placement: "below" | "above"; maxHeight: number };

export function Select({
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  required,
  placeholder = "Select…",
  disabled,
  id,
  className = "",
  "aria-label": ariaLabel,
}: SelectProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? "");
  const current = isControlled ? value : internal;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [rect, setRect] = useState<MenuRect | null>(null);
  const [mounted, setMounted] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const reactId = useId();
  const listId = `${reactId}-listbox`;

  useEffect(() => setMounted(true), []);

  const selected = options.find((o) => o.value === current) ?? null;
  const selectableIndexes = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);

  function reposition() {
    const el = buttonRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    const placeAbove = spaceBelow < 260 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(256, Math.max(140, (placeAbove ? spaceAbove : spaceBelow) - 16));
    setRect({
      top: placeAbove ? r.top - 6 : r.bottom + 6,
      left: r.left,
      width: r.width,
      placement: placeAbove ? "above" : "below",
      maxHeight,
    });
  }

  // Outside click + reposition while open.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node;
      if (buttonRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
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

  function openMenu() {
    if (disabled) return;
    const currentIdx = options.findIndex((o) => o.value === current);
    setActiveIndex(currentIdx >= 0 ? currentIdx : (selectableIndexes[0] ?? -1));
    reposition();
    setOpen(true);
  }

  function commit(idx: number) {
    const opt = options[idx];
    if (!opt || opt.disabled) return;
    if (!isControlled) setInternal(opt.value);
    onValueChange?.(opt.value);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function moveActive(dir: 1 | -1) {
    if (selectableIndexes.length === 0) return;
    const pos = selectableIndexes.indexOf(activeIndex);
    const next =
      pos === -1
        ? selectableIndexes[dir === 1 ? 0 : selectableIndexes.length - 1]
        : selectableIndexes[(pos + dir + selectableIndexes.length) % selectableIndexes.length];
    setActiveIndex(next);
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
      case "Home": e.preventDefault(); setActiveIndex(selectableIndexes[0] ?? -1); break;
      case "End": e.preventDefault(); setActiveIndex(selectableIndexes[selectableIndexes.length - 1] ?? -1); break;
      case "Enter":
      case " ": e.preventDefault(); if (activeIndex >= 0) commit(activeIndex); break;
      case "Escape": e.preventDefault(); setOpen(false); buttonRef.current?.focus(); break;
      case "Tab": setOpen(false); break;
    }
  }

  return (
    <div className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={current} required={required} />}
      <button
        ref={buttonRef}
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={controlClass}
      >
        <span className={selected ? "truncate" : "truncate text-[#9aa8a0]"}>
          {selected ? selected.label : placeholder}
        </span>
        <Icon
          icon={ChevronDownIcon}
          size={16}
          strokeWidth={2}
          aria-hidden
          className={`shrink-0 text-[#5b6a62] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open &&
        mounted &&
        rect &&
        createPortal(
          <ul
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
            className="z-50 overflow-auto rounded-xl border border-[#dbe7e0] bg-white p-1 shadow-[0_12px_36px_-12px_rgba(15,38,28,0.22)]"
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === current;
              const isActive = i === activeIndex;
              return (
                <li
                  key={opt.value || `opt-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled || undefined}
                  onMouseEnter={() => !opt.disabled && setActiveIndex(i)}
                  onClick={() => commit(i)}
                  className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${
                    opt.disabled
                      ? "cursor-not-allowed text-[#9aa8a0]"
                      : isActive
                        ? "bg-[#eef5f0] text-[#0c4a35]"
                        : isSelected
                          ? "text-[#0c4a35]"
                          : "text-[#445049]"
                  } ${isSelected ? "font-medium" : ""}`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Icon icon={Tick01Icon} size={16} strokeWidth={2} aria-hidden className="shrink-0 text-[#198038]" />
                  )}
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </div>
  );
}
