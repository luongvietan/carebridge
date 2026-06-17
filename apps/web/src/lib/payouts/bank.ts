export type BankDetails = { accountName: string; sortCode: string; accountNumber: string };

/**
 * Validate and normalise UK bank details before they are encrypted and stored.
 * A UK sort code is 6 digits and an account number is 8 digits; separators
 * (spaces/dashes) are stripped so the stored value is consistent. Without this,
 * a malformed account number is accepted and only fails at bank-transfer time.
 */
export function validateBankDetails(
  input: BankDetails,
): { ok: true; normalised: BankDetails } | { ok: false; error: string } {
  const accountName = input.accountName.trim();
  if (accountName.length < 2) return { ok: false, error: "Enter the account holder's name." };

  const sortCode = input.sortCode.replace(/\D/g, "");
  if (sortCode.length !== 6) return { ok: false, error: "Sort code must be 6 digits." };

  const accountNumber = input.accountNumber.replace(/\D/g, "");
  if (accountNumber.length !== 8) return { ok: false, error: "Account number must be 8 digits." };

  return { ok: true, normalised: { accountName, sortCode, accountNumber } };
}
