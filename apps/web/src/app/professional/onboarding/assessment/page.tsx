import { guardOnboardingStep } from "@/lib/onboarding/guard";
import { AssessmentRunner } from "./assessment-runner";

export default async function AssessmentPage() {
  await guardOnboardingStep("assessment");
  return <AssessmentRunner />;
}
