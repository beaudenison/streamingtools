export const kickScopes = ["user:read", "events:subscribe"];

export const kickEventNames = [
  "channel.followed",
  "channel.subscription.new",
  "channel.subscription.renewal",
  "channel.subscription.gifts",
  "kicks.gifted",
] as const;

export type KickToken = {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date | null;
  scopes: string;
};

function clientId() {
  return process.env.KICK_CLIENT_ID || "";
}

function clientSecret() {
  return process.env.KICK_CLIENT_SECRET || "";
}

export function kickAuthUrl(input: {
  redirectUri: string;
  state: string;
  challenge: string;
}) {
  const url = new URL("https://id.kick.com/oauth/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId());
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("scope", kickScopes.join(" "));
  url.searchParams.set("state", input.state);
  url.searchParams.set("code_challenge", input.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

async function readToken(response: Response, fallbackRefresh: string): Promise<KickToken> {
  if (!response.ok) throw new Error(`Kick token ${response.status}`);
  const data = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };
  if (!data.access_token) throw new Error("Kick token missing");
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || fallbackRefresh,
    expiresAt:
      typeof data.expires_in === "number"
        ? new Date(Date.now() + data.expires_in * 1000)
        : null,
    scopes: data.scope || kickScopes.join(" "),
  };
}

export async function exchangeKickCode(input: {
  code: string;
  redirectUri: string;
  verifier: string;
}) {
  const response = await fetch("https://id.kick.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId(),
      client_secret: clientSecret(),
      redirect_uri: input.redirectUri,
      code: input.code,
      code_verifier: input.verifier,
    }),
  });
  return readToken(response, "");
}

export async function refreshKick(refreshToken: string) {
  const response = await fetch("https://id.kick.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId(),
      client_secret: clientSecret(),
      refresh_token: refreshToken,
    }),
  });
  return readToken(response, refreshToken);
}

export async function kickProfile(accessToken: string) {
  const response = await fetch("https://api.kick.com/public/v1/users", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Kick user ${response.status}`);
  const data = (await response.json()) as {
    data?: Array<{ user_id?: number; name?: string }>;
  };
  const user = data.data?.[0];
  if (!user?.user_id || !user.name) throw new Error("Kick user missing");
  return {
    platformUserId: String(user.user_id),
    login: user.name,
    displayName: user.name,
  };
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

type KickSub = { id: string; name: string };

export async function listKickSubscriptions(token: string): Promise<KickSub[]> {
  const response = await fetch("https://api.kick.com/public/v1/events/subscriptions", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Kick list ${response.status}`);
  const data = (await response.json()) as {
    data?: Array<{ id?: string; event?: string; name?: string }>;
  };
  return (data.data ?? [])
    .map((row) => ({ id: row.id || "", name: row.event || row.name || "" }))
    .filter((row) => row.id);
}

export async function deleteKickSubscriptions(token: string, ids: string[]) {
  if (!ids.length) return;
  const url = new URL("https://api.kick.com/public/v1/events/subscriptions");
  for (const id of ids) url.searchParams.append("id", id);
  await fetch(url, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}

export async function createKickSubscriptions(token: string) {
  const response = await fetch("https://api.kick.com/public/v1/events/subscriptions", {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify({
      method: "webhook",
      events: kickEventNames.map((name) => ({ name, version: 1 })),
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Kick subscribe ${response.status} ${detail.slice(0, 180)}`);
  }
  const data = (await response.json()) as {
    data?: Array<{ subscription_id?: string; id?: string; name?: string; event?: string; error?: string }>;
  };
  return (data.data ?? []).map((row) => ({
    id: row.subscription_id || row.id || "",
    type: row.name || row.event || "",
    status: row.error ? "error" : "enabled",
    error: row.error || "",
  }));
}

let kickKey: { pem: string; expires: number } | null = null;

export async function kickPublicKey() {
  if (kickKey && kickKey.expires > Date.now()) return kickKey.pem;
  const response = await fetch("https://api.kick.com/public/v1/public-key");
  if (!response.ok) throw new Error(`Kick public key ${response.status}`);
  const raw = await response.text();
  let pem = raw.trim();
  if (pem.startsWith("{")) {
    const parsed = JSON.parse(pem) as { data?: unknown; public_key?: unknown };
    const data = parsed.data;
    if (typeof data === "string") pem = data;
    else if (data && typeof data === "object" && typeof (data as { public_key?: unknown }).public_key === "string") {
      pem = (data as { public_key: string }).public_key;
    } else if (typeof parsed.public_key === "string") pem = parsed.public_key;
  }
  if (!pem.includes("BEGIN")) throw new Error("Kick public key missing");
  kickKey = { pem, expires: Date.now() + 60 * 60 * 1000 };
  return pem;
}
