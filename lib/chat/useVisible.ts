"use client";

import { useEffect, useState } from "react";
import { isVisible } from "./filter";
import type { ChatSettings } from "./settings";
import type { ChatMessage } from "./types";

export function useVisibleMessages(
  messages: ChatMessage[],
  settings: ChatSettings,
) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!settings.fadeSec) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 400);
    return () => window.clearInterval(id);
  }, [settings.fadeSec]);

  const now = Date.now();
  return messages
    .filter((message) => isVisible(message, settings))
    .filter(
      (message) =>
        !settings.fadeSec || now - message.ts < settings.fadeSec * 1000,
    )
    .slice(-settings.maxMessages);
}
