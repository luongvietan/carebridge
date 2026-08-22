import { describe, it, expect, vi, beforeEach } from "vitest";
import { localeForCountry, renderTemplate, sendNotification, type ChannelSender } from "./send";

describe("renderTemplate", () => {
  it("substitutes {{vars}} in subject and body", () => {
    const out = renderTemplate(
      { subject: "Booking {{id}}", body: "Hi {{name}}, booking {{id}} is confirmed." },
      { id: "abc", name: "Jo" },
    );
    expect(out).toEqual({ subject: "Booking abc", body: "Hi Jo, booking abc is confirmed." });
  });
  it("replaces unknown vars with empty string", () => {
    expect(renderTemplate({ subject: "{{x}}", body: "" }, {})).toEqual({ subject: "", body: "" });
  });
});

describe("localeForCountry", () => {
  it("maps Portuguese professionals to pt-PT and everyone else to English", () => {
    expect(localeForCountry("PT")).toBe("pt-PT");
    expect(localeForCountry("GB")).toBe("en-GB");
    expect(localeForCountry(null)).toBe("en-GB");
  });
});

/**
 * Chainable Supabase stub: each builder method returns itself, terminal calls
 * consume a queue of per-table results — so a test can script exactly what
 * each successive query answers.
 */
function makeAdmin(resultsByTable: Record<string, unknown[]>) {
  // One queue per table, shared across every from(table) call in a request —
  // successive queries against the same table consume it in order.
  const queues = new Map<string, unknown[]>();
  return {
    from: vi.fn((table: string) => {
      if (!queues.has(table)) queues.set(table, [...(resultsByTable[table] ?? [])]);
      const queue = queues.get(table)!;
      const next = () => ({ data: queue.length > 1 ? queue.shift() : queue[0] });
      const chain = {
        select: () => chain,
        eq: () => chain,
        insert: () => chain,
        maybeSingle: async () => next(),
        single: async () => next(),
      };
      return {
        ...chain,
        update: () => ({ eq: async () => ({ data: null, error: null }) }),
      };
    }),
  };
}

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => mockAdmin,
}));

let mockAdmin: ReturnType<typeof makeAdmin>;

const EN_TEMPLATE = { subject: "Hi {{name}}", body: "Booking {{id}}" };
const PT_TEMPLATE = { subject: "Olá {{name}}", body: "Marcação {{id}}" };

describe("sendNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function run(sender: ChannelSender) {
    await sendNotification("booking_confirmation", "user1", { id: "b1", name: "Jo" }, sender);
  }

  it("marks notification sent when sender succeeds", async () => {
    mockAdmin = makeAdmin({
      professionals: [{ country_code: "GB" }],
      notification_templates: [EN_TEMPLATE],
      users: [{ email: "a@b.co" }],
      notifications: [{ id: "n1" }],
    });
    const sender: ChannelSender = vi.fn().mockResolvedValue(undefined);
    await run(sender);
    expect(sender).toHaveBeenCalledWith(
      expect.objectContaining({ to: "a@b.co", subject: "Hi Jo", body: "Booking b1" }),
    );
  });

  it("marks notification failed when sender throws", async () => {
    mockAdmin = makeAdmin({
      professionals: [{ country_code: "GB" }],
      notification_templates: [EN_TEMPLATE],
      users: [{ email: "a@b.co" }],
      notifications: [{ id: "n1" }],
    });
    const sender: ChannelSender = vi.fn().mockRejectedValue(new Error("smtp down"));
    await expect(
      sendNotification("booking_confirmation", "user1", { id: "b1", name: "Jo" }, sender),
    ).resolves.toBeUndefined(); // best-effort: never throw
  });

  it("sends a Portuguese professional the Portuguese variant", async () => {
    mockAdmin = makeAdmin({
      professionals: [{ country_code: "PT" }],
      notification_templates: [PT_TEMPLATE],
      users: [{ email: "a@b.co" }],
      notifications: [{ id: "n1" }],
    });
    const sender: ChannelSender = vi.fn().mockResolvedValue(undefined);
    await run(sender);
    expect(sender).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "Olá Jo", body: "Marcação b1" }),
    );
  });

  it("falls back to the English row when no Portuguese variant exists yet", async () => {
    mockAdmin = makeAdmin({
      // First terminal answer on notification_templates: pt-PT row missing.
      professionals: [{ country_code: "PT" }],
      notification_templates: [null, EN_TEMPLATE],
      users: [{ email: "a@b.co" }],
      notifications: [{ id: "n1" }],
    });
    const sender: ChannelSender = vi.fn().mockResolvedValue(undefined);
    await run(sender);
    expect(sender).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "Hi Jo", body: "Booking b1" }),
    );
  });

  it("silently does nothing when neither variant exists", async () => {
    mockAdmin = makeAdmin({
      professionals: [{ country_code: "PT" }],
      notification_templates: [null],
    });
    const sender: ChannelSender = vi.fn().mockResolvedValue(undefined);
    await run(sender);
    expect(sender).not.toHaveBeenCalled();
  });
});
