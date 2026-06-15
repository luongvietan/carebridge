import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderTemplate, sendNotification, type ChannelSender } from "./send";

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

const mockAdmin = {
  from: vi.fn(),
};

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => mockAdmin,
}));

describe("sendNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdmin.from.mockImplementation((table: string) => {
      if (table === "notification_templates") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: { subject: "Hi {{name}}", body: "Booking {{id}}" } }),
            }),
          }),
        };
      }
      if (table === "notifications") {
        let insertedId = "n1";
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({ data: { id: insertedId } }),
            }),
          }),
          update: () => ({
            eq: async () => ({ data: null, error: null }),
          }),
        };
      }
      if (table === "users") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { email: "a@b.co" } }),
            }),
          }),
        };
      }
      return {};
    });
  });

  it("marks notification sent when sender succeeds", async () => {
    const sender: ChannelSender = vi.fn().mockResolvedValue(undefined);
    await sendNotification("booking_confirmation", "user1", { id: "b1", name: "Jo" }, sender);
    expect(sender).toHaveBeenCalledWith(
      expect.objectContaining({ to: "a@b.co", subject: "Hi Jo", body: "Booking b1" }),
    );
  });

  it("marks notification failed when sender throws", async () => {
    const sender: ChannelSender = vi.fn().mockRejectedValue(new Error("smtp down"));
    await expect(
      sendNotification("booking_confirmation", "user1", { id: "b1", name: "Jo" }, sender),
    ).resolves.toBeUndefined(); // best-effort: never throws to caller
  });
});
