import { clamp, fonts, type FontId } from "@/lib/chat/settings";
import { alertTypes, type AlertType } from "@/lib/events/types";

export type AlertSettings = {
  font: FontId;
  size: number;
  color: string;
  accent: string;
  sound: boolean;
  enabled: Record<AlertType, boolean>;
};

export const defaultAlertSettings: AlertSettings = {
  font: "grotesk",
  size: 42,
  color: "#f8f8f8",
  accent: "#11ad32",
  sound: true,
  enabled: {
    follow: true,
    sub: true,
    resub: true,
    gift: true,
    raid: true,
    cheer: true,
    kicks: true,
  },
};

function hex(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const raw = value.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return fallback;
  return `#${raw.toLowerCase()}`;
}

export function sanitizeAlertSettings(input: unknown): AlertSettings {
  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const enabledIn =
    source.enabled && typeof source.enabled === "object"
      ? (source.enabled as Record<string, unknown>)
      : {};
  const enabled = { ...defaultAlertSettings.enabled };
  for (const type of alertTypes) {
    if (typeof enabledIn[type] === "boolean") enabled[type] = enabledIn[type];
  }
  const font = fonts.some((item) => item.id === source.font)
    ? (source.font as FontId)
    : defaultAlertSettings.font;
  return {
    font,
    size: clamp(Number(source.size) || defaultAlertSettings.size, 24, 72),
    color: hex(source.color, defaultAlertSettings.color),
    accent: hex(source.accent, defaultAlertSettings.accent),
    sound: typeof source.sound === "boolean" ? source.sound : defaultAlertSettings.sound,
    enabled,
  };
}
