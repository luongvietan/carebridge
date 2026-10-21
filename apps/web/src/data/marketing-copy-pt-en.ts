import type { MarketingContent } from "@/lib/i18n/content";
import { PT_COMPANY_ADDRESS } from "@/lib/site";

/** English presentation of Portugal's services, not the UK market's rules. */
export function portugalEnglish(base: MarketingContent): MarketingContent {
  const support = "Support with washing, dressing, toileting, mobility, meals and companionship, within the professional's competence and the assessed needs. Clinical procedures require an appropriately qualified professional.";
  const verification = ["Identity and right to work in Portugal", "NIF and NISS", "Evidence of self-employment registered with Finanças", "Portuguese criminal record; childcare certificate covering regular contact with minors", "Qualifications and applicable professional registration with Ordens or ISS", "Professional liability and workplace accident insurance", "CV, references and bank details (IBAN)"];
  const disclaimer = "CareBridge Connect is a marketplace connecting clients and organisations with independent professionals. The professional accepting the booking delivers the service; CareBridge does not directly provide healthcare or childcare.";
  const important = { heading: "Important information", intro: disclaimer, paragraphs: [support, "Nurses and other qualified professionals work within their verified scope of practice. Every professional is responsible for their training, competence and professional standards.", "Private-client requests are subject to a risk and needs assessment. Medium, high and unclear risks require review before publication."], audienceLabel: "For families, private clients and organisations seeking verified healthcare and childcare professionals in Portugal." };
  return {
    ...base, locale: "en-GB", showFounder: false, stats: [],
    ui: {
      ...base.ui,
      footer: { ...base.ui.footer, address: PT_COMPANY_ADDRESS, phone: "+351 926 562 988" },
      hero: { complianceBuiltIn: "Verification before booking", verifiedRoles: "Healthcare, home support and childcare" },
      statsFootnote: "Professional verification and ongoing document checks in Portugal.",
      servicesOffer: { ...base.ui.servicesOffer, sub: "Verified nurses, home-support professionals, physiotherapists and childcare professionals for families and organisations in Portugal.", more: "Adult, children's and mental health nurses, physiotherapists, home-support professionals, in-home childcare professionals, babysitters and licensed childminders.", viewAll: "View all professional categories" },
      servicesPage: { ...base.ui.servicesPage, description: "Verified healthcare, home support and childcare professionals for families and organisations in Portugal.", healthSub: "Registered nurses, physiotherapists and home-support professionals, verified before their first booking.", childSub: "In-home childcare professionals and babysitters have criminal-record and first-aid checks. Licensed childminders require authorisation from Segurança Social (ISS).", servicesSub: support, andOthers: "All support is subject to assessed needs and professional competence." },
      aboutPage: { ...base.ui.aboutPage, description: "Connecting families, private clients and organisations with trusted independent professionals in Portugal." },
      contact: { ...base.ui.contact, phoneValue: "+351 926 562 988", addressValue: PT_COMPANY_ADDRESS, whatsapp: "WhatsApp", whatsappValue: "+351 926 562 988" },
    },
    healthRoles: [
      { title: "Registered nurses — Adults", summary: "Adult nursing care from registered professionals, within their verified scope of practice.", description: "Nurses with valid professional registration providing adult care within their verified scope of practice.", image: { set: "health", index: 0 }, featuredOnHome: true },
      { title: "Registered nurses — Children", description: "Registered paediatric nurses supporting babies, children and young people within their professional competence.", image: { set: "health", index: 1 } },
      { title: "Registered nurses — Mental health", description: "Registered mental health nurses providing risk assessment, de-escalation and recovery-focused care within their scope of practice.", image: { set: "health", index: 2 } },
      { title: "Physiotherapists", description: "Physiotherapists registered with the Ordem dos Fisioterapeutas, providing rehabilitation and mobility support within their scope of practice.", image: { set: "health", index: 5 } },
      { title: "Home-support professionals", summary: "Everyday support, meals and companionship, tailored to assessed needs and professional competence.", description: support, image: { set: "health", index: 3 }, featuredOnHome: true },
    ],
    childcareRoles: [
      { title: "In-home childcare professionals", summary: "Childcare at home, with criminal-record and first-aid checks before booking.", description: "Childcare in the family's home, full-time, part-time or overnight, with criminal-record and first-aid checks before booking.", image: { set: "child", index: 0 }, featuredOnHome: true },
      { title: "Babysitters", description: "Occasional, evening and short-notice childcare, with criminal-record and first-aid checks.", image: { set: "child", index: 2 } },
      { title: "Licensed childminders (Amas)", description: "Childminders caring for children in their own homes, with required authorisation from Segurança Social (ISS), checked before booking.", image: { set: "child", index: 1 } },
    ],
    childcareCareTypes: base.childcareCareTypes,
    supportedServices: ["Washing and dressing", "Toileting and continence support", "Mobility and transfers", "Meal preparation", "Companionship", "Community and appointment support", "Respite support", "Support after hospital discharge", "Overnight support"],
    verificationChecklist: verification,
    complianceFeatures: [
      { title: "Why clients trust us", bullets: ["Eligibility screening, an onboarding assessment and document checks before approval.", "Applicable Ordens or ISS registration checked before booking.", "Expiry monitoring restricts professionals whose mandatory documents lapse."] },
      { title: "Professional checks", bullets: verification },
    ],
    aboutFeatures: ["Professional verification before booking", "Ongoing document monitoring", "A clear booking history for clients and professionals"],
    regulatoryDisclaimer: disclaimer,
    emergencyDisclaimer: "CareBridge Connect is not an emergency service. In an emergency in Portugal, call 112 or go to the nearest emergency department.",
    importantInformation: important,
    about: {
      welcome: { heading: "Welcome to CareBridge Connect", paragraphs: [disclaimer, "We help families and organisations find trusted professionals for healthcare, home support and childcare through a secure and transparent platform."] },
      mission: { heading: "Our mission", text: "Improve access to reliable support by connecting people, families and organisations with trusted professionals." },
      vision: { heading: "Our vision", text: "Give professionals flexible work opportunities and help communities access support when they need it." },
      commitment: { heading: "Our commitment", intro: "We are committed to:", bullets: ["Professionalism, integrity and accountability", "A secure and transparent platform", "Reliable support and flexible professional opportunities", "Trust within local communities", "Continual improvement in how support is found and delivered"] },
      verification: { heading: "Professional verification", intro: "Verification depends on the professional category and may include:", bullets: verification },
      importantInfo: { heading: important.heading, paragraphs: [important.intro, ...important.paragraphs] },
    },
  };
}
