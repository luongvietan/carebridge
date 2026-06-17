"use client";

import Link from "next/link";
import { useState } from "react";
import { Add01Icon, Icon, MessageQuestionIcon, MinusSignIcon } from "@/components/ui/icon";
import { marketingSurface } from "@/lib/marketing-ui";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqListProps = {
  faqs: readonly FaqItem[];
  showSidebar?: boolean;
  defaultOpenIndex?: number;
};

export function FaqList({ faqs, showSidebar = true, defaultOpenIndex = 0 }: FaqListProps) {
  const [openIndex, setOpenIndex] = useState(defaultOpenIndex);

  const accordion = (
    <div className="space-y-3">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;

        return (
          <div
            key={faq.question}
            data-reveal-child
            className={`overflow-hidden rounded-2xl ${marketingSurface} transition`}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
              aria-expanded={isOpen}
            >
              <span className="font-semibold text-[#1e5a33] sm:text-[17px]">{faq.question}</span>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white shadow-sm">
                <Icon
                  icon={isOpen ? MinusSignIcon : Add01Icon}
                  size={18}
                  color="#445049"
                  strokeWidth={2}
                />
              </span>
            </button>
            {isOpen && (
              <p className="px-5 pb-5 text-sm leading-relaxed text-[#5b6a62] sm:px-6 sm:pb-6">
                {faq.answer}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );

  if (!showSidebar) return accordion;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(280px,340px)_1fr] lg:items-start">
      <div
        data-reveal-child
        className="flex flex-col rounded-[28px] bg-[#2e7d32] px-8 py-10 text-white sm:rounded-[32px] sm:px-10 sm:py-12"
      >
        <Icon icon={MessageQuestionIcon} size={48} color="#ffffff" strokeWidth={1.75} />
        <h3 className="mt-6 text-2xl font-bold leading-tight sm:text-[1.75rem]">
          Do you have more questions?
        </h3>
        <p className="mt-4 text-sm leading-relaxed text-white/90 sm:text-[15px]">
          We&apos;re here to help with answers, guidance and support for clients, organisations
          and professionals.
        </p>
        <Link
          href="/contact"
          className="mt-8 inline-flex w-fit rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-[#1e5a33] transition hover:bg-[#f5f7f6]"
        >
          Contact us
        </Link>
      </div>

      {accordion}
    </div>
  );
}
