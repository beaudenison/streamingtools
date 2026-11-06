"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

export default function Glass({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--lx", `${e.clientX - r.left}px`);
    el.style.setProperty("--ly", `${e.clientY - r.top}px`);
  }

  return (
    <div ref={ref} className={`glass ${className}`} onPointerMove={onMove}>
      {children}
    </div>
  );
}
