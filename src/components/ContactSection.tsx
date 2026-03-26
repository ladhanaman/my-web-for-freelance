"use client";

import { useState } from "react";
import { CircleDot, CheckCircle2 } from "lucide-react";
import ContactForm    from "@/components/ContactForm";
import DirectEmailBox from "@/components/DirectEmailBox";
import ProgressTracker from "@/components/ProgressTracker";

const WHAT_TO_EXPECT = [
  "Free 30-minute consultation",
  "Response within 24 hours",
  "No-obligation project scoping",
  "Transparent pricing upfront",
];

export default function ContactSection() {
  const [completedCount, setCompletedCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="anim-pop-in flex flex-col items-center justify-center rounded-2xl border border-[#2e2a25] bg-[#1c1916] p-12 sm:p-20 text-center gap-7 min-h-[420px]">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <div
            className="absolute inset-0 rounded-full anim-glow-pulse"
            style={{ background: "radial-gradient(circle, rgba(192,117,72,0.25) 0%, transparent 70%)" }}
          />
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#C07548]/15 ring-2 ring-[#C07548]/50">
            <CheckCircle2 size={42} className="text-[#C07548]" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#f2ede8] mb-3">
            We&apos;ve received your message!
          </h2>
          <p className="text-[#8c7f74] max-w-sm leading-relaxed">
            Expect a reply within 24 hours. You can also reach us at{" "}
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=ladhanaman2206@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C07548] hover:text-[#d98a60] hover:underline transition-colors"
            >
              ladhanaman2206@gmail.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr] lg:gap-10 xl:grid-cols-[370px_1fr]">

      {/* ── LEFT COLUMN ── */}
      <aside
        className="flex flex-col gap-5 anim-slide-left"
        style={{ animationDelay: "180ms" }}
      >
        {/* Progress tracker */}
        <ProgressTracker completed={completedCount} total={6} />

        {/* What to expect */}
        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#8c7f74]">
            What to expect
          </h3>
          <ul className="space-y-3.5">
            {WHAT_TO_EXPECT.map((item, i) => (
              <li
                key={item}
                className="flex items-center gap-3 text-sm text-[#8c7f74] anim-fade-up"
                style={{ animationDelay: `${300 + i * 75}ms` }}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#C07548]/45 bg-[#C07548]/10">
                  <CircleDot size={12} className="text-[#C07548]" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Email card */}
        <DirectEmailBox />
      </aside>

      {/* ── RIGHT COLUMN ── */}
      <section
        className="anim-slide-right"
        style={{ animationDelay: "240ms" }}
      >
        <ContactForm onSuccess={() => setSubmitted(true)} onCompletedChange={setCompletedCount} />
      </section>

    </div>
  );
}
