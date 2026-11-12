"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import AlertCard from "@/components/alerts/AlertCard";
import { tone } from "@/lib/alerts/tone";
import {
  defaultAlertSettings,
  sanitizeAlertSettings,
  type AlertSettings,
} from "@/lib/alerts/settings";

type Pulled = {
  id: string;
  line: string;
};

export default function AlertsOverlayPage() {
  return (
    <Suspense fallback={null}>
      <OverlayInner />
    </Suspense>
  );
}

function OverlayInner() {
  const key = useSearchParams().get("k") || "";
  const [settings, setSettings] = useState<AlertSettings>(defaultAlertSettings);
  const [current, setCurrent] = useState<Pulled | null>(null);
  const pending = useRef<Pulled[]>([]);
  const seen = useRef(new Set<string>());
  const showing = useRef(false);
  const sound = useRef(settings.sound);
  sound.current = settings.sound;

  function pump() {
    if (showing.current) return;
    const next = pending.current.shift();
    if (!next) return;
    showing.current = true;
    setCurrent(next);
  }

  useEffect(() => {
    if (!key) return;
    let cancel = false;
    const load = () => {
      fetch(`/api/alerts/pull?k=${encodeURIComponent(key)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { settings?: unknown; events?: Pulled[] } | null) => {
          if (cancel || !data) return;
          if (data.settings) setSettings(sanitizeAlertSettings(data.settings));
          for (const event of data.events ?? []) {
            if (!event.id || seen.current.has(event.id)) continue;
            seen.current.add(event.id);
            pending.current.push(event);
          }
          pump();
        })
        .catch(() => undefined);
    };
    load();
    const timer = window.setInterval(load, 1000);
    return () => {
      cancel = true;
      window.clearInterval(timer);
    };
  }, [key]);

  useEffect(() => {
    if (!current) return;
    if (sound.current) tone();
    const timer = window.setTimeout(() => {
      showing.current = false;
      setCurrent(null);
      pump();
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [current]);

  if (!current) return null;
  return (
    <div className="alert-overlay">
      <AlertCard
        line={current.line}
        font={settings.font}
        size={settings.size}
        color={settings.color}
        accent={settings.accent}
      />
    </div>
  );
}
