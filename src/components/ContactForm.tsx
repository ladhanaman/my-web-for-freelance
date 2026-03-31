"use client";

import { useState, useEffect, useRef, type FocusEvent } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bot, Workflow, Database, Lightbulb,
  Zap, Clock, Calendar, Compass,
  Send,
} from "lucide-react";

import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button }   from "@/components/ui/button";
import ServiceCard     from "@/components/ServiceCard";
import SelectPill      from "@/components/SelectPill";

import {
  leadSchema, LeadFormData,
  SERVICE_OPTIONS, TIMELINE_OPTIONS, BUDGET_OPTIONS,
} from "@/lib/validations";
import { getServiceFollowUpPrompt } from "@/lib/service-prompts";

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  "Ecommerce Platform":     <Bot size={17} />,
  "Landing Page":           <Workflow size={17} />,
  "RAG Systems":            <Database size={17} />,
  "AI Feature Integration": <Lightbulb size={17} />,
};

const TIMELINE_ICONS: Record<string, React.ReactNode> = {
  "ASAP":       <Zap size={13} />,
  "1-3 months": <Clock size={13} />,
  "3-6 months": <Calendar size={13} />,
  "Exploring":  <Compass size={13} />,
};

const TRACKED_FIELDS = [
  "name", "email", "services", "timeline", "businessChallenge", "budget",
] as const;

const inputCls =
  "bg-[#221e1a] border-[#2e2a25] text-[#f2ede8] placeholder:text-[#3d342c] " +
  "h-11 rounded-xl transition-all duration-200 " +
  "focus-visible:ring-0 focus-visible:border-[#C07548] " +
  "focus-visible:shadow-[0_0_0_3px_rgba(192,117,72,0.14)] hover:border-[#3d352c]";

const labelCls = "text-[#c8beb4] text-sm font-medium";
const errorCls = "text-xs text-red-400 mt-1";

interface ContactFormProps {
  onSuccess: () => void;
  onSubmitStart?: () => void;
  onCompletedChange?: (count: number) => void;
  onCatSignalChange?: (signal: OnekoCatFormSignal) => void;
}

export interface OnekoCatFormSignal {
  focused: boolean;
  completed: number;
  activeField: OnekoCatField;
  activeServicePromptKey: string | null;
  activeServicePromptQuestion: string | null;
  nameText: string;
  nameValid: boolean;
  emailValid: boolean;
  servicesValid: boolean;
  timelineValid: boolean;
  budgetValid: boolean;
  hasBasics: boolean;
  submitting: boolean;
  success: boolean;
  hasError: boolean;
}

