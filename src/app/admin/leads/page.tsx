import Link from "next/link";

import AdminSignOutButton from "@/components/admin/AdminSignOutButton";

import AdminLeadsTableClient from "@/components/admin/AdminLeadsTableClient";
import { getLeadsPage } from "@/lib/leads-admin";
import {
  buildAdminHref,
  parseAdminLeadFilters,
  type AdminLeadFilters,
  type AdminSearchParams,
} from "@/lib/leads-admin-query";

export const dynamic = "force-dynamic";

type AdminLeadsPageProps = {
  searchParams: Promise<AdminSearchParams>;
};

async function loadAdminLeads(
  filters: AdminLeadFilters
): Promise<Awaited<ReturnType<typeof getLeadsPage>> | null> {
  try {
    return await getLeadsPage(filters);
  } catch (err) {
    console.error("[AdminLeadsPage] Failed to load leads:", err);
    return null;
  }
}

export default async function AdminLeadsPage({ searchParams }: AdminLeadsPageProps) {
  const rawSearchParams = await searchParams;
  const filters = parseAdminLeadFilters(rawSearchParams);
  const results = await loadAdminLeads(filters);

  if (!results) {
    return (
      <main className="min-h-screen bg-[#100e0c] px-4 py-16 sm:px-8">
        <section className="mx-auto w-full max-w-3xl rounded-2xl border border-red-400/30 bg-red-400/10 p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.18em] text-red-300">Admin Error</p>
          <h1 className="mt-2 text-2xl font-semibold text-[#f2ede8]">Unable to load leads</h1>
          <p className="mt-2 text-sm text-[#d6cfc8]">
            The database query failed. Try again or reload the dashboard.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={buildAdminHref(filters)}
              className="inline-flex h-10 items-center rounded-lg border border-red-300/40 px-4 text-sm text-red-100 transition-colors hover:bg-red-300/10"
            >
              Retry
            </Link>
            <Link
              href="/admin"
              className="inline-flex h-10 items-center rounded-lg border border-[#2e2a25] px-4 text-sm text-[#c8beb4] transition-colors hover:text-[#f2ede8]"
            >
              Open dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const paginationFilters: AdminLeadFilters = {
    page: results.page,
    pageSize: results.pageSize,
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#100e0c] px-4 py-10 sm:px-8 lg:px-12">
      <div
        className="pointer-events-none absolute top-[-120px] right-[-90px] h-[420px] w-[420px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(192,117,72,0.26) 0%, transparent 68%)",
          filter: "blur(72px)",
        }}
      />

      <div
        className="pointer-events-none absolute bottom-[-140px] left-[-100px] h-[420px] w-[420px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(120,60,20,0.24) 0%, transparent 68%)",
          filter: "blur(84px)",
        }}
      />

      <section className="relative z-10 mx-auto w-full max-w-[1400px] space-y-6">
        <header className="rounded-2xl border border-[#2e2a25] bg-[linear-gradient(145deg,#18130f_0%,#221a14_60%,#1a1410_100%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C07548]">
                Admin Console
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#f2ede8] sm:text-4xl">
                Leads Dashboard
              </h1>
              <p className="mt-2 text-sm text-[#8c7f74] sm:text-base">
                Read-only view of all contact form submissions.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link
                  href="/admin"
                  className="inline-flex h-9 items-center rounded-lg border border-[#2e2a25] px-3 text-xs uppercase tracking-[0.1em] text-[#c8beb4] transition-colors hover:text-[#f2ede8]"
                >
                  Overview
                </Link>
              </div>
            </div>

            <div className="min-w-[220px] space-y-3">
              <div className="flex justify-end">
                <AdminSignOutButton />
              </div>

              <div className="rounded-xl border border-[#2e2a25] bg-[#171310] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-[#8c7f74]">Visible Leads</p>
                <p className="mt-2 text-2xl font-semibold text-[#f2ede8]">{results.total}</p>
                <p className="mt-1 text-xs text-[#8c7f74]">All leads</p>
              </div>
            </div>
          </div>
        </header>

        <section>
          <AdminLeadsTableClient leads={results.leads} />
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#2e2a25] bg-[#16120f] p-4">
          <p className="text-sm text-[#8c7f74]">
            Showing page <span className="text-[#f2ede8]">{results.page}</span> of{" "}
            <span className="text-[#f2ede8]">{results.totalPages}</span>
          </p>

          <div className="flex items-center gap-2">
            <Link
              href={buildAdminHref({ ...paginationFilters, page: results.page - 1 })}
              aria-disabled={!results.hasPrevPage}
              className={`inline-flex h-10 items-center rounded-lg border px-4 text-sm transition-colors ${
                results.hasPrevPage
                  ? "border-[#2e2a25] text-[#c8beb4] hover:text-[#f2ede8]"
                  : "pointer-events-none border-[#252018] text-[#5a5048]"
              }`}
            >
              Previous
            </Link>

            <Link
              href={buildAdminHref({ ...paginationFilters, page: results.page + 1 })}
              aria-disabled={!results.hasNextPage}
              className={`inline-flex h-10 items-center rounded-lg border px-4 text-sm transition-colors ${
                results.hasNextPage
                  ? "border-[#2e2a25] text-[#c8beb4] hover:text-[#f2ede8]"
                  : "pointer-events-none border-[#252018] text-[#5a5048]"
              }`}
            >
              Next
            </Link>
          </div>
        </footer>
      </section>
    </main>
  );
}
