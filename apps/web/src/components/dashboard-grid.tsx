import Link from "next/link";

export type DashboardCard = {
  href: string;
  title: string;
  description: string;
  cta: string;
};

export function DashboardGrid({ cards }: { cards: DashboardCard[] }) {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      {cards.map((card) => (
        <Link
          key={card.href}
          href={card.href}
          className="group border border-[#e0e0e0] p-5 transition-colors hover:border-[#198038] hover:bg-[#f4f4f4]"
        >
          <h2 className="text-lg font-light text-[#161616] group-hover:text-[#198038]">{card.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#525252]">{card.description}</p>
          <span className="mt-4 inline-block text-sm font-medium text-[#198038]">{card.cta} →</span>
        </Link>
      ))}
    </div>
  );
}
