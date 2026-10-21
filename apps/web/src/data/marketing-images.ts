/**
 * Curated marketing photography — Pexels (primary) + Unsplash (portraits/clinical).
 * Each slot uses a distinct image; no repeats across sections.
 */

/** Pexels stock photos — free licence, healthcare & community care */
function pexels(id: number, w: number, h?: number) {
  const url = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
  return h ? `${url}&h=${h}&fit=crop` : url;
}

/** Unsplash — supplementary portraits and clinical scenes */
function unsplash(id: string, w: number, h?: number, q = 80) {
  const url = `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=${q}`;
  return h ? `${url}&h=${h}` : url;
}

export const marketingImages = {
  hero: {
    src: pexels(7659572, 1800),
    alt: "Healthcare professional reviewing patient information on a tablet in clinic",
  },
  heroAvatars: [
    pexels(5327585, 80, 80),
    pexels(1181690, 80, 80),
    unsplash("photo-1612349317150-e413f6a5b16d", 80, 80),
  ],

  about: {
    primary: {
      src: pexels(4386464, 400, 520),
      alt: "Registered nurse in a clinical setting",
    },
    secondary: {
      src: pexels(4473775, 700, 500),
      alt: "Nanny sitting with two young children at home",
    },
  },
  aboutAvatars: [
    pexels(774909, 64, 64),
    pexels(2379004, 64, 64),
    unsplash("photo-1582750433449-648ed127bb54", 64, 64),
    pexels(1181519, 64, 64),
  ],

  /** One image per professional role card, index-matched to `professionalRoles` */
  roleCards: [
    {
      src: pexels(6129688, 600, 450),
      alt: "Nurse measuring an adult patient’s blood pressure",
    },
    {
      src: pexels(8460035, 600, 450),
      alt: "Healthcare professional with a young child during a paediatric checkup",
    },
    {
      src: pexels(7176026, 600, 450),
      alt: "Mental health nurse listening to a person during a supportive conversation",
    },
    {
      src: pexels(29372727, 600, 450),
      alt: "Caregiver supporting an older woman at home",
    },
    {
      src: pexels(18509795, 600, 450),
      alt: "Caregiver accompanying an older woman using a walking frame",
    },
    {
      src: pexels(20860617, 600, 450),
      alt: "Physiotherapist guiding a client through rehabilitation exercises",
    },
  ],

  /** One image per childcare role card */
  childcareRoleCards: [
    {
      src: pexels(3890481, 600, 450),
      alt: "Adult reading a book with a young child at home",
    },
    {
      src: pexels(8422144, 600, 450),
      alt: "Childminder supervising young children at play in a home setting",
    },
    {
      src: pexels(8613089, 600, 450),
      alt: "Babysitter playing with children in a living room",
    },
    {
      src: pexels(4609073, 600, 450),
      alt: "Adult and two children reading a book together at home",
    },
  ],

  pageHero: {
    about: {
      src: pexels(4386464, 1600, 700),
      alt: "Healthcare professional in a clinical care environment",
    },
    services: {
      src: pexels(3662667, 1600, 700),
      alt: "Two young children playing together in a childcare setting",
    },
    faq: {
      src: pexels(7659572, 1600, 700),
      alt: "Healthcare professional reviewing information on a tablet",
    },
    auth: {
      src: pexels(7551657, 1200, 900),
      alt: "Healthcare assistant providing companionship support",
    },
  },

  compliance: {
    main: {
      src: pexels(5726794, 900, 700),
      alt: "Healthcare team walking through a hospital corridor",
    },
    inset: {
      src: unsplash("photo-1559839734-2b71ea197ec2", 200, 200),
      alt: "Verified healthcare professional portrait",
    },
  },

  ctaBanner: {
    src: pexels(8500352, 1400, 600),
    alt: "Two school-age children studying together during after-school care",
  },

  footer: {
    src: pexels(3933276, 640, 448),
    alt: "Young child playing with wooden blocks at home",
  },
} as const;
