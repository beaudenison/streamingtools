import { codeChallenge, codeVerifier, randomToken } from "@/lib/secret";
import { db } from "@/lib/db";
import { safeReturn } from "@/lib/auth/http";
import { kickAuthUrl } from "@/lib/auth/kick";
import { twitchAuthUrl } from "@/lib/auth/twitch";
import { viewer } from "@/lib/auth/session";
import { ensureSubscriptions, loginProfile, saveConnection } from "@/lib/auth/connect";

type Platform = "twitch" | "kick";

function uniqueViolation(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === "23505",
  );
}

export async function beginLogin(input: {
  platform: Platform;
  origin: string;
  returnTo: string | null;
}) {
  const database = await db();
  if (!database) throw new Error("database missing");
  const state = randomToken();
  const verifier = input.platform === "kick" ? codeVerifier() : "";
  const me = await viewer();
  const returnTo = safeReturn(input.returnTo);
  await database`delete from oauth_states where expires_at < now()`;
  await database`
    insert into oauth_states (state, platform, code_verifier, user_id, return_to, expires_at)
    values (
      ${state}, ${input.platform}, ${verifier || null}, ${me?.id ?? null}, ${returnTo},
      ${new Date(Date.now() + 10 * 60 * 1000)}
    )
  `;
  const redirectUri = `${input.origin}/api/auth/${input.platform}/callback`;
  if (input.platform === "twitch") return twitchAuthUrl({ redirectUri, state });
  return kickAuthUrl({ redirectUri, state, challenge: codeChallenge(verifier) });
}

export async function finishLogin(input: {
  platform: Platform;
  origin: string;
  code: string;
  state: string;
}) {
  const database = await db();
  if (!database) return { path: "/account?error=setup", userId: "" };
  const states = await database<
    { platform: string; code_verifier: string | null; user_id: string | null; return_to: string }[]
  >`
    delete from oauth_states
    where state = ${input.state} and expires_at > now()
    returning platform, code_verifier, user_id, return_to
  `;
  const pending = states[0];
  if (!pending || pending.platform !== input.platform) {
    return { path: "/account?error=failed", userId: "" };
  }
  const redirectUri = `${input.origin}/api/auth/${input.platform}/callback`;
  const { tokens, profile } = await loginProfile({
    platform: input.platform,
    code: input.code,
    redirectUri,
    verifier: pending.code_verifier || "",
  });
  const returnTo = safeReturn(pending.return_to);
  const existing = await database<{ id: string; user_id: string }[]>`
    select id, user_id from connections
    where platform = ${input.platform} and platform_user_id = ${profile.platformUserId}
  `;
  const found = existing[0];

  if (pending.user_id) {
    if (found && found.user_id !== pending.user_id) {
      return { path: "/account?error=linked", userId: "" };
    }
    const mine = await database<{ platform_user_id: string }[]>`
      select platform_user_id from connections
      where user_id = ${pending.user_id} and platform = ${input.platform}
    `;
    if (mine[0] && mine[0].platform_user_id !== profile.platformUserId) {
      return { path: "/account?error=taken", userId: "" };
    }
    try {
      const connectionId = await saveConnection({
        userId: pending.user_id,
        platform: input.platform,
        profile,
        tokens,
      });
      await ensureSubscriptions(connectionId);
      return { path: returnTo, userId: pending.user_id };
    } catch (error) {
      if (uniqueViolation(error)) return { path: "/account?error=linked", userId: "" };
      throw error;
    }
  }

  if (found) {
    try {
      const connectionId = await saveConnection({
        userId: found.user_id,
        platform: input.platform,
        profile,
        tokens,
      });
      await ensureSubscriptions(connectionId);
      return { path: returnTo, userId: found.user_id };
    } catch (error) {
      if (uniqueViolation(error)) return { path: "/account?error=linked", userId: "" };
      throw error;
    }
  }

  const userId = crypto.randomUUID();
  await database`insert into users (id) values (${userId})`;
  try {
    const connectionId = await saveConnection({
      userId,
      platform: input.platform,
      profile,
      tokens,
    });
    await ensureSubscriptions(connectionId);
    return { path: returnTo, userId };
  } catch (error) {
    await database`delete from users where id = ${userId}`;
    if (uniqueViolation(error)) return { path: "/account?error=linked", userId: "" };
    throw error;
  }
}
