"use client";

import { useEffect, useRef, useState } from "react";

// ─── Display ─────────────────────────────────────────────────────────────────
const CELL   = 4;
const COLS   = 16;
const ROWS   = 14;
const DISP_W = 96;
const DISP_H = Math.round(DISP_W * ROWS / COLS); // 84
const CW     = COLS * CELL;                        // canvas px
const CH     = ROWS * CELL;
const GROUND = 8;   // px gap from viewport bottom edge

// ─── Behaviour ───────────────────────────────────────────────────────────────
const WALK_DIST  = 40;
const RUN_DIST   = 140;
const ARRIVE     = 6;
const LERP_WALK  = 0.055;
const LERP_RUN   = 0.095;
const LERP_STOP  = 0.04;
const WALK_MS    = 115;   // ms per walk frame
const RUN_MS     = 60;    // ms per run frame
const IDLE_SIT   = 3200;  // ms idle  → sit
const SIT_STAND  = 5000;  // ms sit   → stand
const BLINK_MIN  = 3000;
const BLINK_RANGE = 2000;
const BLINK_DUR  = 110;

// ─── Palette ─────────────────────────────────────────────────────────────────
const _ = "transparent";
const K = "#1a0e06"; // dark outline
const O = "#d4853a"; // main orange fur
const L = "#9e5c1a"; // darker fur / saddle
const C = "#f5e8d0"; // cream
const E = "#2a6ee8"; // corgi-blue eye
const P = "#d45878"; // pink (inner ear, nose)
const R = "#cc3333"; // red collar
const W = "#f0ece4"; // white belly

// ─── Shared body (rows 0-11) ─────────────────────────────────────────────────
const BODY: string[][] = [
  [_,_,_,_,K,O,O,K,_,_,_,_,_,_,_,_],  // 0  ears
  [_,_,_,K,P,O,O,P,K,_,_,_,_,_,_,_],  // 1  inner ear tips
  [_,_,_,K,O,O,O,O,K,K,_,_,_,_,_,_],  // 2
  [_,_,K,O,E,L,O,O,E,O,K,_,_,_,_,_],  // 3  eyes + saddle
  [_,_,K,O,O,O,O,O,O,O,K,_,_,_,_,_],  // 4
  [_,_,K,O,C,O,P,O,C,O,K,_,_,_,_,_],  // 5  cheeks + nose
  [_,_,_,K,O,O,O,O,O,K,_,_,_,_,_,_],  // 6
  [_,K,O,O,O,R,R,R,O,O,O,K,_,_,_,_],  // 7  collar
  [K,O,O,O,O,O,O,O,O,O,O,O,K,_,_,_],  // 8  body
  [K,O,L,O,W,W,W,W,O,L,O,O,K,_,K,O],  // 9  belly + tail base
  [K,O,O,O,W,W,W,O,O,O,O,O,K,K,O,_],  // 10
  [_,K,K,O,O,O,O,O,O,K,K,_,_,_,_,_],  // 11
];

const BODY_BLINK: string[][] = [
  ...BODY.slice(0, 3),
  [_,_,K,O,K,L,O,O,K,O,K,_,_,_,_,_],  // 3  eyes closed
  ...BODY.slice(4),
];

// ─── Leg rows (rows 12-13) ────────────────────────────────────────────────────

// Walk — 4-frame alternating gait: contact → passing → contact → passing
const WALK_LEGS: string[][][] = [
  [ [K,O,K,_,_,_,_,_,_,_,K,O,K,_,_,_], [K,K,_,_,_,_,_,_,_,_,_,K,K,_,_,_] ],  // W0 LF+RB reach
  [ [_,K,O,K,_,_,_,_,_,K,O,K,_,_,_,_], [_,_,K,K,_,_,_,_,_,_,K,K,_,_,_,_] ],  // W1 passing (high)
  [ [_,_,K,O,K,_,_,K,O,K,_,_,_,_,_,_], [_,_,_,K,K,_,_,_,K,K,_,_,_,_,_,_] ],  // W2 RF+LB reach
  [ [_,K,C,K,_,_,_,_,K,C,K,_,_,_,_,_], [_,K,K,_,_,_,_,_,_,K,K,_,_,_,_,_] ],  // W3 passing (low)
];

