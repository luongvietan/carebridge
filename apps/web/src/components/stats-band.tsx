import { stats } from "@/data/marketing-copy";
import { marketingCard, marketingSectionShell } from "@/lib/marketing-ui";

export function StatsBand() {
  return (
    <section className={marketingSectionShell}>
      <div className={`relative mx-auto max-w-7xl overflow-hidden ${marketingCard}`}>
        <div className="absolute inset-0 bg-[#1a5c3a]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a7048]/80 via-[#1a5c3a] to-[#0c3a25]" />
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#7ed7a0]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-12 h-72 w-72 rounded-full bg-black/20 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative px-6 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
          <div
            data-reveal-stagger
            className="grid grid-cols-2 divide-x divide-y divide-white/15 sm:grid-cols-4 sm:divide-y-0"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                data-reveal-child
                className="flex flex-col items-center justify-center px-4 py-6 text-center sm:py-2"
              >
                <p className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
                  {stat.value}
                </p>
                <p className="mt-2 max-w-[9rem] text-sm leading-snug text-white/75 sm:text-[15px]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs leading-relaxed text-white/60 sm:text-sm">
            Built for operational control — full audit trails, automatic compliance alerts and
            data export for CareBridge Connect Ltd at any time.
          </p>
        </div>
      </div>
    </section>
  );
}
