/**
 * The marketing site's content per market: the roles it lists, the compliance
 * story it tells, and the words around them. English is the UK market's own
 * content (not a translation); Portuguese is the Portugal market's. Both are
 * the same shape, so a page renders either without knowing which it has, and a
 * missing string in one is a compile error rather than an untranslated page.
 */

import {
  aboutFeatures,
  childcareCareTypes,
  childcareRoles,
  complianceFeatures,
  emergencyDisclaimer,
  importantInformation,
  professionalRoles,
  regulatoryDisclaimer,
  stats,
  supportedServices,
  verificationChecklist,
} from "@/data/marketing-copy";
import { aboutContent } from "@/data/legal-copy";
import {
  aboutContentPt,
  aboutFeaturesPt,
  childcareCareTypesPt,
  childcareRolesPt,
  complianceFeaturesPt,
  emergencyDisclaimerPt,
  importantInformationPt,
  professionalRolesPt,
  regulatoryDisclaimerPt,
  statsPt,
  supportedServicesPt,
  uiPt,
  verificationChecklistPt,
} from "@/data/marketing-copy-pt";
import { marketingImages } from "@/data/marketing-images";

/** Which photo a role card uses: the health set or the childcare set, by position. */
export type RoleImageRef = { set: "health" | "child"; index: number };

export type RoleCopy = {
  title: string;
  description: string;
  featuredOnHome?: boolean;
  image: RoleImageRef;
};

export function roleImage(ref: RoleImageRef): { src: string; alt: string } {
  const set = ref.set === "health" ? marketingImages.roleCards : marketingImages.childcareRoleCards;
  return set[ref.index];
}

type Widen<T> = T extends string
  ? string
  : T extends readonly unknown[]
    ? { -readonly [K in keyof T]: Widen<T[K]> }
    : { -readonly [K in keyof T]: Widen<T[K]> };

