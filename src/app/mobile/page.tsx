import AnimatedGradientBackground from "@/components/AnimatedGradientBackground";
import CatLottie from "@/components/CatLottie";

export const metadata = {
  title: "Desktop Only",
  robots: "noindex, nofollow",
};

export default function MobilePage() {
  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <AnimatedGradientBackground Breathing={true} />

      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
        <CatLottie />
        <p
          className="text-xs tracking-[0.3em] uppercase anim-fade-up"
          style={{ color: "#8c7f74", animationDelay: "0.15s" }}
        >
          Desktop Only
        </p>

        <h1
          className="text-base sm:text-lg leading-loose anim-fade-up"
          style={{ fontFamily: "var(--font-press-start)", color: "#f2ede8", animationDelay: "0.3s", letterSpacing: "1px" }}
        >
          This site was crafted for<br />the full-screen experience.
        </h1>

        <p
          className="max-w-xs text-sm leading-relaxed anim-fade-up"
          style={{ color: "#8c7f74", animationDelay: "0.45s" }}
        >
          Open this on a laptop and<br />see what you&apos;re missing.
        </p>
      </div>
    </div>
  );
}
