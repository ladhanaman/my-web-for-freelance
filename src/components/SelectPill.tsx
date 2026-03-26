"use client";

import { ReactNode } from "react";

interface SelectPillProps {
  label: string;
  icon?: ReactNode;
  selected: boolean;
  onClick: () => void;
}

export default function SelectPill({ label, icon, selected, onClick }: SelectPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium
        cursor-pointer select-none transition-all duration-200
        ${selected
          ? "border-[#C07548] bg-[#C07548] text-white shadow-[0_0_14px_rgba(192,117,72,0.38)] scale-[1.03]"
          : "border-[#2e2a25] bg-transparent text-[#8c7f74] hover:border-[#C07548]/35 hover:text-[#f2ede8] hover:bg-[#C07548]/6"
        }`}
    >
      {icon && (
        <span className={selected ? "text-white" : "text-[#4a4038]"}>{icon}</span>
      )}
      {label}
    </button>
  );
}
