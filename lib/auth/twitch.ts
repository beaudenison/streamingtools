import { TokenError } from "@/lib/auth/token-error";
import { webhookUrl } from "@/lib/auth/http";

export const twitchScopes = [
  "moderator:read:followers",
  "channel:read:subscriptions",
  "bits:read",
];

const twitchEvents = [
  { type: "channel.follow", version: "2" },
  { type: "channel.subscribe", version: "1" },
  { type: "channel.subscription.message", version: "1" },
  { type: "channel.subscription.gift", version: "1" },
  { type: "channel.cheer", version: "1" },
  { type: "channel.raid", version: "1" },
] as const;

export type TokenBundle = {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date | null;
  scopes: string;
};

function clientId() {
  return process.env.TWITCH_CLIENT_ID || "";
}

function clientSecret() {
  return process.env.TWITCH_CLIENT_SECRET || "";
}

function form(body: Record<string, string>) {
  return new URLSearchParams(body);
}

export function twitchAuthUrl(input: { redirectUri: string; state: string }) {
  const url = new URL("https://id.twitch.tv/oauth2/authorize");
  url.searchParams.set("client_id", clientId());
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", twitchScopes.join(" "));
  url.searchParams.set("state", input.state);
  return url.toString();
}

async function readToken(response: Response): Promise<TokenBundle> {
  if (!response.ok) throw new TokenError(`Twitch token ${response.status}`, response.status);
  const data = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string[];
  };
  if (!data.access_token || !data.refresh_token) throw new Error("Twitch token missing");
  const expiresAt =
    typeof data.expires_in === "number"
      ? new Date(Date.now() + data.expires_in * 1000)
      : null;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
    scopes: (data.scope ?? twitchScopes).join(" "),
  };
}

export async function exchangeTwitchCode(input: { code: string; redirectUri: string }) {
  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form({
      client_id: clientId(),
      client_secret: clientSecret(),
      code: input.code,
      grant_type: "authorization_code",
      redirect_uri: input.redirectUri,
    }),
  });
  return readToken(response);
}

export async function refreshTwitch(refreshToken: string) {
  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form({
      client_id: clientId(),
      client_secret: clientSecret(),
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  return readToken(response);
}

export async function twitchProfile(accessToken: string) {
  const response = await fetch("https://api.twitch.tv/helix/users", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Client-Id": clientId(),
    },
  });
  if (!response.ok) throw new Error(`Twitch user ${response.status}`);
  const data = (await response.json()) as {
    data?: Array<{ id?: string; login?: string; display_name?: string }>;
  };
  const user = data.data?.[0];
  if (!user?.id || !user.login) throw new Error("Twitch user missing");
  return {
    platformUserId: user.id,
    login: user.login,
    displayName: user.display_name || user.login,
  };
}

let appToken: { token: string; expires: number } | null = null;

export async function twitchAppToken() {
  if (appToken && appToken.expires > Date.now() + 60_000) return appToken.token;
  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form({
      client_id: clientId(),
      client_secret: clientSecret(),
      grant_type: "client_credentials",
    }),
  });
  if (!response.ok) throw new Error(`Twitch app token ${response.status}`);
  const data = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("Twitch app token missing");
  appToken = {
    token: data.access_token,
    expires: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return appToken.token;
}

function helix(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Client-Id": clientId(),
    "Content-Type": "application/json",
  };
}

function condition(type: string, broadcasterId: string) {
  if (type === "channel.follow") {
    return { broadcaster_user_id: broadcasterId, moderator_user_id: broadcasterId };
  }
  if (type === "channel.raid") return { to_broadcaster_user_id: broadcasterId };
  return { broadcaster_user_id: broadcasterId };
}

export async function listTwitchSubscriptions(broadcasterId: string) {
  const token = await twitchAppToken();
  const ids: string[] = [];
  for (const event of twitchEvents) {
    let cursor = "";
    for (let page = 0; page < 10; page += 1) {
      const url = new URL("https://api.twitch.tv/helix/eventsub/subscriptions");
      url.searchParams.set("type", event.type);
      url.searchParams.set("user_id", broadcasterId);
      if (cursor) url.searchParams.set("after", cursor);
      const response = await fetch(url, { headers: helix(token) });
      if (!response.ok) throw new Error(`Twitch list ${event.type} ${response.status}`);
      const data = (await response.json()) as {
        data?: Array<{ id?: string; condition?: Record<string, string> }>;
        pagination?: { cursor?: string };
      };
      for (const row of data.data ?? []) {
        const cond = row.condition ?? {};
        const owner = cond.broadcaster_user_id || cond.to_broadcaster_user_id;
        if (owner === broadcasterId && row.id) ids.push(row.id);
      }
      cursor = data.pagination?.cursor || "";
      if (!cursor) break;
    }
  }
  return ids;
}

export async function deleteTwitchSubscriptions(ids: string[]) {
  if (!ids.length) return;
  const token = await twitchAppToken();
  for (const id of ids) {
    const url = new URL("https://api.twitch.tv/helix/eventsub/subscriptions");
    url.searchParams.set("id", id);
    await fetch(url, { method: "DELETE", headers: helix(token) });
  }
}

export async function createTwitchSubscriptions(input: {
  broadcasterId: string;
  secret: string;
}) {
  const token = await twitchAppToken();
  const created: Array<{ id: string; type: string; status: string }> = [];
  for (const event of twitchEvents) {
    const response = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
      method: "POST",
      headers: helix(token),
      body: JSON.stringify({
        type: event.type,
        version: event.version,
        condition: condition(event.type, input.broadcasterId),
        transport: {
          method: "webhook",
          callback: webhookUrl("/api/webhooks/twitch"),
          secret: input.secret,
        },
      }),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Twitch ${event.type} ${response.status} ${detail.slice(0, 180)}`);
    }
    const data = (await response.json()) as {
      data?: Array<{ id?: string; type?: string; status?: string }>;
    };
    const row = data.data?.[0];
    if (row?.id) {
      created.push({
        id: row.id,
        type: row.type || event.type,
        status: row.status || "enabled",
      });
    }
  }
  return created;
}
