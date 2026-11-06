import { createHmac, createPublicKey, createVerify, timingSafeEqual } from "crypto";

const tenMinutes = 10 * 60 * 1000;

export function twitchMessage(messageId: string, timestamp: string, rawBody: string) {
  return `${messageId}${timestamp}${rawBody}`;
}

export function signTwitch(secret: string, messageId: string, timestamp: string, rawBody: string) {
  return `sha256=${createHmac("sha256", secret)
    .update(twitchMessage(messageId, timestamp, rawBody))
    .digest("hex")}`;
}

export function freshTimestamp(timestamp: string, now = Date.now()) {
  const at = Date.parse(timestamp);
  if (!Number.isFinite(at)) return false;
  const age = Math.abs(now - at);
  return age <= tenMinutes;
}

export function verifyTwitch(input: {
  secret: string;
  messageId: string;
  timestamp: string;
  rawBody: string;
  signature: string;
  now?: number;
}) {
  if (!freshTimestamp(input.timestamp, input.now)) return false;
  const expected = signTwitch(input.secret, input.messageId, input.timestamp, input.rawBody);
  const left = Buffer.from(expected);
  const right = Buffer.from(input.signature);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function kickMessage(messageId: string, timestamp: string, rawBody: string) {
  return `${messageId}.${timestamp}.${rawBody}`;
}

export function verifyKick(input: {
  publicKeyPem: string;
  messageId: string;
  timestamp: string;
  rawBody: string;
  signature: string;
  now?: number;
}) {
  if (!freshTimestamp(input.timestamp, input.now)) return false;
  try {
    const key = createPublicKey(input.publicKeyPem);
    const verify = createVerify("RSA-SHA256");
    verify.update(kickMessage(input.messageId, input.timestamp, input.rawBody));
    verify.end();
    return verify.verify(key, Buffer.from(input.signature, "base64"));
  } catch {
    return false;
  }
}

export function twitchChallengeBody(rawBody: string) {
  try {
    const parsed = JSON.parse(rawBody) as { challenge?: unknown };
    return typeof parsed.challenge === "string" ? parsed.challenge : "";
  } catch {
    return "";
  }
}
