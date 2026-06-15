/** Legal and About page content supplied by CareBridge Connect Ltd. */

export type LegalSection = {
  title: string;
  intro?: string;
  paragraphs?: readonly string[];
  bullets?: readonly string[];
};

export const aboutContent = {
  welcome: {
    heading: "Welcome to CareBridge Connect",
    paragraphs: [
      "CareBridge Connect is a healthcare marketplace designed to connect community clients, families, healthcare organisations, care homes, supported living services, and other care providers with trusted healthcare professionals across the United Kingdom.",
      "Our platform aims to make healthcare support more accessible by creating a simple, transparent, and efficient way for clients and organisations to connect with qualified professionals.",
      "Whether you are seeking companionship, wellbeing support, post-hospital recovery assistance, overnight support, healthcare staffing solutions, or specialist healthcare expertise, CareBridge Connect helps bring the right people together.",
    ],
  },
  mission: {
    heading: "Our Mission",
    text: "To improve access to healthcare support by connecting individuals, families, and organisations with trusted healthcare professionals through a safe, innovative, and user-friendly platform.",
  },
  vision: {
    heading: "Our Vision",
    text: "To become a leading healthcare marketplace that empowers healthcare professionals with flexible work opportunities while helping communities access the support they need, when they need it.",
  },
  commitment: {
    heading: "Our Commitment",
    intro: "At CareBridge Connect, we are committed to:",
    bullets: [
      "Promoting professionalism, integrity, and accountability",
      "Creating a safe and transparent platform for clients and professionals",
      "Supporting healthcare professionals through flexible work opportunities",
      "Helping individuals, families, and organisations access reliable healthcare support",
      "Building trusted connections within local communities",
      "Continuously improving the way healthcare support is accessed and delivered",
    ],
  },
  verification: {
    heading: "Professional Verification",
    intro:
      "To promote safety and trust, professionals joining our platform undergo a verification process which may include:",
    bullets: [
      "Identity verification",
      "Right-to-work checks",
      "Enhanced DBS verification",
      "Professional registration checks, where applicable",
      "Qualification verification",
      "Reference checks",
      "Mandatory training compliance",
    ],
  },
  importantInfo: {
    heading: "Important Information",
    paragraphs: [
      "CareBridge Connect is a non-CQC regulated healthcare marketplace.",
      "We do not directly provide regulated personal care services, nursing services, treatment, or care. Instead, we facilitate introductions and bookings between clients and independent healthcare professionals who operate in their own professional capacity.",
      "CareBridge Connect is not a domiciliary care agency and is not currently registered with the Care Quality Commission (CQC).",
      "Our platform primarily serves community clients, families, healthcare organisations, care homes, supported living providers, private healthcare services, and other organisations seeking access to healthcare professionals.",
      "All professionals using the platform are responsible for working within their training, competence, professional standards, and scope of practice.",
      "Support Workers and Healthcare Assistants using the CareBridge Connect platform are not permitted to provide regulated personal care services on behalf of CareBridge Connect.",
      "However, Support Workers and Healthcare Assistants may provide personal care when working directly for, or under the direction of, an appropriately CQC-regulated organisation, such as a care home, domiciliary care agency, supported living provider, or healthcare organisation, where such duties form part of their authorised role.",
      "Where regulated care services are required, clients should seek support from an appropriately regulated provider.",
    ],
  },
  founder: {
    heading: "A Message From Our Founder",
    quote:
      "CareBridge Connect was inspired by a simple belief: accessing healthcare support should be easier, more transparent, and more flexible for everyone involved.\n\nAs a Registered Nurse and family caregiver, I have experienced both the professional and personal challenges of navigating healthcare services. These experiences highlighted the need for a platform that brings together trusted professionals and those seeking support in a way that is simple, safe, and accessible.\n\nOur goal is to create meaningful connections, empower healthcare professionals, and help individuals, families, and organisations access the support they need with confidence.",
    name: "Ana Dos Santos",
    title: "Founder & Director",
    company: "CareBridge Connect Ltd",
    tagline: "Connecting Care. Empowering Professionals. Supporting Communities.",
  },
} as const;

