"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { usePortalT } from "@/components/portal-locale";

const INPUT_CLASS =
  "mt-3 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-heading placeholder:text-muted focus:border-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-strong/15";

const BTN_CANCEL =
  "rounded-full border border-line px-4 py-1.5 text-sm font-medium text-ink transition hover:border-line-hover hover:bg-surface";

const BTN_CONFIRM =
  "rounded-full bg-brand-strong px-4 py-1.5 text-sm font-medium text-white transition hover:bg-brand-strong-hover";

const BTN_DESTRUCTIVE =
  "rounded-full bg-danger px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[#b81921]";

type ConfirmOptions = {
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
};

type ConfirmDialogProps = ConfirmOptions & {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

type PromptDialogProps = {
  message: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
};

type PendingConfirm = ConfirmOptions & {
  message: string;
  resolve: (ok: boolean) => void;
};

type PendingPrompt = {
  message: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  resolve: (value: string | null) => void;
};

function ConfirmDialog({
  message,
  confirmLabel,
  cancelLabel,
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const t = usePortalT();
  return (
    <Modal open onClose={onCancel} title={t(message)}>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={BTN_CANCEL}>
          {t(cancelLabel ?? "Cancel")}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={variant === "destructive" ? BTN_DESTRUCTIVE : BTN_CONFIRM}
        >
          {t(confirmLabel ?? "OK")}
        </button>
      </div>
    </Modal>
  );
}

function PromptDialog({
  message,
  defaultValue = "",
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const t = usePortalT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <Modal open onClose={onCancel} title={t(message)}>
      <label className="block text-sm text-ink">
        {t(message)}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onConfirm(value);
            }
          }}
          className={INPUT_CLASS}
        />
      </label>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={BTN_CANCEL}>
          {t(cancelLabel ?? "Cancel")}
        </button>
        <button type="button" onClick={() => onConfirm(value)} className={BTN_CONFIRM}>
          {t(confirmLabel ?? "OK")}
        </button>
      </div>
    </Modal>
  );
}

export function useConfirmDialog() {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((message: string, options?: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ message, resolve, ...options });
    });
  }, []);

  const finish = useCallback((ok: boolean) => {
    setPending((current) => {
      current?.resolve(ok);
      return null;
    });
  }, []);

  const dialog = pending ? (
    <ConfirmDialog
      message={pending.message}
      confirmLabel={pending.confirmLabel}
      cancelLabel={pending.cancelLabel}
      variant={pending.variant}
      onConfirm={() => finish(true)}
      onCancel={() => finish(false)}
    />
  ) : null;

  return { confirm, dialog };
}

export function usePromptDialog() {
  const [pending, setPending] = useState<PendingPrompt | null>(null);

  const prompt = useCallback((message: string, defaultValue?: string) => {
    return new Promise<string | null>((resolve) => {
      setPending({ message, defaultValue, resolve });
    });
  }, []);

  const finish = useCallback((value: string | null) => {
    setPending((current) => {
      current?.resolve(value);
      return null;
    });
  }, []);

  const dialog = pending ? (
    <PromptDialog
      message={pending.message}
      defaultValue={pending.defaultValue}
      confirmLabel={pending.confirmLabel}
      cancelLabel={pending.cancelLabel}
      onConfirm={(value) => finish(value)}
      onCancel={() => finish(null)}
    />
  ) : null;

  return { prompt, dialog };
}
