// Carbon-style step indicator for the professional onboarding wizard.
const STEPS = ["Eligibility", "Assessment", "Profile", "Documents"];

export function OnboardingSteps({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap gap-px border border-[#e0e0e0] bg-[#e0e0e0] text-sm">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const active = step === current;
        const done = step < current;
        return (
          <li
            key={label}
            className={`flex-1 px-4 py-3 ${
              active ? "bg-white font-semibold text-[#0f62fe]" : done ? "bg-white text-[#161616]" : "bg-[#f4f4f4] text-[#8c8c8c]"
            }`}
          >
            <span className="tabular-nums">{done ? "✓" : step}.</span> {label}
          </li>
        );
      })}
    </ol>
  );
}
