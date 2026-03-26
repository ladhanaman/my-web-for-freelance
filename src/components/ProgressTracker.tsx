"use client";

interface ProgressTrackerProps {
  completed: number;
  total: number;
}

export default function ProgressTracker({ completed, total }: ProgressTrackerProps) {
  const pct = Math.round((completed / total) * 100);
  const done = pct === 100;

  return (
    <div className="rounded-2xl border border-[#2e2a25] bg-[#1c1916] p-5 card-hover">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[#f2ede8]">Form Progress</span>
        <span
          className="text-sm font-bold tabular-nums transition-all duration-300"
          style={{ color: done ? "#6dbb6d" : "#C07548" }}
        >
          {completed}/{total}
        </span>
      </div>

      {/* Progress track */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#2e2a25]">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: done
              ? "linear-gradient(90deg, #4ade80, #22c55e)"
              : "linear-gradient(90deg, #C07548, #d98a60)",
            boxShadow: pct > 0 ? "0 0 10px rgba(192,117,72,0.55)" : "none",
          }}
        />
      </div>

    </div>
  );
}
