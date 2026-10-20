import { DEFAULT_SITE_ORIGIN, getSiteOrigin } from "@/lib/site";

export type EmailLocale = "pt-PT" | "en-GB";
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

/** Links come only from the configured site origin, never from message text. */
export function safeEmailOrigin(value: string): string {
  try {
    const url = new URL(value);
    if ((url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password) return url.origin;
  } catch { /* Fall back to the known public site. */ }
  return DEFAULT_SITE_ORIGIN;
}

export function renderEmail(input: { subject: string; body: string; locale: string; appUrl?: string }) {
  const locale: EmailLocale = input.locale === "pt-PT" ? "pt-PT" : "en-GB";
  const origin = safeEmailOrigin(input.appUrl ?? getSiteOrigin());
  const subject = input.subject.replace(/[\r\n]/g, " ").replaceAll("\u0000", " ");
  const footer = locale === "pt-PT" ? "Normalmente respondemos no prazo de um dia útil." : "We normally reply within one working day.";
  const signature = "CareBridge Connect Portugal\n+351 926 562 988 · WhatsApp";
  const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head><body style="margin:0;background:#f4f8f5;font-family:Arial,sans-serif;color:#14301e"><table role="presentation" width="100%"><tr><td align="center" style="padding:32px 16px"><table role="presentation" style="max-width:600px;width:100%;background:white;border-radius:16px"><tr><td style="padding:24px;border-bottom:3px solid #2e7d32"><a href="${escapeHtml(origin)}"><img src="${escapeHtml(origin)}/logo.jpeg" width="72" alt="CareBridge Connect" style="display:block;border:0"></a><p style="font-size:20px;font-weight:bold">CareBridge Connect Portugal</p></td></tr><tr><td style="padding:24px"><h1 style="font-size:22px">${escapeHtml(subject)}</h1><p style="line-height:1.6;white-space:pre-wrap">${escapeHtml(input.body)}</p></td></tr><tr><td style="padding:24px;background:#e6f4ea;font-size:12px">${escapeHtml(signature).replaceAll("\n", "<br>")}<br>${footer}<br><a href="${escapeHtml(origin)}/contact">${locale === "pt-PT" ? "Contacte-nos" : "Contact us"}</a></td></tr></table></td></tr></table></body></html>`;
  return { subject, text: `${input.body}\n\n${signature}\n${footer}\n${origin}/contact`, html };
}

export function renderEnquiryAcknowledgement(locale: EmailLocale) {
  return renderEmail({ locale,
    subject: locale === "pt-PT" ? "Recebemos a sua mensagem — CareBridge Connect" : "We've received your enquiry — CareBridge Connect",
    body: locale === "pt-PT" ? "Recebemos a sua mensagem através do formulário de contacto. A equipa irá analisá-la e responder por email.\n\nPara proteger a sua privacidade, não incluímos o conteúdo da sua mensagem neste email." : "We've received your message through our contact form. Our team will review it and reply by email.\n\nTo protect your privacy, we have not included the contents of your enquiry in this email.",
  });
}
