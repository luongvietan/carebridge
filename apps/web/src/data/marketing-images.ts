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
      src: pexels(7551657, 700, 500),
      alt: "Healthcare assistant providing companionship and wellbeing support",
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
      src: unsplash("photo-1576091160550-2173dba999ef", 600, 450),
      alt: "Adult nurse preparing clinical equipment in a care setting",
    },
    {
      src: pexels(3985163, 600, 450),
      alt: "Children's nurse caring for a young child",
    },
    {
      src: pexels(7176026, 600, 450),
      alt: "Mental health nurse listening to a person during a supportive conversation",
    },
    {
      src: pexels(4167544, 600, 450),
      alt: "Healthcare assistant supporting a patient during a consultation",
    },
    {
      src: pexels(6235047, 600, 450),
      alt: "Support worker assisting a client in the community",
    },
    {
      src: pexels(5215024, 600, 450),
      alt: "Physiotherapist guiding a client through rehabilitation exercises",
    },
  ],

  /** One image per childcare role card */
  childcareRoleCards: [
    {
      src: pexels(3661264, 600, 450),
      alt: "Nanny reading a book with a young child at home",
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
      src: pexels(4145153, 600, 450),
      alt: "Parent and helper caring for a child together at home",
    },
  ],

  pageHero: {
    about: {
      src: pexels(4386464, 1600, 700),
      alt: "Healthcare professional in a clinical care environment",
    },
    services: {
      src: unsplash("photo-1576091160550-2173dba999ef", 1600, 700),
      alt: "Registered nurse in a care setting",
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
    src: pexels(5215024, 1400, 600),
    alt: "Physiotherapist guiding a client through rehabilitation exercises",
  },

  footer: {
    src: pexels(8376232, 640, 448),
    alt: "Care professional visiting a client at home",
  },
} as const;
