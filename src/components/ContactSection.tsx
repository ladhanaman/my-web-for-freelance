"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ContactForm, { type OnekoCatFormSignal } from "@/components/ContactForm";
import DirectEmailBox from "@/components/DirectEmailBox";
import ProgressTracker from "@/components/ProgressTracker";
import OnekoCat, { type OnekoCatMood } from "@/components/oneko-cat";
import ShaderBackground from "@/components/ShaderBackground";
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
  type Phase = "form" | "shader" | "cat";
  const requiredFieldTotal = 5;
  const [completedCount, setCompletedCount] = useState(0);
  const [phase, setPhase] = useState<Phase>("form");
  const [showShader, setShowShader] = useState(false);
  const [shaderOrigin, setShaderOrigin] = useState({ x: 0, y: 0 });
  const [showVignette, setShowVignette] = useState(false);
  const [vignetteExiting, setVignetteExiting] = useState(false);
  const vignetteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWarpComplete = useCallback(() => {
    setPhase("cat");

    // Smooth scroll to the cat reveal during the shader's 1.5s fade-out
    // This removes the abrupt visual jump caused by the DOM structure change
    containerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    // Wait for the .anim-shader-out css cross-fade to complete
    setTimeout(() => {
      setShowShader(false);
    }, 1500);
  }, []);

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
      if (vignetteTimerRef.current) {
        clearTimeout(vignetteTimerRef.current);
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

  return (
    <div ref={containerRef} className="relative">
      {showShader && (
        <ShaderBackground
          onWarpComplete={handleWarpComplete}
          isFadingOut={phase === "cat"}
          originX={shaderOrigin.x}
          originY={shaderOrigin.y}
        />
      )}

      {/* Vignette overlay — darkness closes from screen edges toward the submit button */}
      {showVignette && (
        <div
          className={`fixed inset-0 z-[101] pointer-events-none bg-black ${vignetteExiting ? "anim-vignette-out" : "anim-vignette-in"}`}
        />
      )}

      {/* ── Section header and Grid — fades down and out smoothly during shader entry ── */}
      {phase !== "cat" && (
        <div className={phase === "shader" ? "opacity-0 pointer-events-none transition-opacity duration-1000 ease-out" : "duration-300 transition-opacity"}>
          <header className="mb-12 text-center anim-fade-up" style={{ animationDelay: "0ms" }}>
            <h2 style={{
              fontSize: "clamp(2.6rem, 5.2vw, 5rem)",
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: "-0.04em",
              color: "#f2ede8",
            }}>
              Let&apos;s Build What Matters
            </h2>
            <p className="mt-4 text-base text-[#8c7f74] sm:text-lg max-w-lg mx-auto leading-relaxed">
              Bring the ambition. I&apos;ll handle the bottlenecks.
            </p>
          </header>

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
                onSubmitStart={(origin) => {
                  setShaderOrigin(origin);
                  // Mount shader immediately so GLSL compiles during the vignette window,
                  // not after it — which would freeze the main thread and kill the animation.
                  setShowVignette(true);
                  setVignetteExiting(false);
                  vignetteTimerRef.current = setTimeout(() => {
                    // Mount shader + start vignette fade-out at the same time.
                    // CSS opacity keyframes run on the compositor, so GLSL compilation
                    // on the main thread won't block the vignette animation.
                    setShowShader(true);
                    setVignetteExiting(true);
                    setPhase("shader");
                    setTimeout(() => setShowVignette(false), 1000);
                  }, 1200);
                }}
                onSuccess={() => { }} // Not needed, handled optimistically
                onCompletedChange={setCompletedCount}
                onCatSignalChange={handleCatSignalChange}
              />
            </section>
          </div>
        </div>
      )}

      {/* ── The Cat Reveal (Mounts natively in Section flow instantly, filling the full screen) ── */}
      {phase === "cat" && (
        <div className="flex flex-col items-center justify-center min-h-[100vh] pb-[50vh] anim-pop-in">
          {/* Success message header — provides context that the form is gone but the work has begun */}
          <header className="mb-12 text-center anim-fade-up" style={{ animationDelay: "100ms" }}>
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="h-px w-10 sm:w-14 bg-[#C07548]/50" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C07548]">
                Mission Start
              </span>
              <div className="h-px w-10 sm:w-14 bg-[#C07548]/50" />
            </div>
            <h2 style={{
              fontSize: "clamp(2.4rem, 4.8vw, 4.2rem)",
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: "-0.04em",
              color: "#f2ede8",
            }}>
              You&apos;ve got my attention.
            </h2>
            <p className="mt-4 text-base text-[#8c7f74] sm:text-lg max-w-lg mx-auto leading-relaxed">
              I&apos;ll be in touch soon.
            </p>
          </header>

          <OnekoCat
            className="w-full max-w-[600px] min-h-[480px]"
            mood="happy"
            message="Time to build."
            showMessage={true}
          />
        </div>
      )}
    </div>
  );
}
