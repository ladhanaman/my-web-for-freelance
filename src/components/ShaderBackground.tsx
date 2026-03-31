"use client";

import React, { useRef, useEffect } from "react";

const shaderSource = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
uniform vec2 originPoint;  // physical px, bottom-left origin — used by shockwave ring + flash
#define FC gl_FragCoord.xy
#define T time
#define R resolution
#define MN min(R.x,R.y)

float rnd(vec2 p) {
  p=fract(p*vec2(12.9898,78.233));
  p+=dot(p,p+34.56);
  return fract(p.x*p.y);
}

float noise(in vec2 p) {
  vec2 i=floor(p), f=fract(p), u=f*f*(3.-2.*f);
  float a=rnd(i), b=rnd(i+vec2(1,0)), c=rnd(i+vec2(0,1)), d=rnd(i+1.);
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}

float fbm(vec2 p) {
  float t=.0, a=1.; mat2 m=mat2(1.,-.5,.2,1.2);
  for (int i=0; i<5; i++) {
    t+=a*noise(p);
    p*=2.*m;
    a*=.5;
  }
  return t;
}

float clouds(vec2 p) {
  float d=1., t=.0;
  for (float i=.0; i<3.; i++) {
    float a=d*fbm(i*10.+p.x*.2+.2*(1.+i)*p.y+d+i*i+p);
    t=mix(t,d,a);
    d=a;
    p*=2./(i+1.);
  }
  return t;
}

void main(void) {
  // ── Glitch intensity: 1.0 at T=0, fades to 0.0 by T=1.6s ─────────────────
  float GLITCH_END = 2.0;
  float glitch = max(0.0, 1.0 - T / GLITCH_END);

  // ── 1. Horizontal hold snap — whole image lurches sideways in bursts ─────────
  float snapFrame  = floor(T * 7.0);
  float snapActive = step(0.72, rnd(vec2(snapFrame, 99.1))) * glitch;
  float snapX      = (rnd(vec2(snapFrame + 3.0, 0.0)) - 0.5) * R.x * 0.35 * snapActive;
  vec2 tornFC      = vec2(FC.x + snapX, FC.y);

  // ── 2. Compute nebula using snapped fragment coords ───────────────────────
  vec2 uv = (tornFC - 0.5*R) / MN;
  vec2 st = uv * vec2(2, 1);
  vec3 col = vec3(0);

  float bg = clouds(vec2(st.x + T*.5, -st.y));
  uv *= 1. - .3*(sin(T*.2)*.5 + .5);

  float tJump = pow(smoothstep(4.4, 5.2, T), 2.0) * 20.0;
  float tFade = 1.0 - smoothstep(4.8, 5.2, T);

  for (float i=1.; i<12.; i++) {
    uv += .1*cos(i*vec2(.1+.01*i, .8)+i*i+T*.5+.1*uv.x);
    vec2 p = uv - vec2(tJump, 0.0);
    float d = length(p);
    col += .00125/d*(cos(sin(i)*vec3(1,2,3))+1.) * tFade;
    float b = noise(i+p+bg*1.731);
    col += .002*b/length(max(p,vec2(b*p.x*.02,p.y))) * tFade;
    col = mix(col,vec3(bg*.25,bg*.137,bg*.05),d);
  }

  // ── 3. Color bleed for 0.6s, then clean nebula fades in ──────────────────
  // Bleed: nebula colors smear horizontally — soft analog feel, like a CRT misfiring.
  // The smear offset varies per row using sin, creating wavy horizontal streaks.
  float bleedStrength = max(0.0, 1.0 - T / 2.0) * 70.0; // strong at T=0, gone by 2.0s
  float bleedOffset   = sin(FC.y * 0.025 + T * 6.0) * bleedStrength;
  vec2  bleedUV       = ((FC + vec2(bleedOffset, 0.0)) - 0.5*R) / MN;
  vec2  bleedST       = bleedUV * vec2(2, 1);
  float bleedBg       = clouds(vec2(bleedST.x + T*.5, -bleedST.y));
  vec3  bleedCol      = vec3(bleedBg*0.28, bleedBg*0.15, bleedBg*0.06);

  // During bleed phase: show bleed. After 2.0s: fade clean nebula in.
  float cleanRamp = smoothstep(2.0, 2.8, T);
  col = mix(bleedCol, col, cleanRamp);

  O = vec4(col, 1.0);
}`;

interface ShaderBackgroundProps {
  onWarpComplete: () => void;
  isFadingOut: boolean;
  originX: number;
  originY: number;
}

export default function ShaderBackground({ onWarpComplete, isFadingOut, originX, originY }: ShaderBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const doneRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2");
    if (!gl) {
      console.error("WebGL2 not supported");
      const fallbackTimer = setTimeout(onWarpComplete, 4800);
      return () => clearTimeout(fallbackTimer);
    }

    const vertexSrc = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;

    const compileShader = (type: number, src: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, vertexSrc);
    const fs = compileShader(gl.FRAGMENT_SHADER, shaderSource);

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]),
      gl.STATIC_DRAW
    );

    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const resLoc       = gl.getUniformLocation(program, "resolution");
    const timeLoc      = gl.getUniformLocation(program, "time");
    const originLoc    = gl.getUniformLocation(program, "originPoint");

    const startTime = performance.now();

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width  = rect.width  * dpr;
      canvas.height = rect.height * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener("resize", resize);
    resize();

    const render = (now: number) => {
      if (!program) return;

      const elapsed = (now - startTime) / 1000;
      const dpr = window.devicePixelRatio || 1;

      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.uniform1f(timeLoc, elapsed);

      // Origin: CSS-px viewport → physical px, flip Y for WebGL bottom-left origin
      const originXgl = originX * dpr;
      const originYgl = canvas.height - originY * dpr;
      gl.uniform2f(originLoc, originXgl, originYgl);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (elapsed > 5.2 && !doneRef.current) {
        doneRef.current = true;
        cancelAnimationFrame(animationFrameRef.current);
        setTimeout(() => { onWarpComplete(); }, 50);
        return;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, [onWarpComplete, originX, originY]);

  return (
    <div className={`fixed inset-0 z-[100] bg-black ${isFadingOut ? 'anim-shader-out' : 'anim-shader-in'}`}>
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
        className="touch-none"
      />
    </div>
  );
}
