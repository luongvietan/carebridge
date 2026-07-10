"use client";
import { useEffect, useId, useRef, useState } from "react";
import {
  describeSelectedUpload,
  formatBytes,
  type SelectedUploadKind,
} from "@/lib/onboarding/upload-rules";

export type ExistingFile = {
  url: string;
  kind: SelectedUploadKind;
  filename?: string | null;
  downloadUrl?: string | null;
};

type Variant = "avatar" | "document";

type SelectedState = {
  name: string;
  size: number;
  kind: SelectedUploadKind;
  objectUrl: string | null; // set for images only
};

const PANEL = {
  avatar: "h-24 w-24 rounded-full",
  document: "h-24 w-32 rounded-xl",
} as const;

function PdfGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * A file input that shows an inline preview of the chosen file (image thumbnail
 * or PDF chip) and, when nothing is selected, the file already on record. The
 * native <input> stays visible so required-field validation, focus and keyboard
 * behaviour are untouched — this only adds the preview around it.
 */
export function FilePreviewInput({
  name,
  variant = "document",
  existing = null,
  accept,
  required,
  "aria-label": ariaLabel,
  emptyLabel,
}: {
  name: string;
  variant?: Variant;
  existing?: ExistingFile | null;
  accept?: string;
  required?: boolean;
  "aria-label"?: string;
  emptyLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<SelectedState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const describedBy = useId();

  // Revoke the object URL when it is replaced or the component unmounts.
  useEffect(() => {
    return () => {
      if (selected?.objectUrl) URL.revokeObjectURL(selected.objectUrl);
    };
  }, [selected?.objectUrl]);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (selected?.objectUrl) URL.revokeObjectURL(selected.objectUrl);
    const file = e.target.files?.[0];
    if (!file) {
      setSelected(null);
      setError(null);
      return;
    }
    const check = describeSelectedUpload(file);
    if (!check.ok) {
      setSelected(null);
      setError(check.error);
      return;
    }
    setError(null);
    setSelected({
      name: file.name,
      size: file.size,
      kind: check.kind,
      objectUrl: check.kind === "image" ? URL.createObjectURL(file) : null,
    });
  }

  function clear() {
    if (selected?.objectUrl) URL.revokeObjectURL(selected.objectUrl);
    setSelected(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const panelClass = PANEL[variant];
  const isAvatar = variant === "avatar";

  // Decide what the preview panel shows: newly selected file wins, then the
  // existing file on record, then an empty placeholder.
  let panel: React.ReactNode;
  if (selected) {
    if (selected.kind === "image" && selected.objectUrl) {
      panel = (
        <a
          href={selected.objectUrl}
          target="_blank"
          rel="noreferrer"
          className={`block shrink-0 overflow-hidden border border-[#2e7d32] bg-[#f5f7f6] ${panelClass}`}
          title="Open selected image full size"
        >
          <img src={selected.objectUrl} alt="Selected file preview" className={`${isAvatar ? "object-cover" : "object-contain"} h-full w-full`} />
        </a>
      );
    } else {
      panel = (
        <div className={`grid shrink-0 place-items-center border border-[#2e7d32] bg-[#f5f7f6] text-[#2e7d32] ${panelClass}`}>
          <PdfGlyph className="h-8 w-8" />
        </div>
      );
    }
  } else if (existing) {
    if (existing.kind === "image") {
      panel = (
        <a
          href={existing.url}
          target="_blank"
          rel="noreferrer"
          className={`block shrink-0 overflow-hidden border border-[#dbe7e0] bg-[#f5f7f6] ${panelClass}`}
          title="Open current file full size"
        >
          <img src={existing.url} alt="Current file on record" className={`${isAvatar ? "object-cover" : "object-contain"} h-full w-full`} />
        </a>
      );
    } else {
      panel = (
        <a
          href={existing.url}
          target="_blank"
          rel="noreferrer"
          className={`grid shrink-0 place-items-center border border-[#dbe7e0] bg-[#f5f7f6] text-[#7a8a81] ${panelClass}`}
          title="Open current document"
        >
          <PdfGlyph className="h-8 w-8" />
        </a>
      );
    }
  } else {
    panel = (
      <div className={`grid shrink-0 place-items-center border border-dashed border-[#dbe7e0] bg-[#f5f7f6] text-center text-[11px] leading-tight text-[#7a8a81] ${panelClass}`}>
        {emptyLabel ?? (isAvatar ? "No photo" : "No file")}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      {panel}
      <div className="min-w-0 flex-1">
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept={accept}
          required={required}
          aria-label={ariaLabel}
          aria-describedby={selected || error ? describedBy : undefined}
          onChange={onChange}
          className="block w-full text-sm file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-[#14301e] file:px-3 file:py-1.5 file:text-white hover:file:bg-[#33433a]"
        />
        <p id={describedBy} className="mt-1.5 text-xs">
          {error ? (
            <span className="text-[#da1e28]">{error}</span>
          ) : selected ? (
            <span className="text-[#4a4a4a]">
              <span className="font-medium">{selected.name}</span>{" "}
              <span className="text-[#7a8a81]">· {formatBytes(selected.size)}</span>{" "}
              <button type="button" onClick={clear} className="text-[#2e7d32] underline">
                Remove
              </button>
            </span>
          ) : existing ? (
            <span className="text-[#7a8a81]">
              {existing.filename ? `${existing.filename} on record` : "File on record"}
              {existing.downloadUrl && (
                <>
                  {" · "}
                  <a href={existing.downloadUrl} className="text-[#2e7d32] underline">
                    Download
                  </a>
                </>
              )}
            </span>
          ) : (
            <span className="text-[#7a8a81]">PDF, JPEG or PNG · up to 25MB</span>
          )}
        </p>
      </div>
    </div>
  );
}
