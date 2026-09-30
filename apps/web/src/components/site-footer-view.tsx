"use client";

import Image from "next/image";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site";
import { marketingImages } from "@/data/marketing-images";
import {
  ArrowUp01Icon,
  Call02Icon,
  Facebook01Icon,
  Icon,
  InstagramIcon,
  Linkedin01Icon,
  Location01Icon,
  Mail01Icon,
  NewTwitterIcon,
} from "@/components/ui/icon";
import type { IconSvgElement } from "@hugeicons/react";

const FOOTER_IMAGE = marketingImages.footer;

const socialLinks: { label: string; href: string; icon: IconSvgElement }[] = [
  { label: "X", href: "#", icon: NewTwitterIcon },
  { label: "LinkedIn", href: "#", icon: Linkedin01Icon },
  { label: "Instagram", href: "#", icon: InstagramIcon },
  { label: "Facebook", href: "#", icon: Facebook01Icon },
];

export type FooterLabels = {
  contactTitle: string;
  socialTitle: string;
  socialBody: string;
  terms: string;
  importantInfo: string;
  privacy: string;
  home: string;
  services: string;
  faq: string;
  support: string;
  backToTop: string;
  rights: string;
  address: string;
  phone: string;
};

export function SiteFooterView({
  labels,
  regulatoryDisclaimer,
  emergencyDisclaimer,
}: {
  labels: FooterLabels;
  regulatoryDisclaimer: string;
  emergencyDisclaimer: string;
}) {
  const contactItems = [
    { label: labels.address, icon: Location01Icon },
    { label: labels.phone, icon: Call02Icon },
    { label: CONTACT_EMAIL, icon: Mail01Icon },
  ];
  const navPills = [
    { href: "/", label: labels.home },
    { href: "/services", label: labels.services },
    { href: "/faq", label: labels.faq },
    { href: "/contact", label: labels.support },
  ];
  return (
    <footer className="mt-24 bg-gradient-to-r from-[#0a2c1d] via-[#0f3d28] to-[#1a5238] text-[#cfe3d6]">
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">{labels.contactTitle}</h2>
            <ul className="mt-8 space-y-4">
              {contactItems.map((item) => (
                <li key={item.label} className="flex items-center gap-3 text-sm sm:text-base">
                  <Icon icon={item.icon} size={20} color="#6cc24a" strokeWidth={1.75} />
                  <span className="text-white/90">{item.label}</span>
                </li>
              ))}
            </ul>
            <div className="relative mt-8 h-36 w-full max-w-xs overflow-hidden rounded-[28px] sm:h-40 sm:rounded-[32px]">
              <Image
                src={FOOTER_IMAGE.src}
                alt={FOOTER_IMAGE.alt}
                fill
                className="object-cover"
                sizes="320px"
              />
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">{labels.socialTitle}</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70 sm:text-base">
              {labels.socialBody}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="grid h-11 w-11 place-items-center rounded-xl bg-white transition hover:scale-105 hover:bg-[#f5f7f6]"
                >
                  <Icon icon={social.icon} size={20} color="#2e7d32" strokeWidth={1.75} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-white/10 pt-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/55">
            <Link href="/terms" className="transition hover:text-white">
              {labels.terms}
            </Link>
            <span aria-hidden>|</span>
            <Link href="/disclaimer" className="transition hover:text-white">
              {labels.importantInfo}
            </Link>
            <span aria-hidden>|</span>
            <Link href="/privacy" className="transition hover:text-white">
              {labels.privacy}
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {navPills.map((pill) => (
              <Link
                key={pill.href}
                href={pill.href}
                className="rounded-full border border-white/35 px-5 py-2 text-sm text-white/90 transition hover:border-white hover:bg-white/10"
              >
                {pill.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label={labels.backToTop}
              className="grid h-11 w-11 place-items-center rounded-full bg-[#6cc24a] text-[#17492c] transition hover:scale-105 hover:bg-[#82cf58]"
            >
              <Icon icon={ArrowUp01Icon} size={20} color="#17492c" strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="mt-8 space-y-3 rounded-xl border border-white/15 bg-white/5 px-5 py-4">
          <p className="max-w-3xl text-sm leading-relaxed text-white/80">{regulatoryDisclaimer}</p>
          <p className="max-w-3xl text-sm leading-relaxed text-white/70">{emergencyDisclaimer}</p>
        </div>
        <p className="mt-3 text-xs text-white/40" suppressHydrationWarning>
          © {new Date().getFullYear()} CareBridge Connect Ltd. {labels.rights}
        </p>
      </div>
    </footer>
  );
}
