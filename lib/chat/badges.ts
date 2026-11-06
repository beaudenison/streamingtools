import type { Badge } from "./types";

type TwitchBadgeSet = {
  versions?: Record<string, { image_url_2x?: string; image_url_4x?: string; title?: string }>;
};

type TwitchBadgeResponse = {
  badge_sets?: Record<string, TwitchBadgeSet>;
};

const FALLBACK: Record<string, string> = {
  moderator:
    "https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d3/2",
  broadcaster:
    "https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/2",
  vip: "https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/2",
  subscriber:
    "https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/2",
  premium:
    "https://static-cdn.jtvnw.net/badges/v1/bbbe0db0-a598-423e-86d0-beed257db770/2",
  turbo:
    "https://static-cdn.jtvnw.net/badges/v1/bd444ec6-8f34-4bf9-91f4-af1e75529e3b/2",
  partner:
    "https://static-cdn.jtvnw.net/badges/v1/d12a2e27-16f6-41d0-ab77-b780518f00a3/2",
};

const kickSvg = (label: string, fill: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><rect width="18" height="18" rx="3" fill="${fill}"/><text x="9" y="13" text-anchor="middle" font-size="8" font-family="Arial" font-weight="700" fill="#000">${label}</text></svg>`,
  )}`;

const KICK_BADGES: Record<string, { title: string; url: string }> = {
  moderator: { title: "Moderator", url: kickSvg("M", "#53fc18") },
  subscriber: { title: "Subscriber", url: kickSvg("S", "#00e5ff") },
  vip: { title: "VIP", url: kickSvg("V", "#c084fc") },
  og: { title: "OG", url: kickSvg("OG", "#fbbf24") },
  founder: { title: "Founder", url: kickSvg("F", "#f97316") },
  broadcaster: { title: "Broadcaster", url: kickSvg("H", "#11ad32") },
  verified: { title: "Verified", url: kickSvg("✓", "#f8f8f8") },
  staff: { title: "Staff", url: kickSvg("K", "#f8f8f8") },
};

let globalTwitch: TwitchBadgeResponse | null = null;

async function twitchBadgeSets(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as TwitchBadgeResponse;
  } catch {
    return null;
  }
}

export async function loadTwitchBadges(channelId?: string | null) {
  if (!globalTwitch) {
    globalTwitch = await twitchBadgeSets(
      "https://badges.twitch.tv/v1/badges/global/display",
    );
  }
  const channel = channelId
    ? await twitchBadgeSets(
        `https://badges.twitch.tv/v1/badges/channels/${channelId}/display`,
      )
    : null;
  return { global: globalTwitch, channel };
}

export function twitchBadgesFromTag(
  tag: string | undefined,
  maps: {
    global: TwitchBadgeResponse | null;
    channel: TwitchBadgeResponse | null;
  },
): Badge[] {
  if (!tag) return [];
  return tag
    .split(",")
    .map((part) => {
      const [set, version] = part.split("/");
      if (!set) return null;
      const fromChannel = maps.channel?.badge_sets?.[set]?.versions?.[version];
      const fromGlobal = maps.global?.badge_sets?.[set]?.versions?.[version];
      const info = fromChannel ?? fromGlobal;
      const url = info?.image_url_2x ?? info?.image_url_4x ?? FALLBACK[set];
      if (!url) return null;
      return { id: `${set}/${version}`, title: info?.title ?? set, url } satisfies Badge;
    })
    .filter((b): b is Badge => Boolean(b));
}

export function kickBadgesFromIdentity(
  badges: Array<{ type?: string; text?: string }> | undefined,
): Badge[] {
  if (!badges) return [];
  return badges
    .map((badge) => {
      const type = (badge.type ?? "").toLowerCase();
      const known = KICK_BADGES[type];
      if (!known) return null;
      return {
        id: type,
        title: badge.text || known.title,
        url: known.url,
      } satisfies Badge;
    })
    .filter((b): b is Badge => Boolean(b));
}
