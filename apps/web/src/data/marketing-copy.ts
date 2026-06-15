/** Public marketing copy aligned with CareBridge Connect MVP Overview.pdf */

import { marketingImages } from "./marketing-images";

export const siteTagline =
  "A secure, compliant healthcare marketplace connecting verified professionals with private clients and organisations.";

export const professionalRoles = [
  {
    title: "Registered Nurses",
    description:
      "NMC-registered nurses providing clinical care, medication management and assessments within their professional scope of practice, subject to verification and compliance requirements.",
  },
  {
    title: "Healthcare Assistants",
    description:
      "Experienced HCAs providing companionship, wellbeing support, sitting services and appointment or community support — non-regulated activities only.",
  },
  {
    title: "Support Workers",
    description:
      "Trained support workers providing companionship, community support, chaperoning and respite support — non-regulated activities only.",
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
  "CareBridge Connect is a healthcare marketplace and is not a CQC-registered provider. It does not provide regulated personal care services.";

/** Non-regulated services available through the platform. */
export const supportedServices = [
  "Companionship",
  "Wellbeing support",
  "Sitting services",
  "Hospital discharge support",
  "Community support",
  "Chaperoning",
  "Appointment support",
  "Respite support",
] as const;

/** Full "Important information" disclaimer used on the /disclaimer page and inline callouts. */
export const importantInformation = {
  heading: "Important information",
  intro:
    "CareBridge Connect is a healthcare marketplace connecting clients and organisations with independent healthcare professionals.",
  paragraphs: [
    "CareBridge Connect is not currently a CQC-registered provider and does not provide regulated personal care services.",
    "Healthcare Assistants (HCAs) and Support Workers engaged through the platform must not provide regulated personal care services through CareBridge Connect. Their services are limited to companionship, wellbeing support, sitting services, hospital discharge support, community support, chaperoning, appointment support, respite support and other non-regulated activities.",
    "Registered Nurses and other appropriately qualified healthcare professionals may provide services that fall within their professional scope of practice, subject to verification and compliance requirements.",
  ],
  audienceLabel:
    "The platform is intended for private clients, healthcare organisations, supported living services, care providers and healthcare facilities seeking access to verified healthcare professionals.",
} as const;
