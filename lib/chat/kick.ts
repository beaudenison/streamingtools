import { isKnownBot } from "./bots";
import { kickBadgesFromIdentity } from "./badges";
import { loadKickEmotes } from "./emotes";
import { mentionsChannel } from "./filter";
import { fragmentsFromKick } from "./parse";
import type { ChatSettings } from "./settings";
import type { ChatMessage, EmoteFile } from "./types";

const PUSHER =
  "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0&flash=false";

type KickChannel = {
  chatroomId: number;
  userId: number | null;
  username: string;
  slug: string;
};

type KickSender = {
  username?: string;
  identity?: {
    color?: string;
    badges?: Array<{ type?: string; text?: string }>;
  };
};

type KickPayload = {
  id?: string;
  content?: string;
  created_at?: string;
  sender?: KickSender;
};

type KickApiChannel = {
  user_id?: number;
  user?: { id?: number; username?: string };
  chatroom?: { id?: number };
  slug?: string;
};

function fromKickPayload(data: KickApiChannel, fallback: string): KickChannel | null {
  const chatroomId = data.chatroom?.id;
  if (!chatroomId) return null;
  return {
    slug: (data.slug ?? fallback).toLowerCase(),
    chatroomId,
    userId: data.user_id ?? data.user?.id ?? null,
    username: data.user?.username ?? fallback,
  };
}

async function fetchKickJson(url: string): Promise<KickApiChannel | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as KickApiChannel;
  } catch {
    return null;
  }
}

export async function resolveKickChannel(slug: string): Promise<KickChannel | null> {
  const clean = slug.trim().toLowerCase();
  if (!clean) return null;

  const direct =
    (await fetchKickJson(`https://kick.com/api/v2/channels/${clean}`)) ??
    (await fetchKickJson(`https://kick.com/api/v1/channels/${clean}`));
  const fromDirect = direct ? fromKickPayload(direct, clean) : null;
  if (fromDirect) return fromDirect;

  try {
    const res = await fetch(`/api/kick/channel?slug=${encodeURIComponent(clean)}`);
    if (!res.ok) return null;
    return (await res.json()) as KickChannel;
  } catch {
    return null;
  }
}

export function connectKick(
  channel: KickChannel,
  settings: () => ChatSettings,
  onMessage: (message: ChatMessage) => void,
): () => void {
  let closed = false;
  let ws: WebSocket | null = null;
  let emotes = new Map<string, EmoteFile>();

  loadKickEmotes(channel.userId).then((map) => {
    if (!closed) emotes = map;
  });

  const open = () => {
    if (closed) return;
    ws = new WebSocket(PUSHER);
    ws.onopen = () => {};
    ws.onmessage = (event) => {
      let packet: { event?: string; data?: string };
      try {
        packet = JSON.parse(String(event.data));
      } catch {
        return;
      }
      if (packet.event === "pusher:connection_established") {
        ws?.send(
          JSON.stringify({
            event: "pusher:subscribe",
            data: { auth: "", channel: `chatrooms.${channel.chatroomId}.v2` },
          }),
        );
        return;
      }
      if (packet.event === "pusher:ping") {
        ws?.send(JSON.stringify({ event: "pusher:pong", data: {} }));
        return;
      }
      if (packet.event !== "App\\Events\\ChatMessageEvent") return;
      let body: KickPayload;
      try {
        body = JSON.parse(packet.data || "{}");
      } catch {
        return;
      }
      const text = body.content ?? "";
      const user = body.sender?.username ?? "unknown";
      const current = settings();
      onMessage({
        id: body.id || crypto.randomUUID(),
        platform: "kick",
        user,
        color: body.sender?.identity?.color || "#53fc18",
        raw: text,
        fragments: current.showEmotes
          ? fragmentsFromKick(text, emotes)
          : [{ type: "text", text }],
        badges: current.showBadges
          ? kickBadgesFromIdentity(body.sender?.identity?.badges)
          : [],
        isBot: isKnownBot(user),
        isCommand: text.trim().startsWith("!"),
        mentioned: mentionsChannel(text, current),
        ts: body.created_at ? Date.parse(body.created_at) : Date.now(),
      });
    };
    ws.onclose = () => {
      if (closed) return;
      window.setTimeout(open, 2500);
    };
  };

  open();

  return () => {
    closed = true;
    ws?.close();
  };
}
