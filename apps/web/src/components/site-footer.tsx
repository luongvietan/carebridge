"use client";

import Image from "next/image";
import Link from "next/link";
import { marketingImages } from "@/data/marketing-images";
import { emergencyDisclaimer, regulatoryDisclaimer } from "@/data/marketing-copy";
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

const contactItems = [
  { label: "London, United Kingdom", icon: Location01Icon },
  { label: "+44 (0)20 0000 0000", icon: Call02Icon },
  { label: "info@carebridgeconnect.co.uk", icon: Mail01Icon },
];

const navPills = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Support" },
];

const socialLinks: { label: string; href: string; icon: IconSvgElement }[] = [
  { label: "X", href: "#", icon: NewTwitterIcon },
  { label: "LinkedIn", href: "#", icon: Linkedin01Icon },
  { label: "Instagram", href: "#", icon: InstagramIcon },
  { label: "Facebook", href: "#", icon: Facebook01Icon },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-gradient-to-r from-[#0a2c1d] via-[#0f3d28] to-[#1a5238] text-[#cfe3d6]">
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Contact Us</h2>
            <ul className="mt-8 space-y-4">
              {contactItems.map((item) => (
                <li key={item.label} className="flex items-center gap-3 text-sm sm:text-base">
                  <Icon icon={item.icon} size={20} color="#7ed7a0" strokeWidth={1.75} />
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
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Our Social Channels</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70 sm:text-base">
              The latest insights, resources, expert opinions and company news from CareBridge
              Connect.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="grid h-11 w-11 place-items-center rounded-xl bg-white transition hover:scale-105 hover:bg-[#f5f7f6]"
                >
                  <Icon icon={social.icon} size={20} color="#0c6e4f" strokeWidth={1.75} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-white/10 pt-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/55">
            <Link href="/terms" className="transition hover:text-white">
              Terms &amp; conditions
            </Link>
            <span aria-hidden>|</span>
            <Link href="/disclaimer" className="transition hover:text-white">
              Important information
            </Link>
            <span aria-hidden>|</span>
            <Link href="/privacy" className="transition hover:text-white">
              Privacy Policy
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
              aria-label="Back to top"
              className="grid h-11 w-11 place-items-center rounded-full bg-[#7ed7a0] text-[#0c3a25] transition hover:scale-105 hover:bg-[#9ee7b8]"
            >
              <Icon icon={ArrowUp01Icon} size={20} color="#0c3a25" strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="mt-8 space-y-3 rounded-xl border border-white/15 bg-white/5 px-5 py-4">
          <p className="max-w-3xl text-sm leading-relaxed text-white/80">{regulatoryDisclaimer}</p>
          <p className="max-w-3xl text-sm leading-relaxed text-white/70">{emergencyDisclaimer}</p>
        </div>
        <p className="mt-3 text-xs text-white/40" suppressHydrationWarning>
          © {new Date().getFullYear()} CareBridge Connect Ltd. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