const uiEn = {
  nav: {
    home: "Home",
    about: "About Us",
    roles: "Professional roles",
    faq: "FAQ",
    contactUs: "Contact Us",
    signIn: "Sign in",
    dashboard: "Dashboard",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  footer: {
    contactTitle: "Contact Us",
    socialTitle: "Our Social Channels",
    socialBody:
      "The latest insights, resources, expert opinions and company news from CareBridge Connect.",
    terms: "Terms & conditions",
    importantInfo: "Important information",
    privacy: "Privacy Policy",
    home: "Home",
    services: "Services",
    faq: "FAQ",
    support: "Support",
    backToTop: "Back to top",
    rights: "All rights reserved.",
    address: "Manchester, United Kingdom",
    phone: "+44 (0)161 000 0000",
  },
  hero: { complianceBuiltIn: "Compliance built in", verifiedRoles: "10 verified role types" },
  statsFootnote:
    "Built for operational control — full audit trails, automatic compliance alerts and data export for CareBridge Connect Ltd at any time.",
  getStarted: "Get started",
  aboutIntro: {
    heading:
      "A secure healthcare and childcare marketplace — only suitable, verified professionals join our platform",
    badge: "Compliance-first",
    body: "CareBridge Connect provides a secure, compliant onboarding journey for healthcare professionals and a straightforward booking process for private clients and organisations — with eligibility screening, competency assessment, document verification and continuous compliance tracking built in.",
  },
  servicesOffer: {
    heading: "Professional roles we cover",
    sub: "Healthcare and childcare professionals — from registered nurses and support workers to Ofsted-registered nannies — available for booking requests from families and organisations.",
    more: "Children's and mental health nurses, physiotherapists, nannies, childminders, babysitters and mother's helpers are also available.",
    viewAll: "View all ten roles",
  },
  compliance: {
    heading: "Verified professionals, continuous compliance",
    body: "No professional — healthcare or childcare — can accept a booking until every one of these has been checked and approved, and each one is monitored for expiry afterwards.",
  },
  callout: { readFull: "Read the full important information & disclaimer" },
  servicesPage: {
    title: "Professional roles we cover",
    badge: "Professional roles",
    description:
      "Compliance-checked healthcare and childcare staffing for families and organisations — verified professionals across ten roles, matched via booking requests.",
    healthHeading: "Healthcare professionals",
    healthSub:
      "Registered nurses, healthcare assistants, support workers and physiotherapists — each verified before their first booking.",
    childHeading: "Childcare professionals",
    childSub:
      "CareBridge Connect accepts Ofsted-registered nannies only. Every nanny's Ofsted registration number is checked against the Ofsted register, and no nanny can accept a booking until that registration has been verified.",
    careTypesHeading: "Childcare booking options",
    careTypesSub: "Choose the arrangement that fits your family when you make a booking request.",
    servicesHeading: "Services we support",
    servicesSub:
      "Engagements are limited to companionship and other non-regulated activities. CareBridge Connect does not provide regulated personal care services.",
    andOthers: "…and other non-regulated activities.",
    howHeading: "How it works",
    howSub:
      "From onboarding to booking — a clear path for professionals, private clients and organisations.",
    readyHeading: "Ready to create a booking request?",
    readyBody: "Register as a private client or organisation — or join as a verified professional.",
  },
  aboutPage: {
    badge: "About CareBridge Connect",
    title: "Welcome to CareBridge Connect",
    description:
      "A healthcare marketplace connecting community clients, families and organisations with trusted healthcare professionals across the United Kingdom.",
    readDisclaimer: "Read the full disclaimer",
  },
  contact: {
    title: "We'd love to hear from you",
    description:
      "Questions about joining as a professional, creating a booking request, or how compliance works? Send us a message and we'll get back to you.",
    email: "Email",
    phone: "Phone",
    address: "Address",
    phoneValue: "+44 (0)161 000 0000",
    addressValue: "Manchester, United Kingdom",
    whatsapp: "",
    whatsappValue: "",
    joinTitle: "Looking to join?",
    joinBody:
      "Professionals complete onboarding online. Clients and organisations can register and create booking requests directly — no need to contact us first.",
  },
  contactForm: {
    thanksTitle: "Thanks — your message is on its way",
    thanksBody: "We've received your message and will get back to you by email shortly.",
    name: "Full name",
    namePlaceholder: "Your name",
    email: "Email",
    subject: "Subject",
    subjectPlaceholder: "How can we help?",
    message: "Message",
    messagePlaceholder: "Tell us a little more…",
    send: "Send message",
    sending: "Sending…",
  },
} as const;

export type Ui = Widen<typeof uiEn>;

export type AboutCopy = {
  welcome: { heading: string; paragraphs: readonly string[] };
  mission: { heading: string; text: string };
  vision: { heading: string; text: string };
  commitment: { heading: string; intro: string; bullets: readonly string[] };
  verification: { heading: string; intro: string; bullets: readonly string[] };
  importantInfo: { heading: string; paragraphs: readonly string[] };
};

export type MarketingContent = {
  locale: "en-GB" | "pt-PT";
  ui: Ui;
  healthRoles: RoleCopy[];
  childcareRoles: RoleCopy[];
  childcareCareTypes: readonly string[];
  supportedServices: readonly string[];
  complianceFeatures: readonly { title: string; bullets: readonly string[] }[];
  verificationChecklist: readonly string[];
  aboutFeatures: readonly string[];
  stats: readonly { value: string; label: string }[];
  regulatoryDisclaimer: string;
  emergencyDisclaimer: string;
  importantInformation: {
    heading: string;
    intro: string;
    paragraphs: readonly string[];
    audienceLabel: string;
  };
  about: AboutCopy;
  /** Only the UK page carries the founder's own words; see `founder` in legal-copy. */
  showFounder: boolean;
};

const en: MarketingContent = {
  locale: "en-GB",
  ui: uiEn,
  healthRoles: professionalRoles.map((r, i) => ({
    title: r.title,
    description: r.description,
    featuredOnHome: "featuredOnHome" in r && r.featuredOnHome ? true : undefined,
    image: { set: "health", index: i },
  })),
  childcareRoles: childcareRoles.map((r, i) => ({
    title: r.title,
    description: r.description,
    image: { set: "child", index: i },
  })),
  childcareCareTypes,
  supportedServices,
  complianceFeatures,
  verificationChecklist,
  aboutFeatures,
  stats,
  regulatoryDisclaimer,
  emergencyDisclaimer,
  importantInformation,
  about: aboutContent,
  showFounder: true,
};

const pt: MarketingContent = {
  locale: "pt-PT",
  ui: uiPt,
  healthRoles: professionalRolesPt,
  childcareRoles: childcareRolesPt,
  childcareCareTypes: childcareCareTypesPt,
  supportedServices: supportedServicesPt,
  complianceFeatures: complianceFeaturesPt,
  verificationChecklist: verificationChecklistPt,
  aboutFeatures: aboutFeaturesPt,
  stats: statsPt,
  regulatoryDisclaimer: regulatoryDisclaimerPt,
  emergencyDisclaimer: emergencyDisclaimerPt,
  importantInformation: importantInformationPt,
  about: {
    ...aboutContentPt,
    importantInfo: {
      heading: importantInformationPt.heading,
      paragraphs: [importantInformationPt.intro, ...importantInformationPt.paragraphs],
    },
  },
  showFounder: false,
};

export function contentForLocale(locale: string): MarketingContent {
  return locale === "pt-PT" ? pt : en;
}
