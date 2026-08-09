/** Public marketing copy aligned with CareBridge Connect MVP Overview.pdf */

export const siteTagline =
  "A trusted marketplace connecting families and organisations with verified healthcare and childcare professionals, making it easy to find safe, reliable, and high-quality care when it's needed most.";

export const heroHeadline =
  "Connecting Families and Organisations with Verified Healthcare and Childcare Professionals.";

/** The markets CareBridge Connect operates in. `live: false` renders as
 *  "launching soon" — claiming a country where no professional can yet
 *  register would mislead the families and professionals who read it. */
export const markets = [
  { code: "GB", flag: "\u{1F1EC}\u{1F1E7}", name: "United Kingdom", live: true },
  { code: "PT", flag: "\u{1F1F5}\u{1F1F9}", name: "Portugal", live: false },
] as const;

export const marketsLine =
  "Serving the United Kingdom, with Portugal launching next — each country with its own professional roles, regulators and compliance requirements.";

export const heroSubheadline =
  "A trusted care marketplace — verified nurses, healthcare assistants, support workers, physiotherapists, nannies, childminders, babysitters and mother's helpers, screened, assessed and continuously monitored for compliance.";

/** `featuredOnHome` picks the three cards shown on the homepage; the services
 *  page lists every role. Order here is the order shown, and it is index-matched
 *  to `marketingImages.roleCards`. */
export const professionalRoles = [
  {
    title: "Adult Nurses",
    featuredOnHome: true,
    description:
      "NMC-registered adult nurses providing clinical care, medication management and assessments within their professional scope of practice, subject to verification and compliance requirements.",
  },
  {
    title: "Children's (Paediatric) Nurses",
    description:
      "NMC-registered children's nurses caring for infants, children and young people, with paediatric assessment and escalation within their scope of practice.",
  },
  {
    title: "Mental Health Nurses",
    description:
      "NMC-registered mental health nurses supporting people experiencing mental ill health, with risk assessment, de-escalation and recovery-focused care within their scope of practice.",
  },
  {
    title: "Healthcare Assistants",
    featuredOnHome: true,
    description:
      "Experienced HCAs providing companionship, wellbeing support, appointment and community access, sitting services and other non-regulated support activities. They do not provide regulated personal care services through CareBridge Connect.",
  },
  {
    title: "Support Workers",
    featuredOnHome: true,
    description:
      "Support Workers provide companionship, community access, appointment support, wellbeing support, respite sitting services and other non-regulated support activities.",
  },
  {
    title: "Physiotherapists",
    description:
      "HCPC-registered physiotherapists for rehabilitation and mobility programmes within their professional scope of practice.",
  },
] as const;

export const childcareRoles = [
  {
    title: "Ofsted Registered Nannies",
    description:
      "Ofsted-registered nannies only. Every nanny's Ofsted registration number is verified against the Ofsted register before they can accept a booking. Available full-time, part-time and overnight.",
  },
  {
    title: "Registered Childminders",
    description:
      "Ofsted-registered childminders caring for children in their own home, within the numbers and ratios their registration allows. Registration number mandatory and checked before any booking.",
  },
  {
    title: "Babysitters",
    description:
      "Experienced babysitters for evening, occasional and short-notice care, DBS-checked and paediatric first aid trained.",
  },
  {
    title: "Mother's Helpers",
    description:
      "Practical support alongside the parent — helping with the children and the household during the day rather than taking sole charge.",
  },
] as const;

/** Scheduling options families choose when booking childcare. */
export const childcareCareTypes = [
  "Full-time",
  "Part-time",
  "After-school care",
  "Overnight",
  "Holiday childcare",
  "Emergency childcare",
] as const;

export const stats = [
  { value: "100%", label: "Verified before first booking" },
  { value: "10", label: "Professional roles" },
  { value: "80%", label: "Competency pass mark" },
  { value: "CSV / XLSX", label: "Full data export anytime" },
] as const;

export const onboardingSteps = [
  {
    title: "Register & verify",
    description:
      "Every professional completes identity verification, professional registration checks against the regulator's own register, an online competency assessment and document uploads — all reviewed and approved by the CareBridge Connect team before they can be booked.",
  },
  {
    title: "Request or match",
    description:
      "Families, private clients and organisations request healthcare or childcare professionals by role, date, time and location. Verified professionals accept open bookings, or an administrator assigns one directly.",
  },
  {
    title: "Book with confidence",
    description:
      "Only fully verified professionals can accept bookings. Continuous compliance monitoring automatically restricts anyone whose registration or mandatory documents expire, until they are renewed and re-approved.",
  },
  {
    title: "Complete & get paid",
    description:
      "The professional logs the hours actually worked, the client or manager confirms them, and payment is released. Both sides keep a full booking history.",
  },
] as const;

