"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminSignOutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function onSignOut() {
    setIsLoading(true);

    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("[AdminSignOutButton] Logout request failed:", err);
    } finally {
      setIsLoading(false);
      router.push("/admin/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={() => void onSignOut()}
      className="inline-flex h-9 items-center rounded-lg border border-[#2e2a25] px-3 text-xs uppercase tracking-[0.1em] text-[#c8beb4] transition-colors hover:text-[#f2ede8] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? "Locking..." : "Lock Admin"}
    </button>
  );
}
