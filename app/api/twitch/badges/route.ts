import { twitchAppToken } from "@/lib/auth/twitch";

type HelixBadgeSet = {
  set_id?: string;
  versions?: Array<{
    id?: string;
    image_url_2x?: string;
    image_url_4x?: string;
    title?: string;
  }>;
};

type BadgeSets = Record<
  string,
  { versions: Record<string, { image_url_2x?: string; image_url_4x?: string; title?: string }> }
>;

const ID = /^\d{1,20}$/;

async function helixBadges(url: string, token: string): Promise<{ badge_sets: BadgeSets } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Client-Id": process.env.TWITCH_CLIENT_ID || "",
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { data?: HelixBadgeSet[] };
    const badge_sets: BadgeSets = {};
    for (const set of data.data ?? []) {
      if (!set.set_id) continue;
      const versions: BadgeSets[string]["versions"] = {};
      for (const version of set.versions ?? []) {
        if (!version.id) continue;
        versions[version.id] = {
          image_url_2x: version.image_url_2x,
          image_url_4x: version.image_url_4x,
          title: version.title,
        };
      }
      badge_sets[set.set_id] = { versions };
    }
    return { badge_sets };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (id && !ID.test(id)) {
    return Response.json({ error: "invalid id" }, { status: 400 });
  }
  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
    return Response.json({ global: null, channel: null });
  }
  let token = "";
  try {
    token = await twitchAppToken();
  } catch {
    return Response.json({ global: null, channel: null });
  }
  const [global, channel] = await Promise.all([
    helixBadges("https://api.twitch.tv/helix/chat/badges/global", token),
    id
      ? helixBadges(`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${id}`, token)
      : null,
  ]);
  return Response.json(
    { global, channel },
    { headers: { "Cache-Control": "public, max-age=600, s-maxage=3600" } },
  );
}
