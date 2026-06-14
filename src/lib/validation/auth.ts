import { z } from "zod";

// Self-serve roles only; organisation/admin accounts are provisioned by an admin later.
export const accountTypes = ["professional", "private_client", "organisation"] as const;

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2),
  accountType: z.enum(accountTypes),
  acceptedTerms: z.literal(true),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const resetSchema = z.object({
  email: z.string().email(),
});