export type OnekoCatField =
  | "name"
  | "email"
  | "services"
  | "timeline"
  | "businessChallenge"
  | "budget"
  | null;

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function ContactForm({ onSuccess, onSubmitStart, onCompletedChange, onCatSignalChange }: ContactFormProps) {
  const [submitting,  setSubmitting]  = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [isFormFocused, setIsFormFocused] = useState(false);
  const [activeField, setActiveField] = useState<OnekoCatField>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register, handleSubmit, control, watch, setValue, setFocus,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: { services: [] },
  });
  const [selectedFollowUpChipId, setSelectedFollowUpChipId] = useState<string | null>(null);

  const watchedValues = watch(TRACKED_FIELDS);
  const [nameVal, emailVal, servicesVal, timelineVal, challengeVal, budgetVal] = watchedValues;
  const nameOk = leadSchema.shape.name.safeParse(nameVal).success;
  const emailOk = leadSchema.shape.email.safeParse(emailVal).success;
  const servicesOk = leadSchema.shape.services.safeParse(servicesVal).success;
  const timelineOk = leadSchema.shape.timeline.safeParse(timelineVal).success;
  const budgetOk = leadSchema.shape.budget.safeParse(budgetVal).success;
  const selectedServices = Array.isArray(servicesVal) ? servicesVal : [];
  const latestSelectedService = selectedServices[selectedServices.length - 1] ?? null;
  const activeServicePrompt = getServiceFollowUpPrompt(latestSelectedService);
  const activePrompts = selectedServices
    .map((s) => getServiceFollowUpPrompt(s))
    .filter((p): p is NonNullable<typeof p> => p !== null);
  const challengeText = typeof challengeVal === "string" ? challengeVal : "";
  const completedCount = [
    nameOk,
    emailOk,
    servicesOk,
    timelineOk,
    budgetOk,
  ].filter(Boolean).length;

  useEffect(() => {
    setSelectedFollowUpChipId(null);
  }, [latestSelectedService]);

  useEffect(() => {
    onCompletedChange?.(completedCount);
  }, [completedCount, onCompletedChange]);

  useEffect(() => {
    onCatSignalChange?.({
      focused: isFormFocused,
      completed: completedCount,
      activeField,
      activeServicePromptKey: activeServicePrompt ? latestSelectedService : null,
      activeServicePromptQuestion: activeServicePrompt?.question ?? null,
      nameText: typeof nameVal === "string" ? nameVal : "",
      nameValid: nameOk,
      emailValid: emailOk,
      servicesValid: servicesOk,
      timelineValid: timelineOk,
      budgetValid: budgetOk,
      hasBasics: nameOk && emailOk,
      submitting: submitState === "submitting",
      success: submitState === "success",
      hasError: submitState === "error",
    });
  }, [
    budgetOk,
    completedCount,
    emailOk,
    isFormFocused,
    nameOk,
    nameVal,
    onCatSignalChange,
    servicesOk,
    submitState,
    timelineOk,
    activeField,
    activeServicePrompt,
    latestSelectedService,
  ]);

  const applyFollowUpStarter = (starter: string, chipId: string) => {
    const trimmedCurrent = challengeText.trim();
    const nextValue = !trimmedCurrent
      ? starter
      : challengeText.includes(starter)
        ? challengeText
        : `${challengeText.trimEnd()}\n${starter}`;

    setValue("businessChallenge", nextValue, {
      shouldDirty: true,
      shouldTouch: true,
    });
    setSelectedFollowUpChipId(chipId);
    setFocus("businessChallenge");
  };

  const onSubmit = async (data: LeadFormData) => {
    onSubmitStart?.();
    setSubmitting(true);
    setServerError(null);
    setSubmitState("submitting");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch("/api/submit", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
        signal:  controller.signal,
      });
      if (!res.ok) throw new Error("failed");
      setSubmitState("success");
      onSuccess();
    } catch {
      setServerError("Something went wrong. Please try again or email us directly.");
      setSubmitState("error");
    } finally {
      clearTimeout(timer);
      setSubmitting(false);
    }
  };

  const resolveActiveField = (element: Element | null): OnekoCatField => {
    if (!(element instanceof HTMLElement)) return null;
    const key = (element.getAttribute("name") || element.id || "").trim();
    switch (key) {
      case "name":
      case "email":
      case "services":
      case "timeline":
      case "businessChallenge":
      case "budget":
        return key;
      default:
        return null;
    }
  };

  const handleFocusCapture = (event: FocusEvent<HTMLFormElement>) => {
    setIsFormFocused(true);
    setActiveField(resolveActiveField(event.target as Element));
    if (submitState !== "submitting") {
      setSubmitState((prev) => (prev === "idle" ? prev : "idle"));
    }
  };

  const handleBlurCapture = () => {
    window.requestAnimationFrame(() => {
      const formEl = formRef.current;
      const active = document.activeElement;
      setIsFormFocused(Boolean(formEl && active && formEl.contains(active)));
      setActiveField(resolveActiveField(active));
    });
  };

  /* ── Form ── */
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#2e2a25] bg-[#1c1916] overflow-hidden">
        <form
          ref={formRef}
          onSubmit={handleSubmit(onSubmit)}
          onFocusCapture={handleFocusCapture}
          onBlurCapture={handleBlurCapture}
          className="divide-y divide-[#252018]"
        >

          {/* Section 1 — Name, Email, Website */}
          <div className="p-6 sm:p-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="name" className={labelCls}>
                  Name <span className="text-[#C07548]">*</span>
                </Label>
                <Input id="name" placeholder="Your full name" {...register("name")} className={inputCls} />
                {errors.name && <p className={errorCls}>{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className={labelCls}>
                  Email <span className="text-[#C07548]">*</span>
                </Label>
                <Input id="email" type="email" placeholder="you@company.com" {...register("email")} className={inputCls} />
                {errors.email && <p className={errorCls}>{errors.email.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl" className={labelCls}>
                Website URL{" "}
                <span className="text-[#5a5048] font-normal text-xs">(optional)</span>
              </Label>
              <Input id="websiteUrl" placeholder="https://yourcompany.com" {...register("websiteUrl")} className={inputCls} />
              {errors.websiteUrl && <p className={errorCls}>{errors.websiteUrl.message}</p>}
            </div>
          </div>

          {/* Section 2 — Services */}
          <div className="p-6 sm:p-8 space-y-3">
            <Label className={`${labelCls} block`}>
              Services of Interest <span className="text-[#C07548]">*</span>
            </Label>
            <Controller
              name="services"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-3">
                  {SERVICE_OPTIONS.map((service) => {
                    const selected = field.value?.includes(service) ?? false;
                    return (
                      <ServiceCard
                        key={service}
                        label={service}
                        icon={SERVICE_ICONS[service]}
                        selected={selected}
                        onToggle={() => {
                          const curr = field.value ?? [];
                          field.onChange(
                            selected ? curr.filter((s) => s !== service) : [...curr, service]
                          );
                        }}
                      />
                    );
                  })}
                </div>
              )}
            />
            {errors.services && <p className={errorCls}>{errors.services.message}</p>}
          </div>

          {/* Section 3 — Timeline */}
          <div className="p-6 sm:p-8 space-y-3">
            <Label className={`${labelCls} block`}>
              Project Timeline <span className="text-[#C07548]">*</span>
            </Label>
            <Controller
              name="timeline"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {TIMELINE_OPTIONS.map((option) => (
                    <SelectPill
                      key={option}
                      label={option}
                      icon={TIMELINE_ICONS[option]}
                      selected={field.value === option}
                      onClick={() => field.onChange(option)}
                    />
                  ))}
                </div>
              )}
            />
            {errors.timeline && <p className={errorCls}>{errors.timeline.message}</p>}
          </div>

          {/* Section 4 — Business Challenge */}
          <div className="p-6 sm:p-8 space-y-2">
            <Label htmlFor="businessChallenge" className={`${labelCls} block`}>
              Primary Business Challenge{" "}
              <span className="text-[#5a5048] font-normal text-xs">(optional)</span>
            </Label>
            {activePrompts.length > 0 ? (
              <div className="space-y-4">
                {activePrompts.map((prompt) => (
                  <div key={prompt.question} className="rounded-xl border border-[#C07548]/20 bg-[#17130f] px-4 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-all duration-300">
                    <p className="text-sm font-medium text-[#f2ede8]">
                      {prompt.question}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {prompt.chips.map((chip) => (
                        <SelectPill
                          key={chip.id}
                          label={chip.label}
                          selected={selectedFollowUpChipId === chip.id}
                          onClick={() => applyFollowUpStarter(chip.starter, chip.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            <Textarea
              id="businessChallenge"
              placeholder="Tell us what you're building, fixing, or exploring..."
              rows={4}
              {...register("businessChallenge")}
              className={`${inputCls} h-auto resize-none leading-relaxed`}
            />
          </div>

          {/* Section 5 — Budget + Submit */}
          <div className="p-6 sm:p-8 space-y-5">
            <div className="space-y-3">
              <Label className={`${labelCls} block`}>
                Estimated Budget <span className="text-[#C07548]">*</span>
              </Label>
              <Controller
                name="budget"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {BUDGET_OPTIONS.map((option) => (
                      <SelectPill
                        key={option}
                        label={option}
                        selected={field.value === option}
                        onClick={() => field.onChange(option)}
                      />
                    ))}
                  </div>
                )}
              />
              {errors.budget && <p className={errorCls}>{errors.budget.message}</p>}
            </div>

            {serverError && (
              <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                {serverError}
              </p>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="btn-shimmer w-full h-14 rounded-xl font-semibold text-base text-white
                cursor-pointer disabled:opacity-60 transition-all duration-200
                hover:scale-[1.015] active:scale-[0.99]
                shadow-[0_4px_24px_rgba(192,117,72,0.35)]
                hover:shadow-[0_6px_36px_rgba(192,117,72,0.55)]"
              style={{ background: "linear-gradient(135deg, #C07548 0%, #d4895e 50%, #C07548 100%)" }}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Sending...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Book Your Free Consultation
                  <Send size={17} />
                </span>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
