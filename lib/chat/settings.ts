export type FontId = "grotesk" | "inter" | "roboto" | "comic" | "pixel";
export type PresetId = "clean" | "blocks" | "panel";
export type NameColorMode = "platform" | "custom";
export type Align = "left" | "right";
export type NameLine = "inline" | "stack";

export type ChatSettings = {
  twitch: string;
  kick: string;
  font: FontId;
  size: number;
  nameColorMode: NameColorMode;
  nameColor: string;
  messageColor: string;
  stroke: number;
  shadow: number;
  align: Align;
  nameLine: NameLine;
  gap: number;
  msgBg: string;
  msgBgAlpha: number;
  panelBg: string;
  panelBgAlpha: number;
  radius: number;
  showBadges: boolean;
  showEmotes: boolean;
  emoteScale: number;
  animatedEmotes: boolean;
  showPlatform: boolean;
  animate: boolean;
  fadeSec: number;
  maxMessages: number;
  hideBots: boolean;
  hideCommands: boolean;
  highlightMentions: boolean;
  ignore: string;
  hideNames: boolean;
};

export const defaultSettings: ChatSettings = {
  twitch: "",
  kick: "",
  font: "grotesk",
  size: 18,
  nameColorMode: "platform",
  nameColor: "#11ad32",
  messageColor: "#f8f8f8",
  stroke: 2,
  shadow: 2,
  align: "left",
  nameLine: "inline",
  gap: 8,
  msgBg: "#000000",
  msgBgAlpha: 0,
  panelBg: "#000000",
  panelBgAlpha: 0,
  radius: 6,
  showBadges: true,
  showEmotes: true,
  emoteScale: 1.4,
  animatedEmotes: true,
  showPlatform: true,
  animate: true,
  fadeSec: 0,
  maxMessages: 12,
  hideBots: true,
  hideCommands: true,
  highlightMentions: true,
  ignore: "",
  hideNames: false,
};

export const fonts: { id: FontId; label: string; css: string }[] = [
  { id: "grotesk", label: "Space Grotesk", css: "var(--font-sans), 'Space Grotesk', sans-serif" },
  { id: "inter", label: "Inter", css: "var(--font-inter), Inter, sans-serif" },
  { id: "roboto", label: "Roboto", css: "var(--font-roboto), Roboto, sans-serif" },
  { id: "comic", label: "Comic Neue", css: "var(--font-comic), 'Comic Neue', cursive" },
  { id: "pixel", label: "Pixel", css: "var(--font-pixel), 'Press Start 2P', monospace" },
];

export const presets: Record<
  PresetId,
  Partial<ChatSettings> & { label: string }
> = {
  clean: {
    label: "Clean",
    msgBgAlpha: 0,
    panelBgAlpha: 0,
    stroke: 2,
    shadow: 2,
    radius: 6,
    gap: 8,
    nameLine: "inline",
  },
  blocks: {
    label: "Blocks",
    msgBg: "#000000",
    msgBgAlpha: 0.55,
    panelBgAlpha: 0,
    stroke: 0,
    shadow: 1,
    radius: 8,
    gap: 6,
    nameLine: "inline",
  },
  panel: {
    label: "Panel",
    panelBg: "#050505",
    panelBgAlpha: 0.5,
    msgBgAlpha: 0,
    stroke: 1,
    shadow: 1,
    radius: 10,
    gap: 10,
    nameLine: "inline",
  },
};

const keys: { [K in keyof ChatSettings]: string } = {
  twitch: "t",
  kick: "k",
  font: "f",
  size: "sz",
  nameColorMode: "ncm",
  nameColor: "nc",
  messageColor: "mc",
  stroke: "st",
  shadow: "sh",
  align: "a",
  nameLine: "nl",
  gap: "g",
  msgBg: "mb",
  msgBgAlpha: "mba",
  panelBg: "pb",
  panelBgAlpha: "pba",
  radius: "r",
  showBadges: "b",
  showEmotes: "e",
  emoteScale: "es",
  animatedEmotes: "ae",
  showPlatform: "plat",
  animate: "an",
  fadeSec: "fade",
  maxMessages: "max",
  hideBots: "hb",
  hideCommands: "hc",
  highlightMentions: "hm",
  ignore: "ig",
  hideNames: "hn",
};

