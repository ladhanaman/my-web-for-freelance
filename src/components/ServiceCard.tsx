"use client";

import { ReactNode } from "react";

interface ServiceCardProps {
  label: string;
  icon: ReactNode;
  selected: boolean;
  onToggle: () => void;
}

export default function ServiceCard({ label, icon, selected, onToggle }: ServiceCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-3 rounded-xl border px-4 h-14 w-full text-left text-sm font-medium
        cursor-pointer select-none transition-all duration-200
        ${selected
          ? "border-[#C07548] bg-[#C07548]/10 text-[#f2ede8]"
          : "border-[#2e2a25] bg-transparent text-[#8c7f74] hover:border-[#3d362e] hover:text-[#f2ede8]"
        }`}
    >
      <span className={`shrink-0 transition-colors duration-200
        ${selected ? "text-[#C07548]" : "text-[#4a4038]"}`}>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}
