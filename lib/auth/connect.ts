import { db } from "@/lib/db";
import { decrypt, encrypt, randomToken } from "@/lib/secret";
import { needsSignIn } from "@/lib/auth/token-error";
import {
  createKickSubscriptions,
  deleteKickSubscriptions,
  exchangeKickCode,
  kickEventNames,
  kickProfile,
  listKickSubscriptions,
  refreshKick,
} from "@/lib/auth/kick";
import {
  createTwitchSubscriptions,
  deleteTwitchSubscriptions,
  exchangeTwitchCode,
  listTwitchSubscriptions,
  refreshTwitch,
  twitchProfile,
} from "@/lib/auth/twitch";

type Platform = "twitch" | "kick";

type ConnectionRow = {
  id: string;
  user_id: string;
  platform: Platform;
  platform_user_id: string;
  access_token_enc: string;
  refresh_token_enc: string;
  expires_at: Date | null;
  webhook_secret_enc: string | null;
  needs_reauth: boolean;
};

type Profile = {
  platformUserId: string;
  login: string;
  displayName: string;
};

type Tokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date | null;
  scopes: string;
};

function clip(error: unknown) {
  const message = error instanceof Error ? error.message : "subscribe failed";
  return message.slice(0, 280);
}

export async function saveConnection(input: {
  userId: string;
  platform: Platform;
  profile: Profile;
  tokens: Tokens;
}) {
  const database = await db();
  if (!database) throw new Error("database missing");
  const secret = randomToken().slice(0, 80);
  const rows = await database<{ id: string }[]>`
    insert into connections (
      id, user_id, platform, platform_user_id, login, display_name,
      access_token_enc, refresh_token_enc, expires_at, scopes,
      needs_reauth, webhook_secret_enc, last_error
    ) values (
      ${crypto.randomUUID()}, ${input.userId}, ${input.platform}, ${input.profile.platformUserId},
      ${input.profile.login.slice(0, 64)}, ${input.profile.displayName.slice(0, 64)},
      ${encrypt(input.tokens.accessToken)}, ${encrypt(input.tokens.refreshToken)},
      ${input.tokens.expiresAt}, ${input.tokens.scopes}, false, ${encrypt(secret)}, null
    )
    on conflict (user_id, platform) do update set
      platform_user_id = excluded.platform_user_id,
      login = excluded.login,
      display_name = excluded.display_name,
      access_token_enc = excluded.access_token_enc,
      refresh_token_enc = excluded.refresh_token_enc,
      expires_at = excluded.expires_at,
      scopes = excluded.scopes,
      needs_reauth = false,
      webhook_secret_enc = coalesce(connections.webhook_secret_enc, excluded.webhook_secret_enc),
      last_error = null
    returning id
  `;
  return rows[0].id;
}

async function loadConnection(id: string) {
  const database = await db();
  if (!database) return null;
  const rows = await database<ConnectionRow[]>`
    select id, user_id, platform, platform_user_id, access_token_enc, refresh_token_enc,
           expires_at, webhook_secret_enc, needs_reauth
    from connections
    where id = ${id}
  `;
  return rows[0] ?? null;
}

async function storeTokens(id: string, tokens: Tokens) {
  const database = await db();
  if (!database) return;
  await database`
    update connections set
      access_token_enc = ${encrypt(tokens.accessToken)},
      refresh_token_enc = ${encrypt(tokens.refreshToken)},
      expires_at = ${tokens.expiresAt},
      scopes = ${tokens.scopes},
      needs_reauth = false
    where id = ${id}
  `;
}

export async function accessToken(id: string, withinMs = 5 * 60 * 1000) {
  const row = await loadConnection(id);
  if (!row) return null;
  const expires = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  if (expires > Date.now() + withinMs) {
    try {
      return decrypt(row.access_token_enc);
    } catch {
      return null;
    }
  }
  try {
    const refreshToken = decrypt(row.refresh_token_enc);
    const tokens =
      row.platform === "twitch" ? await refreshTwitch(refreshToken) : await refreshKick(refreshToken);
    await storeTokens(id, tokens);
    return tokens.accessToken;
  } catch (error) {
    // A network blip or platform outage should not force a new sign-in;
    // the next cron run retries. Only a rejected refresh token does.
    if (!needsSignIn(error)) return null;
    const database = await db();
    if (database) {
      await database`
        update connections set needs_reauth = true, last_error = 'Connect again to refresh this channel.'
        where id = ${id}
      `;
    }
    return null;
  }
}

