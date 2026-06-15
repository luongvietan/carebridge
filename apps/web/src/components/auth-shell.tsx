import Image from "next/image";
import type { ReactNode } from "react";
import { BackLink } from "@/components/back-link";
import { SiteFooter } from "@/components/site-footer";
import { marketingImages } from "@/data/marketing-images";
import { marketingCard } from "@/lib/marketing-ui";

type AuthShellProps = {
  children: ReactNode;
  wide?: boolean;
};

export function AuthShell({ children, wide = false }: AuthShellProps) {
  const { auth } = marketingImages.pageHero;

  return (
    <>
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div
          className={`grid overflow-hidden ${marketingCard} bg-white shadow-[0_8px_30px_-12px_rgba(15,38,28,0.12)] lg:grid-cols-2`}
        >
          <div className="relative hidden min-h-[520px] lg:block">
            <Image
              src={auth.src}
              alt={auth.alt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 0px, 640px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />
            <div className="absolute inset-0 flex flex-col justify-end p-10">
              <BackLink href="/" className="text-white/70 hover:text-white">
                Back to home
              </BackLink>
              <p className="mt-6 text-2xl font-bold leading-tight text-white">
                Verified healthcare staffing, built on trust
              </p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/75">
                Join as a verified professional or create booking requests as a private client or
                organisation.
              </p>
            </div>
          </div>

          <div className={`flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 ${wide ? "" : "lg:px-12"}`}>
            {children}
          </div>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
