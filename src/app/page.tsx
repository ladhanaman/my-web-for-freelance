import ContactSection     from "@/components/ContactSection";
import Framescape          from "@/components/Framescape";
import GridBackground      from "@/components/GridBackground";
import GunHeroClient       from "@/components/GunHeroClient";
import HeroSection         from "@/components/HeroSection";
import KairosFooter        from "@/components/KairosFooter";
import LandingPageWrapper  from "@/components/LandingPageWrapper";
import NavBar              from "@/components/NavBar";
import { SECTION_IDS }    from "@/lib/collections";

export default function Home() {
  return (
    <>
      {/* ── Black placeholder — server-rendered instantly, hides home until LandingPage mounts ── */}
      <div
        id="landing-placeholder"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 499,
          background: '#000',
          pointerEvents: 'none',
        }}
      />

      {/* ── Landing splash — fixed overlay, exits on "Open" click ── */}
      <LandingPageWrapper />

      {/*
       * background: "#100e0c" blocks the sticky footer (z-index 0) from
       * bleeding through the transparent sections while main is in view.
       * GridBackground stays inside so it paints within main's stacking context.
       */}
      <main className="relative" style={{ overflowX: "clip", zIndex: 1, background: "#100e0c" }}>

        <NavBar />

        {/* ── Interactive canvas grid (behind everything) ── */}
        <GridBackground />

        {/* ── Screen 1: Hero with pixel trail ── */}
        <HeroSection />

        {/* ── Screen 2: Gun ── */}
        <div id={SECTION_IDS.gun} style={{ height: "200vh" }}>
          <GunHeroClient />
        </div>

        {/* ── Screen 3: Framescape photography ── */}
        <Framescape />

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
          id={SECTION_IDS.onekoCat}
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
            <h1 style={{
              fontSize: "clamp(2.6rem, 5.2vw, 5rem)",
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: "-0.04em",
              color: "#f2ede8",
            }}>
              Let&apos;s Build What Matters
            </h1>
            <p className="mt-4 text-base text-[#8c7f74] sm:text-lg max-w-lg mx-auto leading-relaxed">
              Bring the ambition. I&apos;ll handle the bottlenecks.
            </p>
          </header>

          <ContactSection />
        </section>

      </main>

      {/* ── Footer — sticky reveal, black placeholder for now ── */}
      <KairosFooter />
    </>
  );
}
