// Carbon-style step indicator for the professional onboarding wizard.
const STEPS = ["Eligibility", "Assessment", "Profile", "Documents"];

export function OnboardingSteps({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap gap-px border border-[#dbe7e0] bg-[#dbe7e0] text-sm">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const active = step === current;
        const done = step < current;
        return (
          <li
            key={label}
            className={`flex-1 px-4 py-3 ${
              active ? "bg-white font-semibold text-[#2e7d32]" : done ? "bg-white text-[#14301e]" : "bg-[#f5f7f6] text-[#7a8a81]"
            }`}
          >
            <span className="tabular-nums">{done ? "✓" : step}.</span> {label}
          </li>
        );
      })}
    </ol>
  );
}