export const complianceFeatures = [
  {
    title: "Why clients trust us",
    bullets: [
      "Every professional passes eligibility screening, competency assessment and document verification before approval.",
      "Professional registration is checked against the regulator's own register — the NMC for nurses, the HCPC for physiotherapists, Ofsted for nannies and childminders — and re-checked every year.",
    ],
  },
  {
    title: "Personalised staffing programmes",
    bullets: [
      "Booking requests matched across ten roles — adult, children's and mental health nurses, healthcare assistants, support workers and physiotherapists, plus Ofsted-registered nannies, registered childminders, babysitters and mother's helpers.",
      "Flexible cover for families, private clients, healthcare organisations, supported living services, care providers and healthcare facilities.",
    ],
  },
  {
    title: "Automatic compliance blocking",
    bullets: [
      "Expired DBS, registration, insurance, training or Right to Work evidence restricts new bookings instantly.",
      "Professionals become available again only after updated documents are uploaded and approved.",
    ],
  },
] as const;

/** What "verified" means, spelled out — the evidence behind the Fully Verified
 *  badge on an approved professional's profile. */
export const verificationChecklist = [
  "Professional registration or licence",
  "Right to Work",
  "Identity verification",
  "Proof of address",
  "DBS (United Kingdom) or criminal record certificate (Portugal)",
  "Mandatory training",
  "References",
  "Ongoing monitoring with automatic expiry alerts",
] as const;

export const aboutFeatures = [
  "Compliance-checked professionals on every booking",
  "Continuous credential tracking with automatic restriction",
  "Full platform data export in CSV or Excel at any time",
] as const;

export const registerLinks = {
  professional: "/register?as=professional",
  client: "/register?as=client",
} as const;

export const ctaLabels = {
  joinProfessional: "Join as a professional",
  createBookingRequest: "Create a booking request",
  getStarted: "Get started",
} as const;

export const registrationPaths = [
  {
    id: "professional" as const,
    href: registerLinks.professional,
    title: ctaLabels.joinProfessional,
    description:
      "Complete eligibility screening, a competency assessment and document verification to join our verified marketplace.",
  },
  {
    id: "client" as const,
    href: registerLinks.client,
    title: ctaLabels.createBookingRequest,
    description:
      "Register as a private client or organisation to request verified nurses, HCAs, support workers or physiotherapists.",
  },
] as const;

/** Short disclaimer line shown in the global footer on every page. */
export const regulatoryDisclaimer =
  "CareBridge Connect is a non-CQC regulated healthcare marketplace. It is not a domiciliary care agency and is not currently registered with the Care Quality Commission (CQC). It does not directly provide regulated personal care services.";

/** Emergency services notice — shown in footer, disclaimer page and inline callouts. */
export const emergencyDisclaimer =
  "CareBridge Connect is not an emergency healthcare service. In an emergency, contact emergency services (999) or attend your nearest Emergency Department.";

/** Non-regulated services available through the platform. */
export const supportedServices = [
  "Companionship",
  "Community access",
  "Appointment support",
  "Wellbeing support",
  "Respite sitting services",
  "Hospital discharge support",
  "Chaperoning",
  "Overnight support",
] as const;

/** Full "Important information" disclaimer used on the /disclaimer page and inline callouts. */
export const importantInformation = {
  heading: "Important information",
  intro:
    "CareBridge Connect is a non-CQC regulated healthcare marketplace connecting clients and organisations with independent healthcare professionals.",
  paragraphs: [
    "CareBridge Connect is not a domiciliary care agency and is not currently registered with the Care Quality Commission (CQC). We do not directly provide regulated personal care services, nursing services, treatment, or care.",
    "Support Workers provide companionship, community access, appointment support, wellbeing support, respite sitting services and other non-regulated support activities. Healthcare Assistants provide companionship, wellbeing support, appointment and community access, sitting services and other non-regulated support activities. Neither role may provide regulated personal care services on behalf of CareBridge Connect.",
    "Support Workers and Healthcare Assistants may provide personal care when working directly for, or under the direction of, an appropriately CQC-regulated organisation where such duties form part of their authorised role.",
    "Registered Nurses and other appropriately qualified healthcare professionals may provide services that fall within their professional scope of practice, subject to verification and compliance requirements.",
    "Where regulated care services are required, clients should seek support from an appropriately regulated provider.",
  ],
  audienceLabel:
    "The platform primarily serves community clients, families, healthcare organisations, care homes, supported living providers, private healthcare services, and other organisations seeking access to verified healthcare professionals.",
} as const;
