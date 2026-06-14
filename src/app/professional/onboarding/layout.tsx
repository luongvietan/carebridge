export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-sm tracking-wide text-[#525252] uppercase">Professional onboarding</p>
      <h1 className="mt-1 text-3xl font-light">Join CareBridge Connect</h1>
      <div className="mt-8">{children}</div>
    </main>
  );
}
