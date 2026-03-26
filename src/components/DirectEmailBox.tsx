"use client";

import { useState } from "react";
import { Mail, ArrowRight, Copy, Check } from "lucide-react";

const EMAIL = "ladhanaman2206@gmail.com";
const GMAIL_URL = `https://mail.google.com/mail/?view=cm&fs=1&to=${EMAIL}&su=Project%20Inquiry`;

export default function DirectEmailBox() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent fail
    }
  };

  return (
    <div className="rounded-2xl border border-[#2e2a25] bg-[#1c1916] p-5 card-hover relative overflow-hidden">
      {/* Accent left strip */}
      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-[#C07548]" />

      <div className="pl-4 space-y-3">
        {/* Heading */}
        <div className="flex items-center gap-2">
          <Mail size={14} className="text-[#C07548] shrink-0" />
          <span className="text-sm font-medium text-[#f2ede8]">
            Prefer to email directly?
          </span>
        </div>

        {/* Email — clicking opens Gmail */}
        <div className="flex items-center gap-3 flex-wrap">
          <a
            href={GMAIL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-[#C07548] font-medium
              hover:text-[#d98a60] transition-colors duration-200 group"
          >
            {EMAIL}
            <ArrowRight
              size={13}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </a>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#2e2a25] bg-[#252018]
              px-2.5 py-1 text-xs font-medium text-[#8c7f74]
              hover:border-[#C07548]/40 hover:text-[#C07548] transition-all duration-200 cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={11} className="text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={11} />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
