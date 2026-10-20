import { describe, expect, it, vi } from "vitest";
import { renderEmail, renderEnquiryAcknowledgement } from "./render";
import { sendEmail } from "./transport";

describe("branded email", () => {
  it("includes the Portugal signature and response time in both formats", () => {
    for (const locale of ["en-GB", "pt-PT"]) {
      const email = renderEmail({ subject: "Test", body: "Message", locale });
      for (const content of [email.html, email.text]) {
        expect(content).toContain("CareBridge Connect Portugal");
        expect(content).toContain("+351 926 562 988");
        expect(content).toContain("WhatsApp");
        expect(content).toContain(locale === "pt-PT" ? "um dia útil" : "one working day");
      }
    }
  });
  it("rejects header injection at the transport boundary and provider rejection", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-only"); vi.stubEnv("RESEND_FROM", "CareBridge Connect <test@example.test>");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: false, status: 503 } as Response);
    const email = { to: "test@example.test", ...renderEmail({ subject: "Hello", body: "Text", locale: "en-GB" }) };
    await expect(sendEmail({ ...email, to: "test@example.test\r\nBcc: other@example.test" })).rejects.toThrow("Invalid email header");
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(sendEmail(email)).rejects.toThrow("503");
    fetchMock.mockRestore(); vi.unstubAllEnvs();
  });
  it("escapes user content and unsafe URLs while keeping readable plain text", () => {
    const body = '<img src=x onerror="alert(1)"> & hello';
    const email = renderEmail({ subject: "Hello\r\nBcc: victim", body, locale: "pt-PT", appUrl: "javascript:alert(1)" });
    expect(email.html).toContain('lang="pt-PT"');
    expect(email.html).toContain("CareBridge Connect");
    expect(email.html).toContain("/logo.jpeg");
    expect(email.html).toContain("&lt;img");
    expect(email.html).not.toContain("<img src=x");
    expect(email.html).not.toContain("javascript:");
    expect(email.text).toContain(body);
    expect(email.subject).not.toMatch(/[\r\n]/);
  });
  it("acknowledges in Portuguese and English without repeating sensitive messages", () => {
    expect(renderEnquiryAcknowledgement("pt-PT").text).toContain("Recebemos");
    expect(renderEnquiryAcknowledgement("en-GB").text).toContain("received");
  });
  it("skips unconfigured delivery and sends HTML plus plain text only when configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true } as Response);
    const email = { to: "test@example.test", ...renderEmail({ subject: "Hello", body: "Text", locale: "en-GB" }) };
    expect(await sendEmail(email)).toBe("skipped");
    expect(fetchMock).not.toHaveBeenCalled();
    vi.stubEnv("RESEND_API_KEY", "test-only");
    vi.stubEnv("RESEND_FROM", "CareBridge Connect <test@example.test>");
    expect(await sendEmail(email, "contact-test")).toBe("sent");
    const request = fetchMock.mock.calls[0][1]!;
    expect(JSON.parse(request.body as string)).toMatchObject({ from: "CareBridge Connect Portugal <test@example.test>", html: email.html, text: email.text });
    expect(request.headers).toHaveProperty("Idempotency-Key", "contact-test");
    fetchMock.mockRestore(); vi.unstubAllEnvs();
  });
});
