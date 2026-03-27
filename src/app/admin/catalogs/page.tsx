import Link from "next/link";

import AdminSignOutButton from "@/components/admin/AdminSignOutButton";

import AdminCatalogsClient from "@/components/admin/AdminCatalogsClient";
import { AdminCatalogApiError, getBackendBaseUrlForClient } from "@/lib/admin-catalogs-api";

export const dynamic = "force-dynamic";

function getClientBackendBaseUrl(): { value: string | null; error: string | null } {
  try {
    return { value: getBackendBaseUrlForClient(), error: null };
  } catch (error) {
    if (error instanceof AdminCatalogApiError) {
      return { value: null, error: error.message };
    }

    return { value: null, error: "Failed to load backend configuration." };
  }
}

export default function AdminCatalogsPage() {
  const backendBaseUrl = getClientBackendBaseUrl();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#100e0c] px-4 py-10 sm:px-8 lg:px-12">
      <div
        className="pointer-events-none absolute top-[-120px] right-[-90px] h-[420px] w-[420px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(192,117,72,0.26) 0%, transparent 68%)",
          filter: "blur(72px)",
        }}
      />

      <section className="relative z-10 mx-auto w-full max-w-[1400px] space-y-6">
        <header className="rounded-2xl border border-[#2e2a25] bg-[linear-gradient(145deg,#18130f_0%,#221a14_60%,#1a1410_100%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C07548]">
                Admin Console
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#f2ede8] sm:text-4xl">
                Catalog Uploads
              </h1>
              <p className="mt-2 text-sm text-[#8c7f74] sm:text-base">
                Upload and manage your catalog photos, cover images, and metadata.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link
                  href="/admin"
                  className="inline-flex h-9 items-center rounded-lg border border-[#2e2a25] px-3 text-xs uppercase tracking-[0.1em] text-[#c8beb4] transition-colors hover:text-[#f2ede8]"
                >
                  Overview
                </Link>
                <Link
                  href="/admin/leads"
                  className="inline-flex h-9 items-center rounded-lg border border-[#2e2a25] px-3 text-xs uppercase tracking-[0.1em] text-[#c8beb4] transition-colors hover:text-[#f2ede8]"
                >
                  Leads
                </Link>
              </div>
            </div>

            <AdminSignOutButton />
          </div>
        </header>

        {backendBaseUrl.error ? (
          <section className="rounded-2xl border border-red-400/30 bg-red-500/10 p-6">
            <p className="text-[11px] uppercase tracking-[0.14em] text-red-300">Configuration Error</p>
            <p className="mt-2 text-sm text-red-100">{backendBaseUrl.error}</p>
          </section>
        ) : (
          <AdminCatalogsClient backendBaseUrl={backendBaseUrl.value ?? ""} />
        )}
      </section>
    </main>
  );
}