// Run — 4-frame gallop: full-stretch → gathering → full-stretch → gathering
const RUN_LEGS: string[][][] = [
  [ [K,O,K,_,_,_,_,_,_,_,K,O,K,_,_,_], [K,K,_,_,_,_,_,_,_,_,_,K,K,_,_,_] ],  // R0 full extension
  [ [_,_,_,K,O,K,K,O,K,_,_,_,_,_,_,_], [_,_,_,_,K,K,_,K,K,_,_,_,_,_,_,_] ],  // R1 gathering
  [ [_,K,O,K,_,_,_,_,_,K,O,K,_,_,_,_], [_,K,K,_,_,_,_,_,_,_,K,K,_,_,_,_] ],  // R2 extension alt
  [ [_,_,K,O,K,K,O,K,_,_,_,_,_,_,_,_], [_,_,_,K,K,_,K,K,_,_,_,_,_,_,_,_] ],  // R3 gathering
];

// Standing idle
const IDLE_LEGS: string[][] = [
  [_,K,C,K,_,_,_,_,K,C,K,_,_,_,_,_],
  [_,K,K,_,_,_,_,_,_,K,K,_,_,_,_,_],
];

// Jump (legs tucked)
const JUMP_LEGS: string[][] = [
  [_,K,K,K,O,_,_,O,K,K,K,_,_,_,_,_],
  [_,_,K,O,K,_,_,K,O,K,_,_,_,_,_,_],
];

// Sit — replaces rows 9-13 (haunches + folded legs)
const SIT_LOWER: string[][] = [
  [K,O,L,O,W,W,W,W,O,L,O,O,K,_,K,O],  // 9  tail still wags
  [K,O,O,O,W,W,W,W,W,W,O,O,K,K,O,_],  // 10 belly wider (sitting posture)
  [K,O,O,W,W,W,W,W,W,O,O,O,K,_,_,_],  // 11 haunches visible
  [_,K,O,O,O,O,O,O,O,O,K,_,_,_,_,_],  // 12 folded back legs
  [_,K,K,K,K,K,K,K,K,K,K,_,_,_,_,_],  // 13 paws flat on ground
];

// ─── Assemble full 14-row frames ─────────────────────────────────────────────
const mk = (body: string[][], legs: string[][]): string[][] => [...body, ...legs];

const F_IDLE       = mk(BODY,       IDLE_LEGS);
const F_IDLE_BLINK = mk(BODY_BLINK, IDLE_LEGS);
const F_WALK       = WALK_LEGS.map(l => mk(BODY, l));
const F_RUN        = RUN_LEGS.map(l  => mk(BODY, l));
const F_JUMP       = mk(BODY, JUMP_LEGS);
const F_SIT        = [...BODY.slice(0, 9), ...SIT_LOWER];

// ─── Paw cursor (SVG → base64) ────────────────────────────────────────────────
const PAW_SVG = [
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">`,
  `<ellipse cx="16" cy="22" rx="8" ry="6" fill="#1a0e06"/>`,
  `<circle cx="9"  cy="14" r="4"   fill="#1a0e06"/>`,
  `<circle cx="23" cy="14" r="4"   fill="#1a0e06"/>`,
  `<circle cx="13" cy="8"  r="3"   fill="#1a0e06"/>`,
  `<circle cx="21" cy="8"  r="3"   fill="#1a0e06"/>`,
  `</svg>`,
].join("");

// ─── Renderer ────────────────────────────────────────────────────────────────
function drawSprite(
  ctx: CanvasRenderingContext2D,
  frame: string[][],
  flipX: boolean,
  sx: number,
  sy: number,
  wobble: number,
  tailWag: number,
) {
  ctx.clearRect(0, 0, CW, CH);
  ctx.save();
  ctx.translate(CW / 2, CH / 2);
  ctx.rotate(wobble);
  ctx.scale(flipX ? -sx : sx, sy);
  ctx.translate(-CW / 2, -CH / 2);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const col = frame[r]?.[c];
      if (!col || col === "transparent") continue;
      ctx.fillStyle = col;
      ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
    }
  }

  // Animated tail tip (waggle drawn separately so it isn't clipped by sprite bounds)
  ctx.save();
  ctx.translate(13 * CELL, 9 * CELL);
  ctx.rotate(tailWag * 0.65);
  ctx.fillStyle = O; ctx.fillRect(0,         0,         CELL, CELL);
  ctx.fillStyle = L; ctx.fillRect(CELL,      -CELL,     CELL, CELL);
  ctx.fillStyle = O; ctx.fillRect(CELL * 2,  -CELL * 2, CELL, CELL);
  ctx.restore();

  ctx.restore();
}

