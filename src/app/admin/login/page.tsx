import Link from "next/link";

import AdminLoginForm from "@/components/admin/AdminLoginForm";

import { adminLoginAction } from "./actions";

interface AdminLoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getNextPath(rawValue: string | string[] | undefined): string {
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/admin";
  }

  return value;
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const nextPath = getNextPath(params.next);
  const action = adminLoginAction.bind(null, nextPath);

  return (
    <main className="min-h-screen bg-[#100e0c] px-4 py-16 sm:px-8">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-[#2e2a25] bg-[#171310] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#C07548]">Admin Access</p>
        <h1 className="mt-2 text-2xl font-semibold text-[#f2ede8]">Unlock dashboard</h1>
        <p className="mt-2 text-sm text-[#8c7f74]">
          Enter your admin password to continue.
        </p>

        <div className="mt-6">
          <AdminLoginForm action={action} />
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-xs uppercase tracking-[0.12em] text-[#8c7f74] transition-colors hover:text-[#f2ede8]">
            Back to site
          </Link>
        </div>
      </section>
    </main>
  );
}
