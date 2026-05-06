"use client";

import { useEffect, useRef } from "react";

export function MatrixRain() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const fontSize = 14;
    const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ";
    let drops = Array(Math.floor(canvas.width / fontSize)).fill(0).map(() => Math.random() * -50);
    let last  = 0;
    let raf: number;

    const tick = (t: number) => {
      if (t - last > 60) {
        last = t;
        ctx.fillStyle = "rgba(0,0,0,0.08)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

        drops.forEach((y, i) => {
          const ch = chars[Math.floor(Math.random() * chars.length)];
          const py = y * fontSize;
          ctx.fillStyle = py < 30 ? "#00ff41" : "rgba(0,255,65,0.35)";
          ctx.fillText(ch, i * fontSize, py);
          if (py > canvas.height && Math.random() > 0.975) drops[i] = 0;
          drops[i]++;
        });
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="bk-matrix" aria-hidden="true" />;
}
