"use client";

import React, { useRef, useEffect } from "react";

const shaderSource = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
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
    vec2 uv=(FC-.5*R)/MN,st=uv*vec2(2,1);
    vec3 col=vec3(0);

    // Removed camera sweep animation as requested
    // The shader will just idle naturally until it fades out.

    float bg=clouds(vec2(st.x+T*.5,-st.y));
    uv*=1.-.3*(sin(T*.2)*.5+.5);

    // After 3.0s, the comet effect dashes right and then fades out
    float tJump = pow(smoothstep(3.0, 3.8, T), 2.0) * 20.0; // Acceleration
    float tFade = 1.0 - smoothstep(3.4, 3.8, T);

    for (float i=1.; i<12.; i++) {
            uv+=.1*cos(i*vec2(.1+.01*i, .8)+i*i+T*.5+.1*uv.x);
            vec2 p=uv - vec2(tJump, 0.0); 
            float d=length(p);
            
            // Apply bright points and streaks with fade
            col+=.00125/d*(cos(sin(i)*vec3(1,2,3))+1.) * tFade;
            float b=noise(i+p+bg*1.731);
            col+=.002*b/length(max(p,vec2(b*p.x*.02,p.y))) * tFade;
            
            // Mix with background nebula color
            col=mix(col,vec3(bg*.25,bg*.137,bg*.05),d);
    }
    O=vec4(col,1);
}`;

interface ShaderBackgroundProps {
  onWarpComplete: () => void;
  isFadingOut: boolean;
}

export default function ShaderBackground({ onWarpComplete, isFadingOut }: ShaderBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const doneRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2");
    if (!gl) {
      console.error("WebGL2 not supported");
      // Fallback
      setTimeout(onWarpComplete, 4800);
      return;
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

    const resLoc = gl.getUniformLocation(program, "resolution");
    const timeLoc = gl.getUniformLocation(program, "time");

    const startTime = performance.now();

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const ww = rect.width;
      const wh = rect.height;
      
      canvas.width = ww * dpr;
      canvas.height = wh * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener("resize", resize);
    resize();

    const render = (now: number) => {
      if (!program) return;

      const elapsed = (now - startTime) / 1000;

      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.uniform1f(timeLoc, elapsed);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (elapsed > 3.8 && !doneRef.current) {
        doneRef.current = true;
        // Cancel the RAF — no more frames needed after the warp is done
        cancelAnimationFrame(animationFrameRef.current);
        // Tiny delay to ensure the final frame is painted before phase change
        setTimeout(() => {
          onWarpComplete();
        }, 50);
        return; // Don't schedule another frame
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (program) {
        gl.deleteProgram(program);
      }
    };
  }, [onWarpComplete]);

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