// ─── Component ───────────────────────────────────────────────────────────────
type DogState = "idle" | "sit" | "walk" | "run" | "jump";

export default function PixelDog() {
  const [mounted, setMounted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);

  // Position
  const posX    = useRef(0);
  const targetX = useRef(0);
  const groundY = useRef(0);

  // Animation state
  const state     = useRef<DogState>("idle");
  const facingR   = useRef(true);
  const frameIdx  = useRef(0);
  const frameTick = useRef(0);
  const idleMs    = useRef(0);

  // Tail
  const tailWag = useRef(0);
  const tailDir = useRef(1);

  // Blink
  const blinkMs   = useRef(0);
  const blinking  = useRef(false);
  const blinkNext = useRef(BLINK_MIN + Math.random() * BLINK_RANGE);

  // Jump
  const jumpVY = useRef(0);
  const jumpY  = useRef(0);

  const rafRef   = useRef<number>(0);
  const prevTime = useRef(0);

  useEffect(() => {
    const startX = window.innerWidth / 2 - DISP_W / 2;
    posX.current     = startX;
    targetX.current  = startX;
    groundY.current  = window.innerHeight - DISP_H - GROUND;
    setMounted(true);

    // Paw cursor
    document.body.style.cursor =
      `url("data:image/svg+xml;base64,${btoa(PAW_SVG)}") 16 28, auto`;

    const onMouseMove = (e: MouseEvent) => {
      targetX.current = e.clientX - DISP_W / 2;
    };
    const onTouchMove = (e: TouchEvent) => {
      targetX.current = e.touches[0].clientX - DISP_W / 2;
    };
    const onResize = () => {
      groundY.current = window.innerHeight - DISP_H - GROUND;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("resize",    onResize);

    const tick = (now: number) => {
      const dt   = Math.min(now - (prevTime.current || now), 50);
      prevTime.current = now;

      const s    = state.current;
      const dx   = targetX.current - posX.current;
      const dist = Math.abs(dx);

      // ── State transitions ────────────────────────────────────
      if (s === "jump") {
        jumpVY.current += 1.3;
        jumpY.current  += jumpVY.current;
        if (jumpY.current >= 0) {
          jumpY.current    = 0;
          jumpVY.current   = 0;
          state.current    = "idle";
          idleMs.current   = 0;
        }
      } else if (s === "idle" || s === "sit") {
        idleMs.current += dt;
        if (dist > RUN_DIST)  { state.current = "run";  frameIdx.current = 0; idleMs.current = 0; }
        else if (dist > WALK_DIST) { state.current = "walk"; frameIdx.current = 0; idleMs.current = 0; }
        else if (s === "idle" && idleMs.current >= IDLE_SIT)  { state.current = "sit";  idleMs.current = 0; }
        else if (s === "sit"  && idleMs.current >= SIT_STAND) { state.current = "idle"; idleMs.current = 0; }
      } else if (s === "walk") {
        if (dist > RUN_DIST)   { state.current = "run";  frameIdx.current = 0; }
        else if (dist < ARRIVE){ state.current = "idle"; idleMs.current   = 0; }
      } else if (s === "run") {
        if (dist < WALK_DIST)  { state.current = "walk"; frameIdx.current = 0; }
      }

      // ── Movement ─────────────────────────────────────────────
      const s2 = state.current;
      if (s2 !== "sit") {
        const lr =
          s2 === "run"  ? LERP_RUN  :
          s2 === "walk" ? LERP_WALK : LERP_STOP;
        posX.current += dx * lr;
      }
      posX.current = Math.max(0, Math.min(window.innerWidth - DISP_W, posX.current));

      if (Math.abs(dx) > 2) facingR.current = dx > 0;

      // ── Frame cycling ────────────────────────────────────────
      if (s2 === "walk" || s2 === "run") {
        frameTick.current += dt;
        const ms = s2 === "run" ? RUN_MS : WALK_MS;
        if (frameTick.current >= ms) {
          frameTick.current = 0;
          frameIdx.current  = (frameIdx.current + 1) % 4;
        }
      }

      // ── Blink ────────────────────────────────────────────────
      blinkMs.current += dt;
      if (!blinking.current && blinkMs.current >= blinkNext.current) {
        blinking.current  = true;
        blinkMs.current   = 0;
      }
      if (blinking.current && blinkMs.current >= BLINK_DUR) {
        blinking.current  = false;
        blinkMs.current   = 0;
        blinkNext.current = BLINK_MIN + Math.random() * BLINK_RANGE;
      }

      // ── Tail wag ─────────────────────────────────────────────
      const wagRate = (s2 === "idle" || s2 === "sit") ? 0.0038 : 0.0072;
      tailWag.current += tailDir.current * dt * wagRate;
      if (tailWag.current >  1) { tailWag.current =  1; tailDir.current = -1; }
      if (tailWag.current < -1) { tailWag.current = -1; tailDir.current =  1; }

      // ── Squash & stretch ─────────────────────────────────────
      const vel      = dx * (s2 === "run" ? LERP_RUN : LERP_WALK);
      const velMag   = Math.abs(vel);
      const maxStr   = s2 === "run" ? 0.38 : 0.26;
      const stretch  = Math.min(velMag * 0.14, maxStr);
      const scaleX   = s2 === "jump" ? 0.86 : 1 + stretch;
      const scaleY   = s2 === "jump" ? 1.18 : Math.max(0.75, 1 - stretch * 0.5);
      const wobble   = vel * 0.045;

      // ── Pick frame ───────────────────────────────────────────
      const fi    = frameIdx.current % 4;
      const frame =
        s2 === "jump" ? F_JUMP :
        s2 === "sit"  ? F_SIT  :
        s2 === "run"  ? F_RUN[fi]  :
        s2 === "walk" ? F_WALK[fi] :
        blinking.current ? F_IDLE_BLINK : F_IDLE;

      // ── DOM ──────────────────────────────────────────────────
      const extraY = s2 === "jump" ? jumpY.current : 0;
      if (wrapRef.current) {
        wrapRef.current.style.transform =
          `translate(${posX.current}px, ${groundY.current + extraY}px)`;
      }
      if (shadowRef.current) {
        const lift = Math.min(Math.abs(extraY) / 60, 1);
        shadowRef.current.style.transform = `scaleX(${1 - lift * 0.6})`;
        shadowRef.current.style.opacity   = String(0.4 - lift * 0.3);
      }

      // ── Canvas ───────────────────────────────────────────────
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) drawSprite(ctx, frame, !facingR.current, scaleX, scaleY, wobble, tailWag.current);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("resize",    onResize);
      document.body.style.cursor = "";
    };
  }, []);

  const handleClick = () => {
    if (state.current === "jump") return;
    state.current  = "jump";
    jumpVY.current = -18;
    jumpY.current  = 0;
    frameIdx.current = 0;
    idleMs.current   = 0;
  };

  if (!mounted) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, zIndex: 9999, pointerEvents: "none" }}>
      <div ref={wrapRef} style={{ position: "absolute", top: 0, left: 0 }}>
        <canvas
          ref={canvasRef}
          width={CW}
          height={CH}
          onClick={handleClick}
          style={{
            width:          DISP_W,
            height:         DISP_H,
            imageRendering: "pixelated",
            display:        "block",
            pointerEvents:  "auto",
            cursor:         "inherit",
          }}
          title="Click to jump!"
        />
        <div
          ref={shadowRef}
          style={{
            width:        DISP_W * 0.62,
            height:       5,
            marginLeft:   DISP_W * 0.19,
            borderRadius: "50%",
            background:   "rgba(0,0,0,0.38)",
            filter:       "blur(3px)",
          }}
        />
      </div>
    </div>
  );
}
