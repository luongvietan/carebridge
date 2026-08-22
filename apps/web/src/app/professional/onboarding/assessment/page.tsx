import { guardOnboardingStep } from "@/lib/onboarding/guard";
import { AssessmentRunner } from "./assessment-runner";

export default async function AssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  await guardOnboardingStep("assessment");
  // `?role=` comes from the roles page, where a professional picks which of
  // their roles to sit next. Omitted during first onboarding, where there is
  // only ever one.
  const { role } = await searchParams;
  return <AssessmentRunner roleId={role} />;
}
