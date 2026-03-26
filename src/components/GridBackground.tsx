"use client";

import { useEffect, useRef, useCallback } from "react";

// ── Tuning constants ──────────────────────────────────────────────
const GRID    = 64;   // px between grid lines
const RADIUS  = 500;  // magnetic influence radius in px
const PULL    = 16;   // max displacement in px
const SPRING  = 0.09; // stiffness
const DAMP    = 0.65; // damping

// Accent colour components (warm terracotta #C07548)
const ACCENT = { r: 192, g: 117, b: 72 };
// Resting line colour (warm cream)
const REST   = { r: 242, g: 220, b: 190 };

interface Pt {
  ox: number; oy: number;
  x:  number; y:  number;
  vx: number; vy: number;
}

export default function GridBackground() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const gridRef    = useRef<Pt[][]>([]);
  const mouseRef   = useRef({ x: -9999, y: -9999 });
  const scrollRef  = useRef(0);               // tracks window.scrollY
  const rafRef     = useRef<number>(0);

  const buildGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;

    const cols = Math.ceil(W / GRID) + 2;
    const rows = Math.ceil(H / GRID) + 2;
    const g: Pt[][] = [];

    for (let c = 0; c < cols; c++) {
      g[c] = [];
      for (let r = 0; r < rows; r++) {
        const ox = c * GRID;
        const oy = r * GRID;
        g[c][r] = { ox, oy, x: ox, y: oy, vx: 0, vy: 0 };
      }
    }
    gridRef.current = g;
  }, []);

  const tick = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width: W, height: H } = canvas;
    const { x: mx, y: my } = mouseRef.current;
    const grid = gridRef.current;

    // Disable magnetism while the hero section is in view
    const onHero = scrollRef.current < window.innerHeight;

    ctx.clearRect(0, 0, W, H);

    // ── 1. Physics update ─────────────────────────────────────────
    for (const col of grid) {
      for (const p of col) {
        const dx = mx - p.ox;
        const dy = my - p.oy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let tx = p.ox, ty = p.oy;

        // Only apply magnetic pull when NOT on the hero screen
        if (!onHero && dist < RADIUS && dist > 0) {
          const strength = Math.pow(1 - dist / RADIUS, 2);
          tx = p.ox + (dx / dist) * strength * PULL;
          ty = p.oy + (dy / dist) * strength * PULL;
        }

        p.vx = (p.vx + (tx - p.x) * SPRING) * DAMP;
        p.vy = (p.vy + (ty - p.y) * SPRING) * DAMP;
        p.x += p.vx;
        p.y += p.vy;
      }
    }

    const ratio = (p: Pt) =>
      Math.min(Math.sqrt((p.x - p.ox) ** 2 + (p.y - p.oy) ** 2) / PULL, 1);

    const lineColor = (r: number) => {
      const rv = Math.round(REST.r + (ACCENT.r - REST.r) * r);
      const gv = Math.round(REST.g + (ACCENT.g - REST.g) * r);
      const bv = Math.round(REST.b + (ACCENT.b - REST.b) * r);
      const a  = 0.045 + r * 0.22;
      return `rgba(${rv},${gv},${bv},${a})`;
    };

    // ── 2. Horizontal lines ──────────────────────────────────────
    ctx.lineWidth = 1;
    for (let r = 0; r < (grid[0]?.length ?? 0); r++) {
      for (let c = 0; c < grid.length - 1; c++) {
        const p1 = grid[c][r];
        const p2 = grid[c + 1][r];
        const t  = Math.max(ratio(p1), ratio(p2));
        ctx.strokeStyle = lineColor(t);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }

    // ── 3. Vertical lines ────────────────────────────────────────
    for (let c = 0; c < grid.length; c++) {
      for (let r = 0; r < grid[c].length - 1; r++) {
        const p1 = grid[c][r];
        const p2 = grid[c][r + 1];
        const t  = Math.max(ratio(p1), ratio(p2));
        ctx.strokeStyle = lineColor(t);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }

    // ── 4. Intersection dots ─────────────────────────────────────
    for (const col of grid) {
      for (const p of col) {
        const t  = ratio(p);
        const rv = Math.round(REST.r + (ACCENT.r - REST.r) * t);
        const gv = Math.round(REST.g + (ACCENT.g - REST.g) * t);
        const bv = Math.round(REST.b + (ACCENT.b - REST.b) * t);
        const a  = 0.1 + t * 0.75;
        const sz = 1.0 + t * 2.5;

        ctx.beginPath();
        ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rv},${gv},${bv},${a})`;
        ctx.fill();

        if (t > 0.4) {
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, sz * 5);
          grd.addColorStop(0, `rgba(${rv},${gv},${bv},${t * 0.1875})`);
          grd.addColorStop(1, "rgba(0,0,0,0)");
          ctx.beginPath();
          ctx.arc(p.x, p.y, sz * 5, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    buildGrid();

    const onMove   = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    const onLeave  = () => { mouseRef.current = { x: -9999, y: -9999 }; };
    const onScroll = () => { scrollRef.current = window.scrollY; };
    const onResize = () => { buildGrid(); };

    window.addEventListener("mousemove",  onMove);
    window.addEventListener("scroll",     onScroll, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize",     onResize);

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove",  onMove);
      window.removeEventListener("scroll",     onScroll);
      document.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize",     onResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [buildGrid, tick]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 h-full w-full"
      style={{ zIndex: 0 }}
    />
  );
}
