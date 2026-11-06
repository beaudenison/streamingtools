"use client";

import { useEffect } from "react";

export default function Atmosphere() {
  useEffect(() => {
    const root = document.documentElement;
    let mx = window.innerWidth / 2;
    let my = window.innerHeight * 0.35;
    let gx = 0;
    let gy = 0;
    let raf = 0;

    const tick = () => {
      const tx = (mx / window.innerWidth) * 100;
      const ty = (my / window.innerHeight) * 100;
      const tgx = (mx / window.innerWidth - 0.5) * 18;
      const tgy = (my / window.innerHeight - 0.5) * 14;
      gx += (tgx - gx) * 0.06;
      gy += (tgy - gy) * 0.06;
      root.style.setProperty("--mx", `${tx}%`);
      root.style.setProperty("--my", `${ty}%`);
      root.style.setProperty("--gx", `${gx.toFixed(2)}px`);
      root.style.setProperty("--gy", `${gy.toFixed(2)}px`);
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="atmosphere" aria-hidden>
      <div className="atmosphere-grain" />
      <div className="atmosphere-grid" />
      <div className="atmosphere-orb a" />
      <div className="atmosphere-orb b" />
      <div className="atmosphere-bloom" />
      <div className="atmosphere-vignette" />
    </div>
  );
}
