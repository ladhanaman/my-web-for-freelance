"use client";

import type { AdminLeadListItem } from "@/lib/leads-admin";

interface AdminLeadsTableClientProps {
  leads: AdminLeadListItem[];
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getUTCMonth()];
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();
  const rawHours = date.getUTCHours();
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const hour = rawHours % 12 || 12;
  const period = rawHours >= 12 ? "PM" : "AM";

  return `${month} ${day}, ${year} ${hour}:${minutes} ${period} UTC`;
}

function challengePreview(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 80) {
    return trimmed;
  }

  return `${trimmed.slice(0, 80)}...`;
}

export default function AdminLeadsTableClient({ leads }: AdminLeadsTableClientProps) {
  if (leads.length === 0) {
    return (
      <div className="rounded-2xl border border-[#2e2a25] bg-[#16120f] p-8 text-center">
        <h3 className="text-xl font-semibold text-[#f2ede8]">No leads yet</h3>
        <p className="mt-2 text-sm text-[#8c7f74]">
          Form submissions will appear here as soon as someone sends the contact form.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#2e2a25] bg-[#171310] shadow-[0_16px_55px_rgba(0,0,0,0.35)]">
      <div className="overflow-x-auto">
        <table className="min-w-[1200px] w-full text-left text-sm text-[#f2ede8]">
          <thead className="bg-[#201a16] text-xs uppercase tracking-[0.12em] text-[#8c7f74]">
            <tr>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Website</th>
              <th className="px-4 py-3">Services</th>
              <th className="px-4 py-3">Timeline</th>
              <th className="px-4 py-3">Budget</th>
              <th className="px-4 py-3">Challenge</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#252018]">
            {leads.map((lead) => (
              <tr key={lead.id} className="transition-colors hover:bg-[#231d18]">
                <td className="px-4 py-3 text-[#c8beb4]">{formatDate(lead.createdAt)}</td>
                <td className="px-4 py-3 font-medium">{lead.name}</td>
                <td className="px-4 py-3 text-[#c8beb4]">{lead.email}</td>
                <td className="px-4 py-3 text-[#c8beb4]">{lead.websiteUrl ?? "-"}</td>
                <td className="px-4 py-3 text-[#c8beb4]">{lead.services.join(", ")}</td>
                <td className="px-4 py-3 text-[#c8beb4]">{lead.timeline}</td>
                <td className="px-4 py-3 text-[#c8beb4]">{lead.budget}</td>
                <td className="px-4 py-3 text-[#c8beb4]">{challengePreview(lead.businessChallenge)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
