import { z } from "zod";

export const SERVICE_OPTIONS = [
  "Ecommerce Platform",
  "Landing Page",
  "RAG Systems",
  "AI Feature Integration",
] as const;

export const TIMELINE_OPTIONS = [
  "ASAP",
  "1-3 months",
  "3-6 months",
  "Exploring",
] as const;

export const BUDGET_OPTIONS = [
  "Under $5k",
  "$5k - $15k",
  "$15k - $30k",
  "$30k+",
] as const;

export const leadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  websiteUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  services: z
    .array(z.enum(SERVICE_OPTIONS))
    .min(1, "Select at least one service"),
  timeline: z.enum(TIMELINE_OPTIONS, {
    message: "Please select a timeline",
  }),
  businessChallenge: z
    .string()
    .min(20, "Please describe your challenge in at least 20 characters"),
  budget: z.enum(BUDGET_OPTIONS, {
    message: "Please select a budget range",
  }),
});

export type LeadFormData = z.infer<typeof leadSchema>;
