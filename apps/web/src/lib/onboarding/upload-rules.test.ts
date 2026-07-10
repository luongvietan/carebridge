import { describe, expect, it } from "vitest";
import {
  describeSelectedUpload,
  formatBytes,
  MAX_UPLOAD_BYTES,
} from "./upload-rules";

describe("formatBytes", () => {
  it("renders bytes below 1KB", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
  });

  it("renders kilobytes with one decimal", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });

  it("renders megabytes with one decimal", () => {
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
    expect(formatBytes(3.4 * 1024 * 1024)).toBe("3.4 MB");
  });
});

describe("describeSelectedUpload", () => {
  it("classifies images by extension, case-insensitively", () => {
    expect(describeSelectedUpload({ name: "photo.JPG", size: 100 })).toEqual({ ok: true, kind: "image" });
    expect(describeSelectedUpload({ name: "scan.jpeg", size: 100 })).toEqual({ ok: true, kind: "image" });
    expect(describeSelectedUpload({ name: "badge.png", size: 100 })).toEqual({ ok: true, kind: "image" });
  });

  it("classifies PDFs by extension", () => {
    expect(describeSelectedUpload({ name: "certificate.pdf", size: 100 })).toEqual({ ok: true, kind: "pdf" });
  });

  it("rejects an empty file", () => {
    expect(describeSelectedUpload({ name: "photo.jpg", size: 0 })).toEqual({
      ok: false,
      error: "Choose a file to upload.",
    });
  });

  it("rejects files over the size limit", () => {
    const result = describeSelectedUpload({ name: "big.png", size: MAX_UPLOAD_BYTES + 1 });
    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ error: expect.stringContaining("25MB") });
  });

  it("rejects unsupported extensions", () => {
    expect(describeSelectedUpload({ name: "notes.txt", size: 100 })).toEqual({
      ok: false,
      error: "Only PDF, JPEG and PNG files are accepted.",
    });
    expect(describeSelectedUpload({ name: "archive.zip", size: 100 })).toEqual({
      ok: false,
      error: "Only PDF, JPEG and PNG files are accepted.",
    });
  });
});
