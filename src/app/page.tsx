import ContactSection  from "@/components/ContactSection";
import GridBackground   from "@/components/GridBackground";
import GunHeroClient    from "@/components/GunHeroClient";
import HeroSection      from "@/components/HeroSection";

export default function Home() {
  return (
    <main className="relative" style={{ overflowX: "clip" }}>

      {/* ── Interactive canvas grid (behind everything) ── */}
      <GridBackground />

      {/* ── Screen 1: Hero with pixel trail ── */}
      <HeroSection />

      {/* ── Screen 2: Gun — 300 vh container (100 vh settle + 100 vh animate) ── */}
      <GunHeroClient />

      {/* ── Warm gradient orbs ── */}
      <div
        className="pointer-events-none absolute top-[-100px] right-[-60px] h-[500px] w-[500px] rounded-full anim-float anim-glow-pulse"
        style={{
          zIndex: 1,
          background: "radial-gradient(circle, rgba(192,117,72,0.2) 0%, transparent 68%)",
          filter: "blur(72px)",
        }}
      />
      <div
        className="pointer-events-none absolute top-[25%] left-[-80px] h-[420px] w-[420px] rounded-full anim-float-alt anim-glow-pulse"
        style={{
          background: "radial-gradient(circle, rgba(120,60,20,0.22) 0%, transparent 68%)",
          filter: "blur(80px)",
          animationDelay: "2s",
        }}
      />

      {/* ── Contact form section ── */}
      <section
        id="contact"
        className="relative z-10 mx-auto w-[94%] sm:w-[85%] lg:w-[75%] xl:w-[70%] 2xl:w-[65%] max-w-[1400px] py-12 sm:py-16 lg:py-20"
      >
        <header className="mb-12 text-center anim-fade-up" style={{ animationDelay: "0ms" }}>
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="h-px w-10 sm:w-14 bg-[#C07548]/50" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C07548]">
              Get Started
            </span>
            <div className="h-px w-10 sm:w-14 bg-[#C07548]/50" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#f2ede8] sm:text-5xl lg:text-[3.4rem] lg:leading-tight">
            Let&apos;s Talk About Your Project
          </h1>
          <p className="mt-4 text-base text-[#8c7f74] sm:text-lg max-w-lg mx-auto leading-relaxed">
            Tell us what you&apos;re building and we&apos;ll show you how AI can
            accelerate it.
          </p>
        </header>

        <ContactSection />
      </section>

    </main>
  );
}
