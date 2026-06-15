export const faqs = [
  {
    question: "Is CareBridge Connect a CQC-registered care provider?",
    answer:
      "No. CareBridge Connect is a non-CQC regulated healthcare marketplace. It is not a domiciliary care agency and is not currently registered with the Care Quality Commission (CQC). It does not directly provide regulated personal care services. Support Workers and Healthcare Assistants provide non-regulated activities such as companionship, community access, appointment support, wellbeing support and respite sitting services.",
  },
  {
    question: "Is CareBridge Connect an emergency healthcare service?",
    answer:
      "No. CareBridge Connect is not an emergency healthcare service. In an emergency, contact emergency services (999) or attend your nearest Emergency Department.",
  },
  {
    question: "How are professionals verified?",
    answer:
      "Every professional completes eligibility screening, an online competency assessment and document uploads. Administrators review Enhanced DBS, Right to Work, professional registration (NMC/HCPC), indemnity insurance, mandatory training and references before approval.",
  },
  {
    question: "What happens if a document expires?",
    answer:
      "The platform automatically restricts a professional from accepting new bookings when a critical credential lapses — including DBS, registration, insurance, training or Right to Work. They can only accept bookings again after updated documents are uploaded and re-approved.",
  },
  {
    question: "How do booking requests work?",
    answer:
      "Private clients and organisations create booking requests by selecting the role required, date, time, shift duration and location. Verified professionals can accept open bookings, or an administrator can assign a compliant professional directly.",
  },
  {
    question: "Is there a competency assessment?",
    answer:
      "Yes. All professionals must pass an online assessment covering safeguarding, infection prevention, GDPR, medication awareness and role-specific knowledge. The pass mark is 80%, with a maximum of three attempts. Further attempts are locked for a review period after three failures.",
  },
  {
    question: "How are payments handled?",
    answer:
      "Client payments are collected securely via Stripe when a booking is confirmed. Professional payouts are recorded and managed within the platform, with full transaction history available to administrators.",
  },
  {
    question: "Can we export our data?",
    answer:
      "Yes. CareBridge Connect Ltd can export all platform data at any time — including professional, client and organisation profiles, bookings, compliance records, assessment results and payments — in CSV or Excel (XLSX) format.",
  },
] as const;
