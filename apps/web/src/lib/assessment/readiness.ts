/** Required coverage for the agreed twenty-question assessment. */
export function assessmentBankReady(common: number): boolean {
  return common >= 20;
}

export function roleAttemptReady(questions: readonly { country_code: string | null; professional_role_id: string | null }[]): boolean {
  return questions.length === 20 && questions.every(q => q.country_code === "PT" && !q.professional_role_id);
}
