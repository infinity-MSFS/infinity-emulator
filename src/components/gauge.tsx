import React, { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

export function AttitudeCanvas({ width, height, fps = 20 }: { width: number; height: number; fps?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let alive = true;
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;

    let rafId = 0;
    let inFlight = false;
    let lastFrameAt = 0;
    let lastFbw = 0;
    let lastFbh = 0;

    const loop = async (t: number) => {
      if (!alive) return;

      // FPS limit
      const minDt = 1000 / fps;
      if (t - lastFrameAt < minDt || inFlight) {
        rafId = requestAnimationFrame(loop);
        return;
      }

      inFlight = true;
      lastFrameAt = t;

      try {
        // High DPR explodes pixel count quickly. Clamp for performance.
        const dpr = Math.min(window.devicePixelRatio || 1, 1);

        // Rust returns a binary Response: [u32 fbw][u32 fbh][rgba...]
        const payload = await invoke<ArrayBuffer | number[]>("render_attitude", {
          winW: width,
          winH: height,
          dpr,
        });

        let fbw: number;
        let fbh: number;
        let pixels: Uint8ClampedArray;

        if (payload instanceof ArrayBuffer) {
          const header = new DataView(payload, 0, 8);
          fbw = header.getUint32(0, true);
          fbh = header.getUint32(4, true);
          pixels = new Uint8ClampedArray(payload, 8);
        } else {
          // Fallback if something still returns JSON.
          fbw = Math.round(width * dpr);
          fbh = Math.round(height * dpr);
          pixels = new Uint8ClampedArray(payload);
        }

        // Resize only when needed (resizing clears and is expensive)
        if (fbw !== lastFbw || fbh !== lastFbh) {
          lastFbw = fbw;
          lastFbh = fbh;
          canvas.width = fbw;
          canvas.height = fbh;
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;
        }

        ctx.putImageData(new ImageData(pixels, fbw, fbh), 0, 0);
      } finally {
        inFlight = false;
        rafId = requestAnimationFrame(loop);
      }
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(rafId);
    };
  }, [width, height, fps]);

  return <canvas ref={ref} />;
}