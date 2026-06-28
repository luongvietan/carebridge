"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";

const INPUT_CLASS =
  "mt-3 w-full rounded-xl border border-[#dbe7e0] bg-white px-3.5 py-2.5 text-sm text-[#14301e] placeholder:text-[#9aa8a0] focus:border-[#2e7d32] focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/15";

const BTN_CANCEL =
  "rounded-full border border-[#dbe7e0] px-4 py-1.5 text-sm font-medium text-[#4a4a4a] transition hover:border-[#bcd8c7] hover:bg-[#f5f7f6]";

const BTN_CONFIRM =
  "rounded-full bg-[#2e7d32] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[#246627]";

const BTN_DESTRUCTIVE =
  "rounded-full bg-[#da1e28] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[#b81921]";

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
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open onClose={onCancel}>
      <p className="text-sm leading-relaxed text-[#4a4a4a]">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={BTN_CANCEL}>
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={variant === "destructive" ? BTN_DESTRUCTIVE : BTN_CONFIRM}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

function PromptDialog({
  message,
  defaultValue = "",
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <Modal open onClose={onCancel}>
      <label className="block text-sm text-[#4a4a4a]">
        {message}
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
          {cancelLabel}
        </button>
        <button type="button" onClick={() => onConfirm(value)} className={BTN_CONFIRM}>
          {confirmLabel}
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
