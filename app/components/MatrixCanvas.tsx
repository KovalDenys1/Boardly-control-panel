"use client";

import { useEffect, useRef } from "react";

const CHARS = "01░▒▓█┌┐└┘─│╔╗╚╝╠╣╦╩╬═▊▲▶·@#$%01";
const FS = 14;
const FPS_INTERVAL = 80;

export function MatrixCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;

    let animId: number;
    let lastTime = 0;
    let drops: number[] = [];

    function init() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const cols = Math.floor(canvas.width / FS);
      drops = Array.from({ length: cols }, () => Math.random() * -(canvas.height / FS));
    }

    function frame(now: number) {
      animId = requestAnimationFrame(frame);
      if (now - lastTime < FPS_INTERVAL) return;
      lastTime = now;

      ctx.fillStyle = "rgba(2, 8, 5, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${FS}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const y = Math.floor(drops[i]) * FS;
        const x = i * FS;
        if (y >= 0 && y < canvas.height) {
          ctx.fillStyle = "rgba(180, 255, 215, 0.85)";
          ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x, y);
        }

        drops[i] += 0.25 + Math.random() * 0.15;

        if (drops[i] * FS > canvas.height && Math.random() > 0.97) {
          drops[i] = Math.random() * -20;
        }
      }
    }

    init();
    window.addEventListener("resize", init);
    animId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", init);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.45 }}
    />
  );
}
