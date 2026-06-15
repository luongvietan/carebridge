import { describe, it, expect } from "vitest";
import { DATASETS, type DatasetName } from "./datasets";

describe("DATASETS", () => {
  it("covers all nine export datasets", () => {
    expect(Object.keys(DATASETS).sort()).toEqual(
      [
        "assessments",
        "audit",
        "bookings",
        "clients",
        "compliance",
        "organisations",
        "payments",
        "payouts",
        "professionals",
      ].sort(),
    );
  });

  it("maps every dataset to a v_export_ view with non-empty columns", () => {
    for (const name of Object.keys(DATASETS) as DatasetName[]) {
      expect(DATASETS[name].view).toMatch(/^v_export_/);
      expect(DATASETS[name].columns.length).toBeGreaterThan(0);
    }
  });
});
