import { ForwardLink } from "@/components/forward-link";
import { emergencyDisclaimer, importantInformation } from "@/data/marketing-copy";
import { marketingSection, marketingSurface } from "@/lib/marketing-ui";

/** Compact non-CQC / non-regulated notice, linking to the full /disclaimer page. */
export function ImportantInfoCallout() {
  return (
    <section className={`${marketingSection} pt-0`}>
      <div
        data-reveal
        className={`rounded-[28px] border-2 border-[#00a99d]/30 ${marketingSurface} p-6 sm:rounded-[32px] sm:p-8`}
      >
        <h2 className="text-lg font-bold text-[#1e5a33] sm:text-xl">
          {importantInformation.heading}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#4a4a4a]">
          {importantInformation.intro} {importantInformation.paragraphs[0]}
        </p>
        <p className="mt-4 max-w-3xl rounded-xl border border-[#f5c6cb] bg-[#fff5f5] px-4 py-3 text-sm font-medium leading-relaxed text-[#8b2e2e]">
          {emergencyDisclaimer}
        </p>
        <ForwardLink
          href="/disclaimer"
          className="mt-4 text-sm font-semibold text-[#007a73] hover:underline"
        >
          Read the full important information &amp; disclaimer
        </ForwardLink>
      </div>
    </section>
  );
}
