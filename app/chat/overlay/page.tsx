"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ChatFeed from "@/components/chat/ChatFeed";
import { connectKick, resolveKickChannel } from "@/lib/chat/kick";
import { decodeSettings, sanitizeSettings, type ChatSettings } from "@/lib/chat/settings";
import { connectTwitch } from "@/lib/chat/twitch";
import type { ChatMessage } from "@/lib/chat/types";
import { useVisibleMessages } from "@/lib/chat/useVisible";

function OverlayInner() {
  const searchParams = useSearchParams();
  const key = searchParams.get("k") || "";
  const [settings, setSettings] = useState<ChatSettings>(() =>
    decodeSettings(searchParams.toString()),
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    if (!key) {
      setSettings(decodeSettings(searchParams.toString()));
      return;
    }
    let cancel = false;
    const load = () => {
      fetch(`/api/chat/overlay-settings?k=${encodeURIComponent(key)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!cancel && data) setSettings(sanitizeSettings(data));
        })
        .catch(() => undefined);
    };
    load();
    const timer = window.setInterval(load, 8000);
    return () => {
      cancel = true;
      window.clearInterval(timer);
    };
  }, [key, searchParams]);

  useEffect(() => {
    let active = true;
    const stops: Array<() => void> = [];
    const push = (message: ChatMessage) => {
      setMessages((current) => [...current.slice(-80), message]);
    };
    const get = () => settingsRef.current;
    if (settings.twitch) stops.push(connectTwitch(settings.twitch, get, push));
    if (settings.kick) {
      resolveKickChannel(settings.kick).then((channel) => {
        if (!active || !channel) return;
        stops.push(connectKick(channel, get, push));
      });
    }
    return () => {
      active = false;
      stops.forEach((stop) => stop());
    };
  }, [settings.twitch, settings.kick]);

  const visible = useVisibleMessages(messages, settings);

  return <ChatFeed messages={visible} settings={settings} empty="" />;
}

export default function OverlayPage() {
  return (
    <Suspense fallback={null}>
      <OverlayInner />
    </Suspense>
  );
}
