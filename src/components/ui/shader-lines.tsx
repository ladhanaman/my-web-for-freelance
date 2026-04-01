"use client"

import { useEffect, useRef, useState } from "react"
import {
  Camera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Mesh,
  Vector2,
  WebGLRenderer,
} from "three"

export function ShaderAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let animationId: number | null = null
    let active = true

    container.innerHTML = ""

    const camera = new Camera()
    camera.position.z = 1

    const scene = new Scene()
    const geometry = new PlaneGeometry(2, 2)

    const uniforms = {
      time: { value: 1.0 },
      resolution: { value: new Vector2() },
    }

    const vertexShader = `
      void main() {
        gl_Position = vec4( position, 1.0 );
      }
    `

    const fragmentShader = `
      #define TWO_PI 6.2831853072
      #define PI 3.14159265359

      precision highp float;
      uniform vec2 resolution;
      uniform float time;

      float random (in float x) {
          return fract(sin(x)*1e4);
      }
      float random (vec2 st) {
          return fract(sin(dot(st.xy,
                               vec2(12.9898,78.233)))*
              43758.5453123);
      }

      varying vec2 vUv;

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

        vec2 fMosaicScal = vec2(4.0, 2.0);
        vec2 vScreenSize = vec2(256,256);
        uv.x = floor(uv.x * vScreenSize.x / fMosaicScal.x) / (vScreenSize.x / fMosaicScal.x);
        uv.y = floor(uv.y * vScreenSize.y / fMosaicScal.y) / (vScreenSize.y / fMosaicScal.y);

        float t = time*0.08+random(uv.x)*0.4;
        float lineWidth = 0.0008;

        vec3 color = vec3(0.0);
        for(int j = 0; j < 3; j++){
          for(int i=0; i < 5; i++){
            color[j] += lineWidth*float(i*i) / abs(fract(t - 0.01*float(j)+float(i)*0.01)*1.0 - length(uv));
          }
        }

        gl_FragColor = vec4(color[2],color[1],color[0],1.0);
      }
    `

    const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader })
    const mesh = new Mesh(geometry, material)
    scene.add(mesh)

    const renderer = new WebGLRenderer()
    renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(renderer.domElement)

    const onResize = () => {
      if (!active) return
      const rect = container.getBoundingClientRect()
      renderer.setSize(rect.width, rect.height)
      uniforms.resolution.value.x = renderer.domElement.width
      uniforms.resolution.value.y = renderer.domElement.height
    }
    onResize()
    window.addEventListener("resize", onResize, false)

    const animate = () => {
      if (!active) return
      animationId = requestAnimationFrame(animate)
      uniforms.time.value += 0.1
      renderer.render(scene, camera)
    }
    animate()

    requestAnimationFrame(() => { if (active) setReady(true) })

    cleanupRef.current = () => {
      active = false
      if (animationId !== null) cancelAnimationFrame(animationId)
      window.removeEventListener("resize", onResize)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
    }

    return () => {
      cleanupRef.current?.()
      cleanupRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-full absolute"
      style={{ opacity: ready ? 1 : 0, transition: "opacity 0.4s ease-out" }}
    />
  )
}
