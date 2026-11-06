import { kickPublicKey } from "@/lib/auth/kick";
import { insertAlert, userIdForBroadcaster } from "@/lib/configs";
import { broadcasterId, mapKick } from "@/lib/events/map";
import { verifyKick } from "@/lib/events/sign";

export async function POST(request: Request) {
  const raw = await request.text();
  const messageId = request.headers.get("kick-event-message-id") || "";
  const timestamp = request.headers.get("kick-event-message-timestamp") || "";
  const signature = request.headers.get("kick-event-signature") || "";
  const type = request.headers.get("kick-event-type") || "";
  let pem = "";
  try {
    pem = await kickPublicKey();
  } catch {
    return new Response("key", { status: 500 });
  }
  const ok = verifyKick({
    publicKeyPem: pem,
    messageId,
    timestamp,
    rawBody: raw,
    signature,
  });
  if (!ok) return new Response("unauthorized", { status: 403 });

  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return new Response(null, { status: 204 });
  }
  const owner = broadcasterId("kick", body);
  const connection = await userIdForBroadcaster("kick", owner);
  if (!connection) return new Response(null, { status: 204 });
  const mapped = mapKick(type, body);
  if (mapped) await insertAlert(connection.user_id, mapped, messageId || crypto.randomUUID());
  return new Response(null, { status: 204 });
}
