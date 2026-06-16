import { redirect } from "next/navigation";
import { GateForm } from "@/app/gate/gate-form";
import { getGateSecret, isGateEnabled } from "@/lib/auth/gate";

type GatePageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function GatePage({ searchParams }: GatePageProps) {
  if (!isGateEnabled()) {
    redirect("/");
  }

  const { next } = await searchParams;
  const configured = !!getGateSecret();

  return (
    <main className="flex min-h-screen flex-col justify-center bg-[#f5f7f6] px-5 py-12 sm:px-6">
      <div className="mx-auto w-full max-w-md rounded-[28px] bg-white px-6 py-10 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.12)] sm:px-10 sm:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#198038]">
          Private preview
        </p>
        <h1 className="mt-3 text-2xl font-bold text-[#0c4a35] sm:text-3xl">Access required</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#5b6a62]">
          CareBridge Connect is not open to the public yet. Enter the access code to continue.
        </p>
        {configured ? (
          <GateForm next={next} />
        ) : (
          <p className="mt-8 text-sm text-red-600">
            The access gate is enabled but no access code is configured. Set{" "}
            <code className="text-xs">PRODUCTION_GATE_SECRET</code> in the deployment environment.
          </p>
        )}
      </div>
    </main>
  );
}
