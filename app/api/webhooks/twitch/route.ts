import { userIdForBroadcaster, insertAlert } from "@/lib/configs";
import { broadcasterId, mapTwitch } from "@/lib/events/map";
import { twitchChallengeBody, verifyTwitch } from "@/lib/events/sign";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/secret";

export async function POST(request: Request) {
  const raw = await request.text();
  const messageId = request.headers.get("twitch-eventsub-message-id") || "";
  const timestamp = request.headers.get("twitch-eventsub-message-timestamp") || "";
  const signature = request.headers.get("twitch-eventsub-message-signature") || "";
  const kind = request.headers.get("twitch-eventsub-message-type") || "";
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return new Response("bad body", { status: 400 });
  }
  const subscription =
    body.subscription && typeof body.subscription === "object"
      ? (body.subscription as Record<string, unknown>)
      : {};
  const event =
    body.event && typeof body.event === "object"
      ? (body.event as Record<string, unknown>)
      : {};
  const condition =
    subscription.condition && typeof subscription.condition === "object"
      ? (subscription.condition as Record<string, unknown>)
      : {};
  const owner =
    broadcasterId("twitch", event) ||
    (typeof condition.broadcaster_user_id === "string" ? condition.broadcaster_user_id : "") ||
    (typeof condition.to_broadcaster_user_id === "string" ? condition.to_broadcaster_user_id : "");
  const connection = await userIdForBroadcaster("twitch", owner);
  if (!connection?.webhook_secret_enc) return new Response(null, { status: 204 });
  let secret = "";
  try {
    secret = decrypt(connection.webhook_secret_enc);
  } catch {
    return new Response("unauthorized", { status: 403 });
  }
  const ok = verifyTwitch({ secret, messageId, timestamp, rawBody: raw, signature });
  if (!ok) return new Response("unauthorized", { status: 403 });

  if (kind === "webhook_callback_verification") {
    return new Response(twitchChallengeBody(raw), {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  if (kind === "revocation") {
    const database = await db();
    const subId = typeof subscription.id === "string" ? subscription.id : "";
    if (database && subId) {
      await database`delete from subscriptions where external_id = ${subId}`;
    }
    if (subscription.status === "authorization_revoked" && database) {
      await database`
        update connections
        set needs_reauth = true, last_error = 'Connect Twitch again.'
        where user_id = ${connection.user_id} and platform = 'twitch'
      `;
    }
    return new Response(null, { status: 204 });
  }

  const type = typeof subscription.type === "string" ? subscription.type : "";
  const mapped = mapTwitch(type, event);
  if (mapped) await insertAlert(connection.user_id, mapped, messageId || crypto.randomUUID());
  return new Response(null, { status: 204 });
}