async function replaceSubs(
  connectionId: string,
  platform: Platform,
  rows: Array<{ id: string; type: string; status: string }>,
) {
  const database = await db();
  if (!database) return;
  await database`delete from subscriptions where connection_id = ${connectionId}`;
  for (const row of rows) {
    if (!row.id || !row.type) continue;
    await database`
      insert into subscriptions (id, connection_id, platform, external_id, event_type, status)
      values (${crypto.randomUUID()}, ${connectionId}, ${platform}, ${row.id}, ${row.type}, ${row.status})
    `;
  }
}

export async function ensureSubscriptions(connectionId: string) {
  const database = await db();
  const row = await loadConnection(connectionId);
  if (!database || !row) return;
  try {
    const token = await accessToken(connectionId);
    if (!token) throw new Error("Connect again to refresh this channel.");
    if (row.platform === "twitch") {
      const secret = row.webhook_secret_enc ? decrypt(row.webhook_secret_enc) : randomToken();
      const existing = await listTwitchSubscriptions(row.platform_user_id);
      await deleteTwitchSubscriptions(existing);
      const created = await createTwitchSubscriptions({
        broadcasterId: row.platform_user_id,
        secret,
      });
      await replaceSubs(connectionId, "twitch", created);
    } else {
      const existing = await listKickSubscriptions(token);
      const names = new Set<string>(kickEventNames);
      const ids = existing.filter((item) => names.has(item.name)).map((item) => item.id);
      await deleteKickSubscriptions(token, ids);
      const created = await createKickSubscriptions(token);
      const failed = created.find((item) => item.error);
      if (failed?.error) throw new Error(failed.error);
      await replaceSubs(connectionId, "kick", created);
    }
    await database`update connections set last_error = null where id = ${connectionId}`;
  } catch (error) {
    await database`
      update connections set last_error = ${clip(error)} where id = ${connectionId}
    `;
  }
}

export async function removeSubscriptions(connectionId: string) {
  const row = await loadConnection(connectionId);
  if (!row) return;
  try {
    const token = await accessToken(connectionId, 0);
    if (row.platform === "twitch") {
      const ids = await listTwitchSubscriptions(row.platform_user_id);
      await deleteTwitchSubscriptions(ids);
    } else if (token) {
      const existing = await listKickSubscriptions(token);
      await deleteKickSubscriptions(
        token,
        existing.map((item) => item.id),
      );
    }
  } catch {
    // The local row still goes away. A leftover webhook stops when the token is revoked.
  }
}

export async function loginProfile(input: {
  platform: Platform;
  code: string;
  redirectUri: string;
  verifier: string;
}) {
  if (input.platform === "twitch") {
    const tokens = await exchangeTwitchCode({ code: input.code, redirectUri: input.redirectUri });
    const profile = await twitchProfile(tokens.accessToken);
    return { tokens, profile };
  }
  const tokens = await exchangeKickCode({
    code: input.code,
    redirectUri: input.redirectUri,
    verifier: input.verifier,
  });
  const profile = await kickProfile(tokens.accessToken);
  return { tokens, profile };
}

export async function refreshDue(withinMs: number) {
  const database = await db();
  if (!database) return;
  const soon = new Date(Date.now() + withinMs);
  const rows = await database<{ id: string }[]>`
    select id from connections
    where needs_reauth = false
      and (expires_at is null or expires_at < ${soon})
  `;
  for (const row of rows) await accessToken(row.id, withinMs);
}

export async function pruneExpired() {
  const database = await db();
  if (!database) return;
  await database`delete from sessions where expires_at < now()`;
  await database`delete from oauth_states where expires_at < now()`;
}
