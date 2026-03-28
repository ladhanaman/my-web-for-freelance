export const SERVICE_FOLLOW_UP_PROMPTS = {
  "Landing Page": {
    question: "Chasing clicks, leads, or signups?",
    chips: [
      {
        id: "landing-clicks",
        label: "Clicks",
        starter: "We need a landing page that drives more qualified clicks from our campaigns and traffic sources.",
      },
      {
        id: "landing-leads",
        label: "Leads",
        starter: "We need a landing page focused on capturing qualified leads for our business.",
      },
      {
        id: "landing-signups",
        label: "Signups",
        starter: "We need a landing page that turns visitors into signups with a clear CTA.",
      },
    ],
  },
  "RAG Systems": {
    question: "What knowledge am I hunting?",
    chips: [
      {
        id: "rag-docs",
        label: "Internal docs",
        starter: "We need a RAG system that helps people find answers across our internal docs.",
      },
      {
        id: "rag-support",
        label: "Support content",
        starter: "We need a RAG system that answers questions using our support content and help docs.",
      },
      {
        id: "rag-team",
        label: "Team knowledge",
        starter: "We need a RAG system that surfaces team knowledge from our existing knowledge base.",
      },
    ],
  },
} as const;

export type ServiceFollowUpPromptKey = keyof typeof SERVICE_FOLLOW_UP_PROMPTS;

export const getServiceFollowUpPrompt = (service: string | null | undefined) => {
  if (!service) return null;
  return SERVICE_FOLLOW_UP_PROMPTS[service as ServiceFollowUpPromptKey] ?? null;
};