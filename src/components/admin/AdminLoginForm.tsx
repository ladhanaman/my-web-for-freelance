"use client";

import { useActionState } from "react";

import type { AdminLoginState } from "@/app/admin/login/actions";

interface AdminLoginFormProps {
  action: (state: AdminLoginState, formData: FormData) => Promise<AdminLoginState>;
}

const INITIAL_STATE: AdminLoginState = {};

export default function AdminLoginForm({ action }: AdminLoginFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="password" className="text-xs uppercase tracking-[0.16em] text-[#8c7f74]">
          Admin Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="h-11 w-full rounded-lg border border-[#2e2a25] bg-[#110e0c] px-3 text-sm text-[#f2ede8] outline-none ring-0 transition-colors placeholder:text-[#5f554c] focus:border-[#C07548]"
          placeholder="Enter password"
          required
        />
      </div>

      {state.error ? (
        <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[#C07548]/50 bg-[#C07548]/15 px-4 text-sm font-semibold text-[#f7e6d8] transition-colors hover:bg-[#C07548]/25 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Verifying..." : "Unlock Admin"}
      </button>
    </form>
  );
}
