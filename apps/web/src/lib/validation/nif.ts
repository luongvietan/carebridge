/**
 * Portuguese NIF (Número de Identificação Fiscal) — the one Portuguese
 * reference that can be validated on its face, because unlike a register or
 * authorisation number it carries an official mod-11 check digit. It is
 * therefore checked strictly, like the UK NI number, and not loosely like the
 * register references whose real-world formats we cannot know.
 *
 * Nine digits; the first identifies the holder type (1/2 individuals,
 * 5 companies, 6/8/9 other entities, 7 public entities); the ninth is
 * 11 − (weighted sum mod 11), or 0 when that remainder is under 2.
 */

export function isValidNif(value: string | null | undefined): boolean {
  const digits = (value ?? "").replace(/\s+/g, "");
  if (!/^[1256789]\d{8}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 8; i++) sum += Number(digits[i]) * (9 - i);
  const remainder = sum % 11;
  const checkDigit = remainder < 2 ? 0 : 11 - remainder;
  return checkDigit === Number(digits[8]);
}