const byShort = Object.fromEntries(
  Object.entries(keys).map(([k, v]) => [v, k as keyof ChatSettings]),
) as Record<string, keyof ChatSettings>;

function hex(color: string) {
  return color.replace("#", "").toLowerCase();
}

function withHash(value: string) {
  const v = value.replace("#", "");
  return `#${v}`;
}

function encodeValue(key: keyof ChatSettings, value: ChatSettings[keyof ChatSettings]) {
  if (typeof value === "boolean") return value ? "1" : "0";
  if (key === "nameColor" || key === "messageColor" || key === "msgBg" || key === "panelBg") {
    return hex(String(value));
  }
  return String(value);
}

function decodeValue(
  key: keyof ChatSettings,
  raw: string,
): ChatSettings[keyof ChatSettings] {
  const fallback = defaultSettings[key];
  if (typeof fallback === "boolean") return raw === "1" || raw === "true";
  if (typeof fallback === "number") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  }
  if (key === "nameColor" || key === "messageColor" || key === "msgBg" || key === "panelBg") {
    return withHash(raw);
  }
  return raw as ChatSettings[keyof ChatSettings];
}

export function encodeSettings(settings: ChatSettings): string {
  const params = new URLSearchParams();
  (Object.keys(keys) as (keyof ChatSettings)[]).forEach((key) => {
    const current = settings[key];
    if (current === defaultSettings[key]) return;
    if (typeof current === "string" && current.trim() === defaultSettings[key]) return;
    params.set(keys[key], encodeValue(key, current));
  });
  return params.toString();
}

export function sanitizeSettings(input: unknown): ChatSettings {
  if (!input || typeof input !== "object") return { ...defaultSettings };
  const params = new URLSearchParams();
  const source = input as Record<string, unknown>;
  for (const key of Object.keys(keys) as (keyof ChatSettings)[]) {
    const value = source[key];
    if (typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
      params.set(keys[key], encodeValue(key, value as ChatSettings[keyof ChatSettings]));
    }
  }
  return decodeSettings(params.toString());
}

export function decodeSettings(search: string): ChatSettings {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const next = { ...defaultSettings };
  params.forEach((value, short) => {
    const key = byShort[short];
    if (!key) return;
    const decoded = decodeValue(key, value);
    (next as Record<string, unknown>)[key] = decoded;
  });
  next.twitch = next.twitch.trim().replace(/^#/, "").toLowerCase();
  next.kick = next.kick.trim().replace(/^@/, "").toLowerCase();
  next.size = clamp(next.size, 12, 42);
  next.stroke = clamp(next.stroke, 0, 4);
  next.shadow = clamp(next.shadow, 0, 3);
  next.gap = clamp(next.gap, 0, 28);
  next.radius = clamp(next.radius, 0, 24);
  next.emoteScale = clamp(next.emoteScale, 0.8, 2.4);
  next.fadeSec = clamp(next.fadeSec, 0, 120);
  next.maxMessages = clamp(next.maxMessages, 4, 40);
  next.msgBgAlpha = clamp(next.msgBgAlpha, 0, 1);
  next.panelBgAlpha = clamp(next.panelBgAlpha, 0, 1);
  next.ignore = next.ignore.slice(0, 180);
  if (!fonts.some((f) => f.id === next.font)) next.font = "grotesk";
  if (next.align !== "right") next.align = "left";
  if (next.nameLine !== "stack") next.nameLine = "inline";
  if (next.nameColorMode !== "custom") next.nameColorMode = "platform";
  return next;
}

export function applyPreset(settings: ChatSettings, id: PresetId): ChatSettings {
  const { label: _label, ...patch } = presets[id];
  return { ...settings, ...patch };
}

export function fontCss(id: FontId) {
  return fonts.find((f) => f.id === id)?.css ?? fonts[0].css;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function ignoreList(settings: ChatSettings) {
  return settings.ignore
    .split(/[, \n]+/)
    .map((n) => n.trim().toLowerCase())
    .filter(Boolean);
}
