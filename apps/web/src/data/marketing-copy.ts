/** Public marketing copy aligned with CareBridge Connect MVP Overview.pdf */

import { marketingImages } from "./marketing-images";

export const siteTagline =
  "A secure, compliant healthcare marketplace connecting verified professionals with private clients and organisations.";

export const heroHeadline =
  "Connecting Clients and Organisations with Verified Healthcare Professionals within the Communities.";

export const heroSubheadline =
  "A healthcare marketplace — verified nurses, healthcare assistants, support workers and physiotherapists, screened, assessed and continuously monitored for compliance.";

export const professionalRoles = [
  {
    title: "Registered Nurses",
    description:
      "NMC-registered nurses providing clinical care, medication management and assessments within their professional scope of practice, subject to verification and compliance requirements.",
  },
  {
    title: "Healthcare Assistants",
    description:
      "Experienced HCAs providing companionship, wellbeing support, appointment and community access, sitting services and other non-regulated support activities. They do not provide regulated personal care services through CareBridge Connect.",
  },
  {
    title: "Support Workers",
    description:
      "Support Workers provide companionship, community access, appointment support, wellbeing support, respite sitting services and other non-regulated support activities.",
  },
  {
    title: "Physiotherapists",
    description:
      "HCPC-registered physiotherapists for rehabilitation and mobility programmes within their professional scope of practice.",
  },
] as const;

export const stats = [
  { value: "100%", label: "Verified before first booking" },
  { value: "4", label: "Professional roles" },
  { value: "80%", label: "Competency pass mark" },
  { value: "CSV / XLSX", label: "Full data export anytime" },
] as const;

export const onboardingSteps = [
  {
    title: "Register & verify",
    description:
      "Professionals complete eligibility screening, an online competency assessment (80% pass, up to three attempts) and document uploads — all reviewed by administrators.",
  },
  {
    title: "Request or match",
    description:
      "Clients and organisations create booking requests by role, date, time and location. Verified professionals accept open bookings, or administrators assign directly.",
  },
  {
    title: "Book with confidence",
    description:
      "Compliance is enforced when a booking is accepted or assigned. Expired credentials automatically restrict new bookings until re-approved.",
  },
] as const;

export const complianceFeatures = [
  {
    title: "Why clients trust us",
    bullets: [
      "Every professional passes eligibility screening, competency assessment and document verification before approval.",
      "Enhanced DBS, Right to Work, professional registration (NMC/HCPC), indemnity insurance and mandatory training are tracked continuously.",
    ],
  },
  {
    title: "Personalised staffing programmes",
    bullets: [
      "Booking requests matched across four roles — nurses, HCAs, support workers and physiotherapists.",
      "Flexible cover for private clients, healthcare organisations, supported living services, care providers and healthcare facilities.",
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

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  featured?: boolean;
  photo?: string;
};

export const testimonialsSection = {
  heading: "Trusted by clients and professionals",
  subheading:
    "From care homes to private families — organisations and professionals rely on CareBridge Connect for verified staffing and continuous compliance.",
} as const;

export const testimonials: Testimonial[] = [
  {
    quote:
      "The verification gave us total peace of mind — every professional was DBS-checked and registered before they set foot on site.",
    name: "Sarah Mitchell",
    role: "Care Home Manager",
  },
  {
    quote:
      "We needed cover at short notice and CareBridge matched us with qualified staff within hours. Compliance was already handled — no chasing paperwork.",
    name: "James Okonkwo",
    role: "Operations Director",
    featured: true,
    photo: marketingImages.portraits.operationsDirector,
  },
  {
    quote:
      "Creating a booking request for a physiotherapist took minutes and the compliance was already handled. Exactly what we needed for my father's recovery.",
    name: "Emma Richardson",
    role: "Private Client",
  },
  {
    quote:
      "As a nurse, onboarding was clear and quick. I was matched to suitable shifts almost immediately after passing verification.",
    name: "Priya Sharma",
    role: "Registered Nurse",
  },
  {
    quote:
      "Document tracking and auto-restriction when credentials lapse means we never worry about placing non-compliant staff on shifts.",
    name: "David Chen",
    role: "HR Manager",
  },
  {
    quote:
      "Finding trusted, verified carers for my mother felt overwhelming until we found CareBridge. The whole process was straightforward and reassuring.",
    name: "Helen Brooks",
    role: "Family Carer",
    featured: true,
    photo: marketingImages.portraits.familyCarer,
  },
];

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
