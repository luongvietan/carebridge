/**
 * Consumer information Portuguese law requires a website selling services to
 * consumers to show: a visible link to the Livro de Reclamações Eletrónico
 * (Decreto-Lei n.º 156/2005, as amended by DL 74/2017) and the alternative
 * dispute-resolution (RAL) entity the business uses (Lei n.º 144/2015, art. 18).
 *
 * Ana has not yet chosen the RAL entity, so it is configured rather than
 * hard-coded: set NEXT_PUBLIC_PT_RAL_NAME (and NEXT_PUBLIC_PT_RAL_URL) in
 * Vercel. Until then the footer points to the official list of entities on the
 * Portal do Consumidor.
 */

export const LIVRO_RECLAMACOES_URL = "https://www.livroreclamacoes.pt/Inicio/";
export const PORTAL_CONSUMIDOR_URL = "https://www.consumidor.gov.pt/";

export type ConsumerInfo = {
  complaintsBook: { label: string; href: string };
  disputeResolution: { text: string; linkLabel: string; href: string };
};

export function portugueseConsumerInfo(ral: {
  name?: string | null;
  url?: string | null;
}): ConsumerInfo {
  const name = ral.name?.trim();
  const url = ral.url?.trim();
  return {
    complaintsBook: { label: "Livro de Reclamações Eletrónico", href: LIVRO_RECLAMACOES_URL },
    disputeResolution: name
      ? {
          text: `Em caso de litígio de consumo, o consumidor pode recorrer à entidade de resolução alternativa de litígios ${name}.`,
          linkLabel: url ? url.replace(/^https?:\/\//, "").replace(/\/$/, "") : "www.consumidor.gov.pt",
          href: url || PORTAL_CONSUMIDOR_URL,
        }
      : {
          text: "Em caso de litígio de consumo, o consumidor pode recorrer a uma entidade de resolução alternativa de litígios de consumo. A lista de entidades está disponível no Portal do Consumidor.",
          linkLabel: "www.consumidor.gov.pt",
          href: PORTAL_CONSUMIDOR_URL,
        },
  };
}

/** What the footer shows for a market: Portugal only; the UK has no equivalent requirement here. */
export function consumerInfoForLocale(locale: "en-GB" | "pt-PT"): ConsumerInfo | null {
  if (locale !== "pt-PT") return null;
  return portugueseConsumerInfo({
    name: process.env.NEXT_PUBLIC_PT_RAL_NAME,
    url: process.env.NEXT_PUBLIC_PT_RAL_URL,
  });
}
