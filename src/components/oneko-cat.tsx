"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

interface OnekoCatProps {
  className?: string;
}

type SpriteSetName =
  | "idle"
  | "tired"
  | "sleeping"
  | "N"
  | "NE"
  | "E"
  | "SE"
  | "S"
  | "SW"
  | "W"
  | "NW";

type SpriteFrame = readonly [number, number];
type Vec2 = { x: number; y: number };

const FRAME_SIZE = 32;
const FRAME_VIEW_SIZE = 30;
const DISPLAY_SCALE = 1.5;
const HALF_SIZE = (FRAME_VIEW_SIZE * DISPLAY_SCALE) / 2;
const STEP_MS = 100;
const NEKO_SPEED = 10;

const SPRITES: Record<SpriteSetName, readonly SpriteFrame[]> = {
  idle: [[-3, -3]],
  tired: [[-3, -2]],
  sleeping: [
    [-2, 0],
    [-2, -1],
  ],
  N: [
    [-1, -2],
    [-1, -3],
  ],
  NE: [
    [0, -2],
    [0, -3],
  ],
  E: [
    [-3, 0],
    [-3, -1],
  ],
  SE: [
    [-5, -1],
    [-5, -2],
  ],
  S: [
    [-6, -3],
    [-7, -2],
  ],
  SW: [
    [-5, -3],
    [-6, -1],
  ],
  W: [
    [-4, -2],
    [-4, -3],
  ],
  NW: [
    [-1, 0],
    [-1, -1],
  ],
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export default function OnekoCat({ className }: OnekoCatProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const petRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const pet = petRef.current;
    const body = bodyRef.current;

    if (!container || !pet || !body) {
      console.error("[OnekoCat] Missing required animation elements.");
      return;
    }

    const image = new Image();
    image.onerror = () => {
      console.error("[OnekoCat] Failed to load /oneko-cat.png sprite sheet.");
    };
    image.src = "/oneko-cat.png";

    const rect = container.getBoundingClientRect();
    const center: Vec2 = {
      x: clamp(rect.width / 2, HALF_SIZE, Math.max(HALF_SIZE, rect.width - HALF_SIZE)),
      y: clamp(rect.height / 2, HALF_SIZE, Math.max(HALF_SIZE, rect.height - HALF_SIZE)),
    };

    const mouse: Vec2 = { ...center };
    const neko: Vec2 = { ...center };

    let frameCount = 0;
    let idleTime = 0;
    let idleAnimation: SpriteSetName | null = null;
    let idleAnimationFrame = 0;
    let rafId: number | null = null;
    let lastFrameTimestamp = 0;

    const setSprite = (name: SpriteSetName, frame: number): void => {
      const sprite = SPRITES[name][frame % SPRITES[name].length];
      body.style.backgroundPosition = `${sprite[0] * FRAME_SIZE}px ${sprite[1] * FRAME_SIZE}px`;
    };

    const updatePosition = (): void => {
      pet.style.left = `${Math.round(neko.x - HALF_SIZE)}px`;
      pet.style.top = `${Math.round(neko.y - HALF_SIZE)}px`;
    };

    const resetIdleAnimation = (): void => {
      idleAnimation = null;
      idleAnimationFrame = 0;
    };

    const idle = (): void => {
      idleTime += 1;

      if (idleTime > 10 && Math.floor(Math.random() * 200) === 0 && idleAnimation === null) {
        idleAnimation = "sleeping";
      }

      switch (idleAnimation) {
        case "sleeping":
          if (idleAnimationFrame < 8) {
            setSprite("tired", 0);
            break;
          }
          setSprite("sleeping", Math.floor(idleAnimationFrame / 4));
          if (idleAnimationFrame > 192) resetIdleAnimation();
          break;
        default:
          setSprite("idle", 0);
          return;
      }

      idleAnimationFrame += 1;
    };

    const runFrame = (): void => {
      frameCount += 1;
      const diffX = neko.x - mouse.x;
      const diffY = neko.y - mouse.y;
      const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

      if (distance < NEKO_SPEED || distance < 48) {
        idle();
        return;
      }

      idleAnimation = null;
      idleAnimationFrame = 0;

      if (idleTime > 1) {
        idleTime = 0;
      }

      let direction = "";
      direction += diffY / distance > 0.5 ? "N" : "";
      direction += diffY / distance < -0.5 ? "S" : "";
      direction += diffX / distance > 0.5 ? "W" : "";
      direction += diffX / distance < -0.5 ? "E" : "";

      const moveSet = (direction as SpriteSetName) || "E";
      setSprite(moveSet, frameCount);

      neko.x -= (diffX / distance) * NEKO_SPEED;
      neko.y -= (diffY / distance) * NEKO_SPEED;

      const liveRect = container.getBoundingClientRect();
      const maxX = Math.max(HALF_SIZE, liveRect.width - HALF_SIZE);
      const maxY = Math.max(HALF_SIZE, liveRect.height - HALF_SIZE);

      neko.x = clamp(neko.x, HALF_SIZE, maxX);
      neko.y = clamp(neko.y, HALF_SIZE, maxY);
      updatePosition();
    };

    const animate = (timestamp: number): void => {
      if (!container.isConnected) return;

      if (!lastFrameTimestamp) {
        lastFrameTimestamp = timestamp;
      }

      if (timestamp - lastFrameTimestamp > STEP_MS) {
        lastFrameTimestamp = timestamp;
        runFrame();
      }

      rafId = window.requestAnimationFrame(animate);
    };

    const onPointerMove = (event: PointerEvent): void => {
      const r = container.getBoundingClientRect();
      const maxX = Math.max(HALF_SIZE, r.width - HALF_SIZE);
      const maxY = Math.max(HALF_SIZE, r.height - HALF_SIZE);
      mouse.x = clamp(event.clientX - r.left, HALF_SIZE, maxX);
      mouse.y = clamp(event.clientY - r.top, HALF_SIZE, maxY);
    };

    const onPointerEnter = (): void => {
      idleTime = 0;
      resetIdleAnimation();
    };

    const onResize = (): void => {
      const r = container.getBoundingClientRect();
      const maxX = Math.max(HALF_SIZE, r.width - HALF_SIZE);
      const maxY = Math.max(HALF_SIZE, r.height - HALF_SIZE);
      mouse.x = clamp(mouse.x, HALF_SIZE, maxX);
      mouse.y = clamp(mouse.y, HALF_SIZE, maxY);
      neko.x = clamp(neko.x, HALF_SIZE, maxX);
      neko.y = clamp(neko.y, HALF_SIZE, maxY);
      updatePosition();
    };

    setSprite("idle", 0);
    updatePosition();
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerenter", onPointerEnter);
    window.addEventListener("resize", onResize);
    rafId = window.requestAnimationFrame(animate);

    return () => {
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerenter", onPointerEnter);
      window.removeEventListener("resize", onResize);
      if (typeof rafId === "number") {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "card-hover relative min-h-[270px] overflow-hidden rounded-2xl border border-[#2e2a25] bg-[#1c1916]",
        className
      )}
    >
      <p
        className="pointer-events-none absolute left-1/2 top-6 z-10 -translate-x-1/2 origin-top scale-y-180 whitespace-nowrap text-[16px] leading-none text-[#f2ede8]"
        style={{ fontFamily: "var(--font-press-start), monospace" }}
      >
        Code. Claw. Conquer.
      </p>
      <div
        ref={petRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-[30px] w-[30px] [transform:scale(1.5)] [transform-origin:top_left]"
      >
        <div
          ref={bodyRef}
          className="h-full w-full bg-[url('/oneko-cat.png')] bg-no-repeat [background-size:256px_128px] [image-rendering:pixelated] [image-rendering:crisp-edges] [filter:none]"
        />
      </div>
    </div>
  );
}
