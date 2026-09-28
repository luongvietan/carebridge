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

/**
 * IBAN check (ISO 13616 mod-97). Portuguese professionals are paid by SEPA
 * transfer to an IBAN, not to a UK sort code and account number. A Portuguese
 * IBAN is exactly 25 characters (PT50 + 21 digits); any other country is only
 * checked for length and the check digits, since we cannot know every national
 * layout.
 */
export function isValidIban(value: string): boolean {
  const iban = value.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  if (iban.startsWith("PT") && !/^PT\d{23}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const digits = ch >= "A" ? String(ch.charCodeAt(0) - 55) : ch;
    for (const d of digits) remainder = (remainder * 10 + Number(d)) % 97;
  }
  return remainder === 1;
}

/**
 * The account a professional is paid into: a UK account, or an IBAN. The IBAN
 * is stored in the account-number slot and the sort-code slot carries the
 * literal "IBAN", so the encrypted columns and the last-four display work
 * unchanged for both.
 */
export type PayoutAccount =
  | { kind: "uk"; accountName: string; sortCode: string; accountNumber: string }
  | { kind: "iban"; accountName: string; iban: string };

export function validatePayoutAccount(
  input: PayoutAccount,
): { ok: true; normalised: BankDetails } | { ok: false; error: string } {
  if (input.kind === "uk") return validateBankDetails(input);

  const accountName = input.accountName.trim();
  if (accountName.length < 2) return { ok: false, error: "Enter the account holder's name." };
  if (!isValidIban(input.iban)) return { ok: false, error: "That IBAN is not valid. Check it and try again." };
  return {
    ok: true,
    normalised: {
      accountName,
      sortCode: "IBAN",
      accountNumber: input.iban.replace(/\s+/g, "").toUpperCase(),
    },
  };
}
