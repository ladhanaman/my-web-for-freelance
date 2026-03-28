"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import ContactForm, { type OnekoCatFormSignal } from "@/components/ContactForm";
import DirectEmailBox from "@/components/DirectEmailBox";
import ProgressTracker from "@/components/ProgressTracker";
import OnekoCat, { type OnekoCatMood } from "@/components/oneko-cat";
import { SECTION_IDS } from "@/lib/collections";

const PURR_VARIATIONS = [
  "Purr purr purr...",
  "Was that effort?",
  "Try harder, darling.",
  "Earn my purr.",
  "Again, but better.",
  "More. I’m bored.",
] as const;

type SpeakOptions = {
  key?: string;
  force?: boolean;
  minGapMs?: number;
};

type SpeechItem = {
  message: string;
  durationMs: number;
  key: string | null;
};

const getDisplayName = (value: string): string | null => {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return null;

  const first = normalized.split(" ")[0] ?? "";
  if (!first) return null;
  return first.length > 18 ? `${first.slice(0, 18)}...` : first;
};

export default function ContactSection() {
  const requiredFieldTotal = 5;
  const [completedCount, setCompletedCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [catSpeech, setCatSpeech] = useState<string | null>(null);
  const [catRestToken, setCatRestToken] = useState(0);
  const [catSignal, setCatSignal] = useState<OnekoCatFormSignal>({
    focused: false,
    completed: 0,
    activeField: null,
    activeServicePromptKey: null,
    activeServicePromptQuestion: null,
    nameText: "",
    nameValid: false,
    emailValid: false,
    servicesValid: false,
    timelineValid: false,
    budgetValid: false,
    hasBasics: false,
    submitting: false,
    success: false,
    hasError: false,
  });
  const speechTimerRef = useRef<number | null>(null);
  const speechQueueRef = useRef<SpeechItem[]>([]);
  const isSpeakingRef = useRef(false);
  const currentSpeechKeyRef = useRef<string | null>(null);
  const lastSpeechAtRef = useRef(0);
  const lastSpeechKeyRef = useRef<string | null>(null);
  const delayedMilestoneTimerRef = useRef<number | null>(null);
  const prevSignalRef = useRef<OnekoCatFormSignal>(catSignal);

  const speak = useCallback((message: string, durationMs = 3200, options: SpeakOptions = {}) => {
    const now = Date.now();
    const minGapMs = options.minGapMs ?? 950;
    const key = options.key ?? null;
    const isDuplicateBurst =
      Boolean(key) &&
      key === lastSpeechKeyRef.current &&
      now - lastSpeechAtRef.current < 3200;
    const isTooSoon = now - lastSpeechAtRef.current < minGapMs;

    if (!options.force && (isTooSoon || isDuplicateBurst)) {
      return;
    }

    const playSpeech = (item: SpeechItem): void => {
      isSpeakingRef.current = true;
      currentSpeechKeyRef.current = item.key;
      lastSpeechAtRef.current = Date.now();
      lastSpeechKeyRef.current = item.key;
      setCatSpeech(item.message);

      const holdMs = Math.round(item.durationMs * 1.3);
      speechTimerRef.current = window.setTimeout(() => {
        speechTimerRef.current = null;
        setCatSpeech(null);
        isSpeakingRef.current = false;
        currentSpeechKeyRef.current = null;

        const next = speechQueueRef.current.shift();
        if (next) {
          window.setTimeout(() => {
            playSpeech(next);
          }, 120);
        }
      }, holdMs);
    };

    const item: SpeechItem = { message, durationMs, key };

    if (!options.force && isSpeakingRef.current) {
      const queueHasKey = Boolean(
        key &&
        (currentSpeechKeyRef.current === key ||
          speechQueueRef.current.some((queued) => queued.key === key))
      );
      const queueHasMessage = speechQueueRef.current.some(
        (queued) => queued.message === message
      );
      if (queueHasKey || queueHasMessage) {
        return;
      }

      if (speechQueueRef.current.length >= 2) {
        speechQueueRef.current.shift();
      }
      speechQueueRef.current.push(item);
      return;
    }

    if (options.force) {
      speechQueueRef.current = [];
      setCatSpeech(null);
      isSpeakingRef.current = false;
      currentSpeechKeyRef.current = null;
    }

    if (speechTimerRef.current) {
      window.clearTimeout(speechTimerRef.current);
      speechTimerRef.current = null;
    }

    playSpeech(item);
  }, []);

  const clearDelayedMilestone = useCallback(() => {
    if (delayedMilestoneTimerRef.current) {
      window.clearTimeout(delayedMilestoneTimerRef.current);
      delayedMilestoneTimerRef.current = null;
    }
  }, []);

  const scheduleMilestoneSpeech = useCallback((message: string, durationMs: number, key: string, delayMs: number) => {
    clearDelayedMilestone();
    delayedMilestoneTimerRef.current = window.setTimeout(() => {
      delayedMilestoneTimerRef.current = null;
      speak(message, durationMs, { key });
    }, delayMs);
  }, [clearDelayedMilestone, speak]);

  useEffect(() => {
    const sectionEl = document.getElementById(SECTION_IDS.onekoCat);
    if (!sectionEl) return;

    let wasVisible = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.35;
        if (isVisible && !wasVisible) {
          speak("Finally, you’re here.");
        }
        wasVisible = isVisible;
      },
      { threshold: [0, 0.35, 0.6] }
    );

    observer.observe(sectionEl);
    return () => observer.disconnect();
  }, [speak]);

  const handleCatSignalChange = useCallback((nextSignal: OnekoCatFormSignal) => {
    const prev = prevSignalRef.current;
    const movedFromNameToEmail =
      prev.activeField === "name" &&
      nextSignal.activeField === "email" &&
      nextSignal.nameValid;
    const displayName = movedFromNameToEmail ? getDisplayName(nextSignal.nameText) : null;

    const milestoneSpeech =
      nextSignal.completed >= requiredFieldTotal && prev.completed < requiredFieldTotal
        ? { message: "Brief locked. Delicious.", durationMs: 2400, key: "milestone-5" }
        : null;

    let milestoneDelayMs: number | null = null;

    if (nextSignal.success && !prev.success) {
      clearDelayedMilestone();
      speak("Message delivered. Obviously.", 3400, { key: "success", force: true });
    } else if (nextSignal.hasError && !prev.hasError) {
      clearDelayedMilestone();
      speak("That send flopped.", 3200, { key: "error", force: true });
    } else if (
      nextSignal.activeServicePromptKey &&
      nextSignal.activeServicePromptQuestion &&
      nextSignal.activeServicePromptKey !== prev.activeServicePromptKey
    ) {
      speak(nextSignal.activeServicePromptQuestion, 2600, {
        key: `service-prompt-${nextSignal.activeServicePromptKey}`,
      });
      if (milestoneSpeech) {
        milestoneDelayMs = 3100;
      }
    } else if (movedFromNameToEmail && displayName) {
      speak(`Cute name, ${displayName}.`, 2600, { key: "name-to-email" });
      milestoneDelayMs = 3400;
    } else if (nextSignal.emailValid && !prev.emailValid) {
      speak("Email looks expensive.", 2200, { key: "email-valid" });
      milestoneDelayMs = 2900;
    } else if (nextSignal.timelineValid && !prev.timelineValid) {
      speak("Timeline? Surprisingly solid.", 2300, { key: "timeline-valid" });
      milestoneDelayMs = 3000;
    } else if (milestoneSpeech) {
      speak(milestoneSpeech.message, milestoneSpeech.durationMs, { key: milestoneSpeech.key });
    }

    if (milestoneSpeech && milestoneDelayMs !== null) {
      scheduleMilestoneSpeech(
        milestoneSpeech.message,
        milestoneSpeech.durationMs,
        milestoneSpeech.key,
        milestoneDelayMs
      );
    }

    prevSignalRef.current = nextSignal;
    setCatSignal(nextSignal);
  }, [clearDelayedMilestone, scheduleMilestoneSpeech, speak]);

  const handleCatClick = useCallback(() => {
    const msg = PURR_VARIATIONS[Math.floor(Math.random() * PURR_VARIATIONS.length)];
    setCatRestToken((prev) => prev + 1);
    speak(msg, 2000, { key: "cat-click", force: true, minGapMs: 250 });
  }, [speak]);

  useEffect(() => {
    return () => {
      if (speechTimerRef.current) {
        window.clearTimeout(speechTimerRef.current);
      }
      if (delayedMilestoneTimerRef.current) {
        window.clearTimeout(delayedMilestoneTimerRef.current);
      }
      speechQueueRef.current = [];
      isSpeakingRef.current = false;
      currentSpeechKeyRef.current = null;
    };
  }, []);

  const catMood = useMemo<OnekoCatMood>(() => {
    if (catSignal.submitting) {
      return "thinking";
    }
    if (catSignal.hasError) {
      return "error";
    }
    if (catSignal.success) {
      return "success";
    }

    if (catSignal.focused) {
      if (catSignal.completed >= requiredFieldTotal) {
        return "happy";
      }
      if (catSignal.completed >= 3) {
        return "talk";
      }
      if (catSignal.hasBasics) {
        return "talk";
      }
      return "thinking";
    }

    if (catSignal.completed >= requiredFieldTotal) {
      return "success";
    }
    if (catSignal.completed >= 3) {
      return "happy";
    }

    return "idle";
  }, [catSignal, requiredFieldTotal]);

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
        className="flex h-full flex-col gap-5 anim-slide-left"
        style={{ animationDelay: "180ms" }}
      >
        {/* Progress tracker */}
        <ProgressTracker completed={completedCount} total={requiredFieldTotal} />

        {/* Oneko card */}
        <OnekoCat
          className="min-h-[304px] sm:min-h-[335px] lg:min-h-[374px]"
          mood={catMood}
          message={catSpeech ?? ""}
          showMessage={Boolean(catSpeech)}
          onCatClick={handleCatClick}
          restToken={catRestToken}
        />

        <DirectEmailBox />
      </aside>

      {/* ── RIGHT COLUMN ── */}
      <section
        className="anim-slide-right"
        style={{ animationDelay: "240ms" }}
      >
        <ContactForm
          onSuccess={() => setSubmitted(true)}
          onCompletedChange={setCompletedCount}
          onCatSignalChange={handleCatSignalChange}
        />
      </section>

    </div>
  );
}
