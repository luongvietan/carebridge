"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { selectMarket } from "@/lib/marketing/market-actions";
import type { Market } from "@/lib/marketing/market-server";

type Props = {
  markets: Market[];
  selected: string;
};

/**
 * The UK/Portugal switch on the homepage hero. A market is only clickable
 * while it is live; one that is not renders its "launching soon" badge and
 * refuses the click server-side as well (market-actions re-checks is_live).
 */
export function MarketSwitch({ markets, selected }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState(selected);

  async function choose(code: string, live: boolean) {
    if (!live || code === optimistic) return;
    setOptimistic(code);
    const result = await selectMarket(code);
    if (!result.ok) {
      setOptimistic(selected); // refused (not live after all) — snap back
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <ul className="mt-5 flex flex-wrap gap-2" aria-label="Countries we serve">
      {markets.map((market) => {
        const isActive = market.code === optimistic;
        const chip = (
          <>
            <span aria-hidden>{market.flag}</span>
            {market.name}
            {!market.live && (
              <span className="text-xs text-white/70">
                {" "}
                launching soon
              </span>
            )}
          </>
        );
        if (!market.live) {
          return (
            <li
              key={market.code}
              aria-disabled
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-white/25 bg-black/25 px-3.5 py-1.5 text-sm text-white opacity-80 backdrop-blur-sm"
            >
              {chip}
            </li>
          );
        }
        return (
          <li key={market.code}>
            <button
              type="button"
              onClick={() => choose(market.code, market.live)}
              disabled={pending}
              aria-pressed={isActive}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm backdrop-blur-sm transition-colors disabled:opacity-70 ${
                isActive
                  ? "border-[#6cc24a] bg-[#2e7d32]/60 font-semibold text-white"
                  : "border-white/25 bg-black/25 text-white hover:bg-black/40"
              }`}
            >
              {chip}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
