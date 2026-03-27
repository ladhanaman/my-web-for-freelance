import Link from "next/link";

import AdminSignOutButton from "@/components/admin/AdminSignOutButton";

const ADMIN_SECTIONS = [
  {
    title: "Catalog Uploads",
    description:
      "Manage the 9 photography catalogs, upload JPEG/PNG files, choose cover images, and curate catalog metadata.",
    href: "/admin/catalogs",
    accent: "rgba(192,117,72,0.26)",
    statLabel: "Primary",
  },
  {
    title: "Leads Dashboard",
    description: "Read-only view of contact submissions captured from your live website forms.",
    href: "/admin/leads",
    accent: "rgba(114,148,196,0.24)",
    statLabel: "Monitoring",
  },
] as const;

export default function AdminOverviewPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#100e0c] px-4 py-10 sm:px-8 lg:px-12">
      <div
        className="pointer-events-none absolute top-[-120px] right-[-90px] h-[420px] w-[420px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(192,117,72,0.26) 0%, transparent 68%)",
          filter: "blur(72px)",
        }}
      />

      <section className="relative z-10 mx-auto w-full max-w-[1200px] space-y-6">
        <header className="rounded-2xl border border-[#2e2a25] bg-[linear-gradient(145deg,#18130f_0%,#221a14_60%,#1a1410_100%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C07548]">
                Admin Console
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#f2ede8] sm:text-4xl">
                Dashboard Overview
              </h1>
              <p className="mt-2 text-sm text-[#8c7f74] sm:text-base">
                Choose a workspace to manage catalogs or review incoming leads.
              </p>
            </div>

            <AdminSignOutButton />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {ADMIN_SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="group relative overflow-hidden rounded-2xl border border-[#2e2a25] bg-[#171310] p-6 transition-colors hover:border-[#C07548]/40"
            >
              <div
                className="pointer-events-none absolute -right-8 -bottom-8 h-32 w-32 rounded-full opacity-50 blur-3xl"
                style={{ background: `radial-gradient(circle, ${section.accent} 0%, transparent 70%)` }}
              />

              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8c7f74]">{section.statLabel}</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#f2ede8]">{section.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#a19386]">{section.description}</p>
              <span className="mt-5 inline-flex items-center text-sm font-medium text-[#c8beb4] transition-colors group-hover:text-[#f2ede8]">
                Open section →
              </span>
            </Link>
          ))}
        </section>
      </section>
    </main>
  );
}
