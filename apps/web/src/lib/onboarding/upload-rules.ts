export const ALLOWED_UPLOAD_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export const ALLOWED_UPLOAD_EXT = [".pdf", ".jpg", ".jpeg", ".png"] as const;

const IMAGE_EXT = [".jpg", ".jpeg", ".png"] as const;

export function isImageStoragePath(path: string): boolean {
  const lower = path.toLowerCase();
  return IMAGE_EXT.some((ext) => lower.endsWith(ext));
}

export function isPdfStoragePath(path: string): boolean {
  return path.toLowerCase().endsWith(".pdf");
}

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const MAGIC = {
  pdf: [0x25, 0x50, 0x44, 0x46],
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
} as const;

function startsWith(buf: Uint8Array, sig: readonly number[]): boolean {
  if (buf.length < sig.length) return false;
  for (let i = 0; i < sig.length; i++) if (buf[i] !== sig[i]) return false;
  return true;
}

/** Determine the real type by magic bytes; returns null if unrecognised. */
export function sniffUploadType(head: Uint8Array): "pdf" | "jpeg" | "png" | null {
  if (startsWith(head, MAGIC.pdf)) return "pdf";
  if (startsWith(head, MAGIC.jpeg)) return "jpeg";
  if (startsWith(head, MAGIC.png)) return "png";
  return null;
}

const SNIFF_TO_MIME = { pdf: "application/pdf", jpeg: "image/jpeg", png: "image/png" } as const;

export type SelectedUploadKind = "image" | "pdf";

/** Human-readable file size, e.g. 512 B, 24.0 KB, 3.4 MB. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/**
 * Client-side, name/size-only check used to preview a chosen file before it is
 * uploaded. It mirrors {@link verifyUpload}'s extension and size rules so the
 * user gets immediate feedback, but the server still re-verifies by magic bytes.
 */
export function describeSelectedUpload(
  file: { name: string; size: number },
):
  | { ok: true; kind: SelectedUploadKind }
  | { ok: false; error: string } {
  if (file.size === 0) return { ok: false, error: "Choose a file to upload." };
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: `File exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB limit.` };
  }
  if (isPdfStoragePath(file.name)) return { ok: true, kind: "pdf" };
  if (isImageStoragePath(file.name)) return { ok: true, kind: "image" };
  return { ok: false, error: "Only PDF, JPEG and PNG files are accepted." };
}

/** Build a safe (sniffed) MIME type and storage filename. Rejects unsafe inputs. */
export async function verifyUpload(file: File): Promise<
  | { ok: true; safeMime: string; safeName: string }
  | { ok: false; error: string }
> {
  if (file.size === 0) return { ok: false, error: "Choose a file to upload." };
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: `File exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB limit.` };
  }

  const lower = file.name.toLowerCase();
  if (!ALLOWED_UPLOAD_EXT.some((ext) => lower.endsWith(ext))) {
    return { ok: false, error: "Only PDF, JPEG and PNG files are accepted." };
  }

  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const sniffed = sniffUploadType(head);
  if (!sniffed) {
    return { ok: false, error: "File content does not match an allowed PDF/JPEG/PNG document." };
  }

  // Strip any directory separators / control characters from the original
  // filename before it ever participates in the storage path. Control-char
  // range is intentional here — that is exactly what we are sanitising out.
  // eslint-disable-next-line no-control-regex
  const safeName = file.name.replace(/[\\/\x00-\x1f]/g, "_").slice(0, 200);

  return { ok: true, safeMime: SNIFF_TO_MIME[sniffed], safeName };
}
