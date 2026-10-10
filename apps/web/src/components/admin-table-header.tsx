import type { ReactNode } from "react";

export function AdminTableHeader({ children }: { children: ReactNode }) {
  return <thead className="border-b border-line bg-surface text-left text-ink">{children}</thead>;
}
