import { LIGHT_DESCRIPTION, LIGHT_LABEL, type ComplianceLight } from "@/lib/compliance/traffic-light";

const STYLE: Record<ComplianceLight, { dot: string; text: string; bg: string }> = {
  green: { dot: "bg-[#24a148]", text: "text-[#0e6027]", bg: "bg-[#defbe6]" },
  amber: { dot: "bg-[#f1c21b]", text: "text-[#684e1b]", bg: "bg-[#fcf4d6]" },
  red: { dot: "bg-[#da1e28]", text: "text-[#a2191f]", bg: "bg-[#fff1f1]" },
  pending: { dot: "bg-[#9aa8a0]", text: "text-[#4a4a4a]", bg: "bg-[#f5f7f6]" },
};

/** Green / amber / red compliance status (client request, 7 Aug). The colour is
 *  never the only signal — the label carries the same meaning for anyone who
 *  cannot distinguish them. */
export function ComplianceLightBadge({
  light,
  showLabel = true,
}: {
  light: ComplianceLight;
  showLabel?: boolean;
}) {
  const style = STYLE[light];
  return (
    <span
      title={LIGHT_DESCRIPTION[light]}
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span aria-hidden className={`h-2 w-2 rounded-full ${style.dot}`} />
      {showLabel ? LIGHT_LABEL[light] : <span className="sr-only">{LIGHT_LABEL[light]}</span>}
    </span>
  );
}
