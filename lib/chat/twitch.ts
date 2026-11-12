import { isKnownBot } from "./bots";
import { mentionsChannel } from "./filter";
import { fragmentsFromTwitch } from "./parse";
import { loadTwitchBadges, twitchBadgesFromTag } from "./badges";
import { loadTwitchEmotes } from "./emotes";
import type { ChatSettings } from "./settings";
import type { ChatMessage, EmoteFile } from "./types";

function parseTags(raw: string) {
  const tags: Record<string, string> = {};
  if (!raw.startsWith("@")) return tags;
  raw
    .slice(1)
    .split(";")
    .forEach((pair) => {
      const i = pair.indexOf("=");
      if (i === -1) tags[pair] = "";
      else tags[pair.slice(0, i)] = pair.slice(i + 1);
    });
  return tags;
}

export function connectTwitch(
  channel: string,
  settings: () => ChatSettings,
  onMessage: (message: ChatMessage) => void,
): () => void {
  const login = channel.trim().replace(/^[#@]/, "").toLowerCase();
  if (!login) return () => {};

  let closed = false;
  let ws: WebSocket | null = null;
  let ping: number | null = null;
  let emotes = new Map<string, EmoteFile>();
  let badges = { global: null, channel: null } as Awaited<
    ReturnType<typeof loadTwitchBadges>
  >;

  const nick = `justinfan${Math.floor(1000 + Math.random() * 80000)}`;

  let badgeRoom = "";

  loadTwitchEmotes(login).then((map) => {
    if (!closed) emotes = map;
  });
  loadTwitchBadges().then((maps) => {
    if (!closed && !badgeRoom) badges = maps;
  });

  const open = () => {
    if (closed) return;
    ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
    ws.onopen = () => {
      ws?.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
      ws?.send("PASS SCHMOOPIIFS");
      ws?.send(`NICK ${nick}`);
      ws?.send(`JOIN #${login}`);
    };
    ws.onmessage = (event) => {
      const payload = String(event.data);
      for (const line of payload.split("\r\n")) {
        if (!line) continue;
        if (line.startsWith("PING")) {
          ws?.send("PONG :tmi.twitch.tv");
          continue;
        }
        const tagEnd = line.startsWith("@") ? line.indexOf(" ") : -1;
        const tags = tagEnd > 0 ? parseTags(line.slice(0, tagEnd)) : {};
        const command = (tagEnd > 0 ? line.slice(tagEnd + 1) : line).split(" ")[1];
        if (command === "ROOMSTATE" && tags["room-id"] && !badgeRoom) {
          badgeRoom = tags["room-id"];
          loadTwitchBadges(badgeRoom).then((maps) => {
            if (!closed) badges = maps;
          });
          continue;
        }
        if (command !== "PRIVMSG") continue;
        const priv = line.indexOf(" PRIVMSG ");
        const bodyIndex = line.indexOf(" :", priv);
        const text = bodyIndex === -1 ? "" : line.slice(bodyIndex + 2);
        const current = settings();
        const user = tags["display-name"] || tags.login || "unknown";
        onMessage({
          id: tags.id || crypto.randomUUID(),
          platform: "twitch",
          user,
          color: tags.color || "#bfbfbf",
          raw: text,
          fragments: current.showEmotes
            ? fragmentsFromTwitch(text, tags.emotes, emotes, current.animatedEmotes)
            : [{ type: "text", text }],
          badges: current.showBadges
            ? twitchBadgesFromTag(tags.badges, badges)
            : [],
          isBot: isKnownBot(user) || tags["returning-chatter"] === "bot",
          isCommand: text.trim().startsWith("!"),
          mentioned: mentionsChannel(text, current),
          ts: Number(tags["tmi-sent-ts"]) || Date.now(),
        });
      }
    };
    ws.onclose = () => {
      if (closed) return;
      window.setTimeout(open, 2500);
    };
  };

  open();
  ping = window.setInterval(() => {
    if (ws?.readyState === WebSocket.OPEN) ws.send("PING :tmi.twitch.tv");
  }, 60000);

  return () => {
    closed = true;
    if (ping) window.clearInterval(ping);
    ws?.close();
  };
}
