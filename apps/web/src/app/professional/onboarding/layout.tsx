export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">Join CareBridge Connect</h1>
      <div className="mt-8">{children}</div>
    </main>
  );
}
