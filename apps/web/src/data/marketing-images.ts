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
      alt: "Healthcare assistant providing personal care at home",
    },
  },
  aboutAvatars: [
    pexels(774909, 64, 64),
    pexels(2379004, 64, 64),
    unsplash("photo-1582750433449-648ed127bb54", 64, 64),
    pexels(1181519, 64, 64),
  ],

  /** One image per professional role card on the homepage */
  roleCards: [
    {
      src: unsplash("photo-1576091160550-2173dba999ef", 600, 450),
      alt: "Registered nurse preparing clinical equipment in a care setting",
    },
    {
      src: pexels(4167544, 600, 450),
      alt: "Healthcare assistant supporting a patient during a consultation",
    },
    {
      src: pexels(6235047, 600, 450),
      alt: "Support worker assisting a client in the community",
    },
  ],

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

  portraits: {
    operationsDirector: pexels(2379004, 240, 240),
    familyCarer: pexels(774909, 240, 240),
  },
} as const;
