import { describe, expect, it } from "vitest";
import { requesterCopy } from "./requester-copy";
import { authCopy } from "@/lib/auth/copy";

function keys(v: unknown, prefix = ""): string[] {
  if (v && typeof v === "object") {
    return Object.entries(v).flatMap(([k, x]) => keys(x, `${prefix}${k}.`));
  }
  return [prefix];
}

describe("requester and auth copy", () => {
  it("has the same keys in English and Portuguese", () => {
    expect(keys(requesterCopy["pt-PT"])).toEqual(keys(requesterCopy["en-GB"]));
    expect(keys(authCopy["pt-PT"])).toEqual(keys(authCopy["en-GB"]));
  });

  it("leaves no Portuguese string empty, except the UK-only CQC label", () => {
    const empty: string[] = [];
    (function walk(v: unknown, path: string) {
      if (typeof v === "string") {
        if (!v.trim()) empty.push(path);
      } else if (v && typeof v === "object") {
        Object.entries(v).forEach(([k, x]) => walk(x, `${path}${k}.`));
      }
    })({ ...requesterCopy["pt-PT"], auth: authCopy["pt-PT"] }, "");
    expect(empty).toEqual(["profile.cqc."]);
  });
});
