import type { EmoteFile } from "./types";

type SeventvFile = { name: string; format: string };
type SeventvEmote = {
  name: string;
  data?: {
    host?: { url: string; files?: SeventvFile[] };
  };
};
type SeventvUser = {
  emote_set?: { emotes?: SeventvEmote[] };
};

function seventvUrl(emote: SeventvEmote, fileName: string) {
  const host = emote.data?.host?.url;
  if (!host) return "";
  const base = host.startsWith("http") ? host : `https:${host}`;
  return `${base}/${fileName}`;
}

function addSeventv(map: Map<string, EmoteFile>, emotes: SeventvEmote[] | undefined) {
  if (!emotes) return;
  for (const emote of emotes) {
    const files = emote.data?.host?.files ?? [];
    const webp = files.find((f) => f.name === "2x.webp")?.name ?? "2x.webp";
    const png = files.find((f) => f.name === "2x.png")?.name;
    const url = seventvUrl(emote, webp);
    if (!url || !emote.name) continue;
    map.set(emote.name, {
      url,
      urlStatic: png ? seventvUrl(emote, png) : url,
    });
  }
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function twitchUserId(login: string): Promise<string | null> {
  const data = await fetchJson<Array<{ id: string }>>(
    `https://api.ivr.fi/v2/twitch/user?login=${encodeURIComponent(login)}`,
  );
  return data?.[0]?.id ?? null;
}

export async function loadTwitchEmotes(login: string): Promise<Map<string, EmoteFile>> {
  const map = new Map<string, EmoteFile>();
  const id = await twitchUserId(login);
  const [globals7, channel7, globalsBttv, channelBttv, ffz] = await Promise.all([
    fetchJson<SeventvUser>("https://7tv.io/v3/emote-sets/global"),
    id ? fetchJson<SeventvUser>(`https://7tv.io/v3/users/twitch/${id}`) : null,
    fetchJson<{ code: string; id: string }[]>(
      "https://api.betterttv.net/3/cached/emotes/global",
    ),
    id
      ? fetchJson<{
          channelEmotes?: { code: string; id: string }[];
          sharedEmotes?: { code: string; id: string }[];
        }>(`https://api.betterttv.net/3/cached/users/twitch/${id}`)
      : null,
    fetchJson<{
      sets?: Record<string, { emoticons?: { name: string; id: number }[] }>;
    }>(`https://api.frankerfacez.com/v1/room/${encodeURIComponent(login)}`),
  ]);

  addSeventv(map, (globals7 as unknown as { emotes?: SeventvEmote[] })?.emotes);
  addSeventv(map, channel7?.emote_set?.emotes);

  const addBttv = (list?: { code: string; id: string }[]) => {
    list?.forEach((emote) => {
      map.set(emote.code, {
        url: `https://cdn.betterttv.net/emote/${emote.id}/2x`,
        urlStatic: `https://cdn.betterttv.net/emote/${emote.id}/2x`,
      });
    });
  };
  addBttv(globalsBttv ?? undefined);
  addBttv(channelBttv?.channelEmotes);
  addBttv(channelBttv?.sharedEmotes);

  Object.values(ffz?.sets ?? {}).forEach((set) => {
    set.emoticons?.forEach((emote) => {
      map.set(emote.name, {
        url: `https://cdn.frankerfacez.com/emote/${emote.id}/2`,
        urlStatic: `https://cdn.frankerfacez.com/emote/${emote.id}/2`,
      });
    });
  });

  return map;
}

export async function loadKickEmotes(
  userId: string | number | null,
): Promise<Map<string, EmoteFile>> {
  const map = new Map<string, EmoteFile>();
  const globals = await fetchJson<SeventvUser>("https://7tv.io/v3/emote-sets/global");
  addSeventv(map, (globals as unknown as { emotes?: SeventvEmote[] })?.emotes);
  if (userId) {
    const channel = await fetchJson<SeventvUser>(
      `https://7tv.io/v3/users/kick/${userId}`,
    );
    addSeventv(map, channel?.emote_set?.emotes);
  }
  return map;
}
