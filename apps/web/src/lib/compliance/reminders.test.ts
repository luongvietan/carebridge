import { describe, it, expect } from "vitest";
import { planReminders, reminderKey, type ReminderAlert } from "./reminders";

const userByProf = new Map<string, string | null>([
  ["prof-1", "user-1"],
  ["prof-2", "user-2"],
  ["prof-3", null], // no linked user
]);

describe("planReminders", () => {
  it("emits one reminder per (user, document) — surfacing each expiring credential", () => {
    const alerts: ReminderAlert[] = [
      { professionalId: "prof-1", documentId: "dbs", dueDate: "2026-07-10" },
      { professionalId: "prof-1", documentId: "insurance", dueDate: "2026-07-02" },
    ];
    const targets = planReminders(alerts, userByProf, new Set());
    expect(targets).toHaveLength(2);
    expect(targets.map((t) => t.documentId).sort()).toEqual(["dbs", "insurance"]);
  });

  it("keeps the earliest due date when a document has multiple alerts", () => {
    const alerts: ReminderAlert[] = [
      { professionalId: "prof-1", documentId: "dbs", dueDate: "2026-07-10" },
      { professionalId: "prof-1", documentId: "dbs", dueDate: "2026-07-01" },
    ];
    const targets = planReminders(alerts, userByProf, new Set());
    expect(targets).toHaveLength(1);
    expect(targets[0].dueDate).toBe("2026-07-01");
  });

  it("skips (user, document) pairs already reminded within the window", () => {
    const alerts: ReminderAlert[] = [
      { professionalId: "prof-1", documentId: "dbs", dueDate: "2026-07-10" },
      { professionalId: "prof-1", documentId: "insurance", dueDate: "2026-07-02" },
    ];
    const already = new Set([reminderKey("user-1", "dbs")]);
    const targets = planReminders(alerts, userByProf, already);
    expect(targets).toHaveLength(1);
    expect(targets[0].documentId).toBe("insurance");
  });

  it("ignores alerts whose professional has no linked user", () => {
    const alerts: ReminderAlert[] = [
      { professionalId: "prof-3", documentId: "dbs", dueDate: "2026-07-10" },
    ];
    expect(planReminders(alerts, userByProf, new Set())).toHaveLength(0);
  });
});
