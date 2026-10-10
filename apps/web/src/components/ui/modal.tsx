"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { usePortalLocale } from "@/components/portal-locale";

type ModalProps = { open: boolean; onClose: () => void; title?: string; children: ReactNode };

export function Modal({ open, onClose, title, children }: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const locale = usePortalLocale();
  const closeLabel = locale === "pt-PT" ? "Fechar" : "Close";
  const accessibleTitle = title ?? (locale === "pt-PT" ? "Confirmação" : "Confirmation");

  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previous;
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <dialog ref={dialogRef} aria-modal="true" aria-labelledby={titleId}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-line bg-white p-6 text-heading shadow-xl backdrop:bg-black/40"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
      }}>
      <h2 id={titleId} className={title ? "mb-3 pr-10 text-lg font-semibold" : "sr-only"}>{accessibleTitle}</h2>
      <button type="button" aria-label={closeLabel} onClick={onClose} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full hover:bg-surface-hover">×</button>
      {children}
    </dialog>
  );
}
