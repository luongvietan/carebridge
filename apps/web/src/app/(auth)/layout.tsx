import type { ReactNode } from "react";
import { SiteNav } from "@/components/site-nav";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteNav />
      {children}
    </>
  );
}
