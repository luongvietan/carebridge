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
import type { ConsumerInfo } from "@/lib/marketing/consumer-info";

const FOOTER_IMAGE = marketingImages.footer;

const socialLinks: { label: string; href: string; icon: IconSvgElement }[] = [
  { label: "X", href: process.env.NEXT_PUBLIC_SOCIAL_X ?? "", icon: NewTwitterIcon },
  { label: "LinkedIn", href: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN ?? "", icon: Linkedin01Icon },
  { label: "Instagram", href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM ?? "", icon: InstagramIcon },
  { label: "Facebook", href: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK ?? "", icon: Facebook01Icon },
].filter(link => /^https:\/\//.test(link.href));

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
  consumerInfo = null,
  legalEntity = "CareBridge Connect Ltd",
  extraLegalLinks = [],
}: {
  labels: FooterLabels;
  regulatoryDisclaimer: string;
  emergencyDisclaimer: string;
  /** Portugal's legally required complaints-book link and RAL notice; null elsewhere. */
  consumerInfo?: ConsumerInfo | null;
  /** The operating company named in the copyright line. */
  legalEntity?: string;
  /** Further legal documents the market publishes (Portugal's cookies, cancellation, complaints, notice). */
  extraLegalLinks?: readonly { href: string; label: string }[];
}) {
  const contactItems = [
    { label: labels.address, icon: Location01Icon, href: null },
    { label: labels.phone, icon: Call02Icon, href: `tel:${labels.phone.replace(/[^+\d]/g, "")}` },
    { label: CONTACT_EMAIL, icon: Mail01Icon, href: `mailto:${CONTACT_EMAIL}` },
  ].filter((item) => item.label.trim().length > 0);
  const navPills = [
    { href: "/", label: labels.home },
    { href: "/services", label: labels.services },
    { href: "/faq", label: labels.faq },
    { href: "/contact", label: labels.support },
  ];
  return (
    <footer className="mt-6 bg-gradient-to-r from-[#0a2c1d] via-[#0f3d28] to-[#1a5238] text-[#cfe3d6] sm:mt-16 lg:mt-24">
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">{labels.contactTitle}</h2>
            <ul className="mt-8 space-y-4">
              {contactItems.map((item) => (
                <li key={item.label} className="flex items-center gap-3 text-sm sm:text-base">
                  <Icon icon={item.icon} size={20} color="#6cc24a" strokeWidth={1.75} />
                  {item.href ? <a href={item.href} className="text-white/90 hover:underline">{item.label}</a> : <span className="text-white/90">{item.label}</span>}
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
            <h2 className="text-3xl font-bold text-white sm:text-4xl">{socialLinks.length ? labels.socialTitle : labels.support}</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70 sm:text-base">
              {socialLinks.length ? labels.socialBody : <Link href="/contact" className="underline">{CONTACT_EMAIL}</Link>}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="grid h-11 w-11 place-items-center rounded-xl bg-white transition hover:scale-105 hover:bg-surface"
                >
                  <Icon icon={social.icon} size={20} color="#2e7d32" strokeWidth={1.75} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-white/10 pt-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px] leading-7 text-white/85">
            <Link href="/terms" className="inline-flex min-h-11 items-center transition hover:text-white">
              {labels.terms}
            </Link>
            <span aria-hidden className="hidden sm:inline">|</span>
            <Link href="/disclaimer" className="inline-flex min-h-11 items-center transition hover:text-white">
              {labels.importantInfo}
            </Link>
            <span aria-hidden className="hidden sm:inline">|</span>
            <Link href="/privacy" className="inline-flex min-h-11 items-center transition hover:text-white">
              {labels.privacy}
            </Link>
            {extraLegalLinks.map((link) => (
              <span key={link.href} className="contents">
                <span aria-hidden className="hidden sm:inline">|</span>
                <Link href={link.href} className="inline-flex min-h-11 items-center transition hover:text-white">
                  {link.label}
                </Link>
              </span>
            ))}
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

        <div className="mt-8 space-y-4 rounded-xl border border-white/15 bg-white/5 px-5 py-4">
          <p className="max-w-3xl text-[15px] leading-7 text-white/85">{regulatoryDisclaimer}</p>
          <p className="max-w-3xl text-[15px] leading-7 text-white/85">{emergencyDisclaimer}</p>
        </div>
        {consumerInfo && (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <a
              href={consumerInfo.complaintsBook.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-white/35 bg-white px-3 py-2 text-sm font-semibold text-[#8b1d1d] transition hover:bg-surface"
            >
              <span aria-hidden className="grid h-5 w-5 place-items-center rounded bg-[#8b1d1d] text-[11px] font-bold text-white">
                LR
              </span>
              {consumerInfo.complaintsBook.label}
            </a>
            <p className="max-w-3xl text-sm leading-7 text-white/80">
              {consumerInfo.disputeResolution.text}{" "}
              <a
                href={consumerInfo.disputeResolution.href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-white"
              >
                {consumerInfo.disputeResolution.linkLabel}
              </a>
            </p>
          </div>
        )}
        <p className="mt-4 text-sm leading-6 text-white/70" suppressHydrationWarning>
          © {new Date().getFullYear()} {legalEntity}. {labels.rights}
        </p>
      </div>
    </footer>
  );
}
