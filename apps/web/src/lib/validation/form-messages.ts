import { z } from "zod";

/** Name the fields that failed validation rather than a generic catch-all. */
export function validationMessage(error: z.ZodError, labels: Record<string, string>): string {
  const parts = [
    ...new Set(
      error.issues.map((issue) => {
        const key = String(issue.path[0] ?? "");
        const label = labels[key] ?? key;
        if (issue.code === "custom" || issue.code === "invalid_format") {
          return issue.message.includes(label) ? issue.message : `${label}: ${issue.message}`;
        }
        return label;
      }),
    ),
  ];
  return parts.length
    ? `Please check these fields: ${parts.join(", ")}.`
    : "Please complete the required fields.";
}
