import AnimatedGradientBackground from "@/components/AnimatedGradientBackground";

export const metadata = {
  title: "Desktop Only",
  robots: "noindex, nofollow",
};

export default function MobilePage() {
  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <AnimatedGradientBackground Breathing={true} />

      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
        <p
          className="text-xs tracking-[0.3em] uppercase"
          style={{ color: "#8c7f74" }}
        >
          Desktop Only
        </p>

        <h1
          className="text-3xl font-bold leading-snug"
          style={{ fontFamily: "var(--font-fraunces)", color: "#f2ede8" }}
        >
          This site was crafted for<br />the full-screen experience.
        </h1>

        <p
          className="max-w-xs text-sm leading-relaxed"
          style={{ color: "#8c7f74" }}
        >
          Open this on a laptop and<br />see what you&apos;re missing.
        </p>
      </div>
    </div>
  );
}
