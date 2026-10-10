import { Tr } from "@/components/portal-locale";
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
          className="group flex flex-col rounded-[28px] border border-line bg-white p-6 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.12)] transition hover:-translate-y-0.5 hover:border-line-hover hover:shadow-[0_12px_36px_-12px_rgba(15,38,28,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-strong/30"
        >
          <h2 className="text-lg font-bold tracking-tight text-brand-ink sm:text-xl"><Tr>{card.title}</Tr></h2>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-ink"><Tr>{card.description}</Tr></p>
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-strong transition-colors group-hover:text-brand-strong-hover">
            <Tr>{card.cta}</Tr>
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
