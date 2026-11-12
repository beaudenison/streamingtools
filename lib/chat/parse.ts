import type { EmoteFile, Fragment } from "./types";

export type TwitchEmoteTag = {
  id: string;
  start: number;
  end: number;
};

export function parseTwitchEmotes(tag: string | undefined): TwitchEmoteTag[] {
  if (!tag) return [];
  const out: TwitchEmoteTag[] = [];
  for (const part of tag.split("/")) {
    if (!part) continue;
    const [id, ranges] = part.split(":");
    if (!id || !ranges) continue;
    for (const range of ranges.split(",")) {
      const [a, b] = range.split("-").map(Number);
      if (Number.isFinite(a) && Number.isFinite(b)) {
        out.push({ id, start: a, end: b });
      }
    }
  }
  return out.sort((x, y) => x.start - y.start);
}

export function twitchEmoteUrl(id: string, animated: boolean) {
  const kind = animated ? "default" : "static";
  return `https://static-cdn.jtvnw.net/emoticons/v2/${id}/${kind}/dark/2.0`;
}

export function kickEmoteUrl(id: string) {
  return `https://files.kick.com/emotes/${id}/fullsize`;
}

export function fragmentsFromTwitch(
  text: string,
  emoteTag: string | undefined,
  thirdParty: Map<string, EmoteFile>,
  animated: boolean,
): Fragment[] {
  const twitch = parseTwitchEmotes(emoteTag);
  if (!twitch.length) return fragmentsFromWords(text, thirdParty);

  // Twitch emote positions count Unicode code points, not UTF-16 units,
  // so slice by code point or any emoji earlier in the message shifts them.
  const chars = Array.from(text);
  const out: Fragment[] = [];
  let cursor = 0;
  for (const emote of twitch) {
    if (emote.start < cursor || emote.end >= chars.length) continue;
    if (emote.start > cursor) {
      out.push(
        ...fragmentsFromWords(chars.slice(cursor, emote.start).join(""), thirdParty),
      );
    }
    const name = chars.slice(emote.start, emote.end + 1).join("");
    out.push({
      type: "emote",
      name,
      url: twitchEmoteUrl(emote.id, animated),
      urlStatic: twitchEmoteUrl(emote.id, false),
    });
    cursor = emote.end + 1;
  }
  if (cursor < chars.length) {
    out.push(...fragmentsFromWords(chars.slice(cursor).join(""), thirdParty));
  }
  return mergeText(out);
}

const KICK_EMOTE = /\[emote:(\d+):([^\]]+)\]/g;

export function fragmentsFromKick(
  text: string,
  thirdParty: Map<string, EmoteFile>,
): Fragment[] {
  const out: Fragment[] = [];
  let last = 0;
  for (const match of text.matchAll(KICK_EMOTE)) {
    const index = match.index ?? 0;
    if (index > last) {
      out.push(...fragmentsFromWords(text.slice(last, index), thirdParty));
    }
    out.push({
      type: "emote",
      name: match[2],
      url: kickEmoteUrl(match[1]),
    });
    last = index + match[0].length;
  }
  if (last < text.length) out.push(...fragmentsFromWords(text.slice(last), thirdParty));
  return mergeText(out);
}

export function fragmentsFromWords(
  text: string,
  thirdParty: Map<string, EmoteFile>,
): Fragment[] {
  if (!text) return [];
  if (!thirdParty.size) return [{ type: "text", text }];

  const out: Fragment[] = [];
  const parts = text.split(/(\s+)/);
  for (const part of parts) {
    const emote = thirdParty.get(part);
    if (emote) {
      out.push({
        type: "emote",
        name: part,
        url: emote.url,
        urlStatic: emote.urlStatic,
      });
    } else if (part) {
      out.push({ type: "text", text: part });
    }
  }
  return mergeText(out);
}

function mergeText(fragments: Fragment[]): Fragment[] {
  const out: Fragment[] = [];
  for (const fragment of fragments) {
    const last = out[out.length - 1];
    if (fragment.type === "text" && last?.type === "text") {
      last.text += fragment.text;
    } else {
      out.push(fragment);
    }
  }
  return out;
}
