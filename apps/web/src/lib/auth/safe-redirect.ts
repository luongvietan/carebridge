const DEFAULT = "/";

/** Allow only same-site relative paths (no protocol-relative or external URLs). */
export function safeRedirectPath(value: string | null | undefined, fallback = DEFAULT): string {
  if (typeof value !== "string" || value.length === 0) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("\\") || value.includes("\0")) return fallback;
  try {
    const url = new URL(value, "http://localhost");
    if (url.origin !== "http://localhost") return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