export const clientTerms: { title: string; sections: readonly LegalSection[] } = {
  title: "CareBridge Connect – Client Terms & Conditions",
  sections: [
    {
      title: "1. Introduction",
      paragraphs: [
        "These Terms and Conditions govern the use of the CareBridge Connect platform by clients seeking healthcare support services.",
        "By creating an account, accessing, or using the platform, you agree to comply with these Terms and Conditions.",
      ],
    },
    {
      title: "2. About CareBridge Connect",
      paragraphs: [
        "CareBridge Connect is a non-CQC regulated healthcare marketplace that connects clients with independent healthcare professionals.",
        "CareBridge Connect does not directly provide care, treatment, nursing services, personal care, or healthcare services.",
      ],
    },
    {
      title: "3. Client Responsibilities",
      intro: "Clients agree to:",
      bullets: [
        "Provide accurate and truthful information.",
        "Treat professionals with dignity and respect.",
        "Provide a safe working environment.",
        "Disclose relevant information necessary for the professional to perform their role safely.",
        "Comply with all applicable laws and regulations.",
      ],
    },
    {
      title: "4. Bookings and Payments",
      bullets: [
        "All bookings must be made through the platform.",
        "Payment must be made before services commence.",
        "CareBridge Connect may charge platform fees.",
        "Payments are processed through approved payment providers.",
      ],
    },
    {
      title: "5. Cancellations",
      paragraphs: [
        "Clients must provide reasonable notice when cancelling bookings.",
        "Cancellation fees may apply in accordance with the cancellation policy displayed on the platform.",
      ],
    },
    {
      title: "6. Professional Relationship",
      paragraphs: [
        "Clients acknowledge that professionals using the platform are independent contractors and are not employees, agents, or representatives of CareBridge Connect.",
      ],
    },
    {
      title: "7. Complaints and Concerns",
      paragraphs: [
        "Clients should report concerns, incidents, safeguarding matters, or complaints through the platform immediately.",
      ],
    },
    {
      title: "8. Limitation of Liability",
      paragraphs: [
        "CareBridge Connect acts solely as a marketplace facilitating introductions between clients and professionals.",
        "CareBridge Connect is not responsible for the actions, omissions, decisions, or conduct of independent professionals.",
      ],
    },
    {
      title: "9. Suspension and Termination",
      paragraphs: [
        "CareBridge Connect reserves the right to suspend or terminate accounts where users breach these Terms and Conditions.",
      ],
    },
    {
      title: "10. Privacy",
      paragraphs: [
        "Personal information will be processed in accordance with our Privacy Policy.",
      ],
    },
  ],
};

