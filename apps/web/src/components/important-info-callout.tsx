import Link from "next/link";
import { importantInformation } from "@/data/marketing-copy";
import { marketingSection, marketingSurface } from "@/lib/marketing-ui";

/** Compact non-CQC / non-regulated notice, linking to the full /disclaimer page. */
export function ImportantInfoCallout() {
  return (
    <section className={`${marketingSection} pt-0`}>
      <div
        data-reveal
        className={`rounded-[28px] ${marketingSurface} p-6 sm:rounded-[32px] sm:p-8`}
      >
        <h2 className="text-lg font-bold text-[#0c4a35] sm:text-xl">
          {importantInformation.heading}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#5b6a62]">
          {importantInformation.intro} {importantInformation.paragraphs[0]}
        </p>
        <Link
          href="/disclaimer"
          className="mt-4 inline-block text-sm font-semibold text-[#0c6e4f] hover:underline"
        >
          Read the full important information &amp; disclaimer →
        </Link>
      </div>
    </section>
  );
}
