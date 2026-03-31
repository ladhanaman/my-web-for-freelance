import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import type { AdminLeadFilters } from "@/lib/leads-admin-query";

const DB_TIMEOUT_MS = 15000;

export interface AdminLeadListItem {
  id: string;
  name: string;
  email: string;
  websiteUrl: string | null;
  services: string[];
  timeline: string;
  businessChallenge: string;
  budget: string;
  createdAt: string;
}

export interface PaginatedLeadsResult {
  leads: AdminLeadListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

class LeadAdminQueryError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "LeadAdminQueryError";
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("DB timeout")), timeoutMs);
    }),
  ]);
}

function toAdminLeadListItem(lead: {
  id: string;
  name: string;
  email: string;
  websiteUrl: string | null;
  services: string[];
  timeline: string;
  businessChallenge: string;
  budget: string;
  createdAt: Date;
}): AdminLeadListItem {
  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    websiteUrl: lead.websiteUrl,
    services: lead.services,
    timeline: lead.timeline,
    businessChallenge: lead.businessChallenge,
    budget: lead.budget,
    createdAt: lead.createdAt.toISOString(),
  };
}

const LEAD_SELECT = {
  id: true,
  name: true,
  email: true,
  websiteUrl: true,
  services: true,
  timeline: true,
  businessChallenge: true,
  budget: true,
  createdAt: true,
} as const;

async function queryLeadRows(
  where: Prisma.LeadWhereInput,
  skip: number,
  take: number
) {
  return prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take,
    select: LEAD_SELECT,
  });
}

export async function getLeadsPage(
  filters: AdminLeadFilters
): Promise<PaginatedLeadsResult> {
  try {
    const where: Prisma.LeadWhereInput = {};
    const requestedPage = filters.page;
    const pageSize = filters.pageSize;
    const requestedSkip = (requestedPage - 1) * pageSize;

    // Most requests hit the valid page range, so load count + rows in parallel.
    const [total, initialRows] = await withTimeout(
      Promise.all([
        prisma.lead.count({ where }),
        queryLeadRows(where, requestedSkip, pageSize),
      ]),
      DB_TIMEOUT_MS
    );

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(requestedPage, totalPages);

    const rawLeads =
      page === requestedPage
        ? initialRows
        : await withTimeout(
            queryLeadRows(where, (page - 1) * pageSize, pageSize),
            DB_TIMEOUT_MS
          );

    return {
      leads: rawLeads.map(toAdminLeadListItem),
      total,
      page,
      pageSize,
      totalPages,
      hasPrevPage: page > 1,
      hasNextPage: page < totalPages,
    };
  } catch (error) {
    console.error("[admin] failed to load leads", error);
    throw new LeadAdminQueryError("Failed to load admin leads", { cause: error });
  }
}