export const professionalTerms: { title: string; sections: readonly LegalSection[] } = {
  title: "CareBridge Connect – Professional Terms & Conditions",
  sections: [
    {
      title: "1. Introduction",
      paragraphs: [
        "These Terms and Conditions govern the use of the CareBridge Connect platform by healthcare professionals.",
        "By registering and using the platform, professionals agree to comply with these Terms and Conditions.",
        "CareBridge Connect is committed to promoting safety, safeguarding, professionalism, and high standards of practice. The safety and wellbeing of clients, professionals, and the wider community are our highest priorities.",
      ],
    },
    {
      title: "2. Independent Professional Status",
      paragraphs: [
        "Professionals acknowledge that they are self-employed independent contractors and are not employees, workers, agents, or representatives of CareBridge Connect.",
        "Professionals remain responsible for their own tax affairs, National Insurance contributions, pensions, insurance arrangements, professional registrations, and legal obligations.",
      ],
    },
    {
      title: "3. Eligibility Requirements",
      intro: "Professionals must:",
      bullets: [
        "Be legally entitled to work in the United Kingdom.",
        "Provide accurate, complete, and truthful information at all times.",
        "Maintain all qualifications, registrations, licences, and certifications required for their role.",
        "Maintain an Enhanced DBS certificate where applicable.",
        "Keep mandatory training up to date.",
        "Notify CareBridge Connect immediately of any change that may affect their suitability to provide services.",
      ],
    },
    {
      title: "4. Professional Conduct",
      intro: "Professionals must:",
      bullets: [
        "Prioritise the safety, wellbeing, dignity, and rights of clients at all times.",
        "Act professionally, respectfully, and ethically.",
        "Work within their competence, qualifications, and scope of practice.",
        "Comply with relevant professional standards, codes of conduct, and legislation.",
        "Maintain professional boundaries.",
        "Respect confidentiality and privacy.",
        "Report safeguarding concerns, incidents, accidents, or risks appropriately and without delay.",
      ],
    },
    {
      title: "5. Professional Compliance",
      paragraphs: [
        "Professionals are responsible for ensuring that all registrations, licences, DBS certificates, training, qualifications, and insurance remain valid throughout their use of the platform.",
        "Failure to maintain compliance may result in immediate suspension pending review.",
      ],
    },
    {
      title: "6. Platform Verification",
      paragraphs: [
        "To promote safety and quality, CareBridge Connect reserves the right to conduct verification checks, request additional documentation, carry out competency assessments, and refuse, suspend, or withdraw approval at its discretion.",
        "Verification approval may be reviewed at any time.",
      ],
    },
    {
      title: "7. Bookings and Payments",
      intro: "Professionals agree to:",
      bullets: [
        "Accept only those bookings they are able to fulfil safely, competently, and reliably.",
        "Arrive on time and fit to work.",
        "Deliver services in accordance with professional standards and client requirements.",
        "Communicate promptly regarding any concerns affecting a booking.",
        "Comply with payment arrangements set out by the platform.",
      ],
    },
    {
      title: "8. Safety, Safeguarding and Quality Assurance",
      intro: "Safety is the highest priority of CareBridge Connect. Professionals must:",
      bullets: [
        "Take all reasonable steps to protect the health, safety, and wellbeing of clients.",
        "Follow safeguarding procedures and applicable legislation.",
        "Report incidents, accidents, near misses, concerns, complaints, and safeguarding matters promptly.",
        "Cooperate with investigations undertaken by CareBridge Connect or relevant authorities.",
      ],
      paragraphs: [
        "Any action or omission that places a client, organisation, professional, or member of the public at risk may result in immediate suspension from the platform.",
      ],
    },
    {
      title: "9. Cancellations and Reliability",
      intro:
        "Professionals are expected to honour all accepted bookings. Repeated cancellations, failure to attend bookings, poor conduct, safeguarding concerns, unsafe practice, non-compliance, dishonesty, or professional misconduct may result in:",
      bullets: [
        "Temporary suspension",
        "Restricted access to bookings",
        "Reduced platform visibility",
        "Permanent removal from the platform",
        "Account termination",
      ],
    },
    {
      title: "10. Non-CQC Platform",
      paragraphs: [
        "Professionals acknowledge that CareBridge Connect is a non-CQC regulated healthcare marketplace and does not directly provide regulated care services.",
        "CareBridge Connect facilitates introductions and bookings between clients and independent professionals.",
        "Support Workers and Healthcare Assistants are not permitted to provide regulated personal care services on behalf of CareBridge Connect.",
        "However, Support Workers and Healthcare Assistants may undertake personal care duties when working directly for, or under the direction of, an appropriately CQC-regulated organisation, such as a care home, domiciliary care provider, supported living service, or healthcare organisation, where such duties form part of their authorised role.",
      ],
    },
    {
      title: "11. Insurance",
      paragraphs: [
        "Professionals are responsible for maintaining appropriate insurance cover relevant to their role, including professional indemnity insurance and public liability insurance where applicable.",
        "Evidence of insurance may be requested at any time.",
      ],
    },
    {
      title: "12. Suspension and Termination",
      intro:
        "CareBridge Connect reserves the right to suspend, restrict, investigate, or terminate access to the platform where there are concerns relating to:",
      bullets: [
        "Safety",
        "Safeguarding",
        "Professional conduct",
        "Compliance",
        "Reliability",
        "Fraud",
        "Dishonesty",
        "Breaches of these Terms and Conditions",
      ],
      paragraphs: [
        "Immediate suspension may occur where there is a potential risk to clients or the public.",
      ],
    },
    {
      title: "13. Confidentiality",
      paragraphs: [
        "Professionals must not disclose, misuse, copy, or share confidential client, organisational, or business information obtained through the platform except where legally required or necessary to protect safety.",
      ],
    },
    {
      title: "14. Intellectual Property",
      paragraphs: [
        "All platform content, branding, logos, systems, processes, policies, documentation, and materials remain the intellectual property of CareBridge Connect Ltd.",
      ],
    },
    {
      title: "15. Privacy and Data Protection",
      paragraphs: [
        "Professionals agree to comply with UK GDPR, the Data Protection Act 2018, and all applicable data protection legislation.",
        "Professionals must handle personal information lawfully, securely, and confidentially at all times.",
      ],
    },
  ],
};
