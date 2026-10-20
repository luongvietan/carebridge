import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { getContentForVisitor } from "@/lib/i18n/server";

const LABELS = {
  "en-GB": {
    title: "Important information & disclaimer",
    emergency: "Emergency services",
    services: "Services we support",
    servicesIntro:
      "Support available through the platform depends on assessed needs and the professional’s qualifications and competence, and may include:",
    servicesMore:
      "Clinical care is provided only by appropriately qualified and authorised professionals.",
    audience: "Who the platform is for",
  },
  "pt-PT": {
    title: "Informação importante e aviso legal",
    emergency: "Serviços de emergência",
    services: "Serviços que apoiamos",
    servicesIntro:
      "O apoio disponível através da plataforma depende das necessidades avaliadas e das qualificações e competências do profissional, podendo incluir:",
    servicesMore:
      "Os cuidados clínicos são prestados apenas por profissionais devidamente qualificados e autorizados.",
    audience: "A quem se destina a plataforma",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getContentForVisitor();
  return { title: `${LABELS[locale].title}` };
}

export default async function DisclaimerPage() {
  const content = await getContentForVisitor();
  const { importantInformation, emergencyDisclaimer, supportedServices } = content;
  const t = LABELS[content.locale];
  return (
    <>
      <SiteNav />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-heading">
          {importantInformation.heading}
        </h1>
        <p className="mt-5 leading-relaxed text-ink">{importantInformation.intro}</p>
        {importantInformation.paragraphs.map((paragraph) => (
          <p key={paragraph} className="mt-4 leading-relaxed text-ink">
            {paragraph}
          </p>
        ))}

        <div className="mt-8 rounded-xl border border-[#f5c6cb] bg-[#fff5f5] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#8b2e2e]">{t.emergency}</h2>
          <p className="mt-2 leading-relaxed text-[#8b2e2e]">{emergencyDisclaimer}</p>
        </div>

        <h2 className="mt-10 text-xl font-semibold text-heading">{t.services}</h2>
        <p className="mt-3 leading-relaxed text-ink">{t.servicesIntro}</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {supportedServices.map((service) => (
            <li key={service} className="flex items-start gap-2 text-ink">
              <span aria-hidden className="mt-1 text-brand-strong">
                •
              </span>
              <span>{service}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 leading-relaxed text-ink">{t.servicesMore}</p>

        <h2 className="mt-10 text-xl font-semibold text-heading">{t.audience}</h2>
        <p className="mt-3 leading-relaxed text-ink">{importantInformation.audienceLabel}</p>
      </main>
      <SiteFooter />
    </>
  );
}
