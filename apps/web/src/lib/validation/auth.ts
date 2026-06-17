import { z } from "zod";

const email = z.email();

// Self-serve roles only; organisation/admin accounts are provisioned by an admin later.
const accountTypes = ["professional", "private_client", "organisation"] as const;

export const registerSchema = z.object({
  email,
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2),
  accountType: z.enum(accountTypes),
  acceptedTerms: z.literal(true),
});
export type RegisterInput = z.infer<typeof registerSchema>;
