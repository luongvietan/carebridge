/** Required coverage for the agreed twenty-question assessment. */
export function assessmentBankReady(common: number, specialist: number, hasRole: boolean): boolean {
  return hasRole ? common >= 15 && specialist >= 5 : common >= 20;
}

export function roleAttemptReady(questions: readonly { country_code: string | null; professional_role_id: string | null }[], roleId: string): boolean {
  const common = questions.filter(q => q.country_code === "PT" && !q.professional_role_id).length;
  const specialist = questions.filter(q => q.country_code === "PT" && q.professional_role_id === roleId).length;
  return questions.length === 20 && assessmentBankReady(common, specialist, true);
}
