import Link from "next/link";
import { ArrowRight01Icon, Icon } from "@/components/ui/icon";

export type DashboardCard = {
  href: string;
  title: string;
  description: string;
  cta: string;
};

export function DashboardGrid({ cards }: { cards: DashboardCard[] }) {
  return (
    <div className="mt-8 grid gap-5 sm:grid-cols-2">
      {cards.map((card) => (
        <Link
          key={card.href}
          href={card.href}
          className="group flex flex-col rounded-[28px] border border-[#dbe7e0] bg-white p-6 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.12)] transition hover:-translate-y-0.5 hover:border-[#bcd8c7] hover:shadow-[0_12px_36px_-12px_rgba(15,38,28,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2e7d32]/30"
        >
          <h2 className="text-lg font-bold tracking-tight text-[#1e5a33] sm:text-xl">{card.title}</h2>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-[#4a4a4a]">{card.description}</p>
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2e7d32] transition-colors group-hover:text-[#246627]">
            {card.cta}
            <Icon
              icon={ArrowRight01Icon}
              size={16}
              strokeWidth={2}
              aria-hidden
              className="transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </Link>
      ))}
    </div>
  );
}
