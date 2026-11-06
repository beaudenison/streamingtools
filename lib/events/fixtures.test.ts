import assert from "node:assert/strict";
import { createSign, generateKeyPairSync } from "node:crypto";
import test from "node:test";
import { alertLine } from "@/lib/events/types";
import { broadcasterId, mapKick, mapTwitch } from "@/lib/events/map";
import {
  freshTimestamp,
  kickMessage,
  signTwitch,
  twitchChallengeBody,
  verifyKick,
  verifyTwitch,
} from "@/lib/events/sign";

const now = Date.parse("2026-10-08T12:00:00.000Z");
const stamp = "2026-10-08T12:00:00.000Z";

test("twitch events map to one card each", () => {
  assert.deepEqual(mapTwitch("channel.follow", { user_name: "Cool_User" }), {
    platform: "twitch",
    type: "follow",
    name: "Cool_User",
    amount: null,
    message: null,
  });
  assert.equal(
    mapTwitch("channel.subscribe", { user_name: "Cool_User", is_gift: true }),
    null,
  );
  assert.equal(mapTwitch("channel.subscribe", { user_name: "Cool_User" })?.type, "sub");
  const resub = mapTwitch("channel.subscription.message", {
    user_name: "Cool_User",
    cumulative_months: 6,
    message: { text: "thanks" },
  });
  assert.equal(resub?.type, "resub");
  assert.equal(resub?.amount, 6);
  assert.equal(resub?.message, "thanks");
  assert.equal(
    mapTwitch("channel.subscription.gift", { is_anonymous: true, total: 5 })?.name,
    "Someone",
  );
  assert.equal(
    mapTwitch("channel.cheer", { user_name: "Cool_User", bits: 100, message: "hype" })?.amount,
    100,
  );
  const raid = mapTwitch("channel.raid", {
    from_broadcaster_user_name: "Cool_User",
    viewers: 12,
    to_broadcaster_user_id: "99",
  });
  assert.equal(raid?.type, "raid");
  assert.equal(raid?.amount, 12);
  assert.equal(broadcasterId("twitch", { to_broadcaster_user_id: "99" }), "99");
});

test("kick events map to one card each", () => {
  assert.equal(
    mapKick("channel.followed", { follower: { username: "Cool_User" } })?.name,
    "Cool_User",
  );
  assert.equal(
    mapKick("channel.subscription.new", { subscriber: { username: "Cool_User" } })?.type,
    "sub",
  );
  assert.equal(
    mapKick("channel.subscription.renewal", {
      subscriber: { username: "Cool_User" },
      duration: 3,
    })?.amount,
    3,
  );
  const gift = mapKick("channel.subscription.gifts", {
    gifter: { is_anonymous: true },
    giftees: [{ username: "a" }, { username: "b" }, { username: "c" }, { username: "d" }, { username: "e" }],
  });
  assert.equal(gift?.name, "Someone");
  assert.equal(gift?.amount, 5);
  const kicks = mapKick("kicks.gifted", {
    sender: { username: "Cool_User" },
    gift: { amount: 500, message: "w" },
    broadcaster: { user_id: 42 },
  });
  assert.equal(kicks?.type, "kicks");
  assert.equal(kicks?.amount, 500);
  assert.equal(kicks?.message, "w");
  assert.equal(broadcasterId("kick", { broadcaster: { user_id: 42 } }), "42");
  assert.equal(mapKick("chat.message.sent", {}), null);
});

test("alert lines match the card copy", () => {
  assert.equal(alertLine({ type: "follow", name: "Cool_User", amount: null }), "Cool_User followed");
  assert.equal(alertLine({ type: "sub", name: "Cool_User", amount: null }), "Cool_User subscribed");
  assert.equal(
    alertLine({ type: "resub", name: "Cool_User", amount: 6 }),
    "Cool_User resubscribed for 6 months",
  );
  assert.equal(alertLine({ type: "gift", name: "Cool_User", amount: 5 }), "Cool_User gifted 5");
  assert.equal(alertLine({ type: "gift", name: "Cool_User", amount: 1 }), "Cool_User gifted a sub");
  assert.equal(
    alertLine({ type: "raid", name: "Cool_User", amount: 12 }),
    "Raid from Cool_User, 12 viewers",
  );
  assert.equal(alertLine({ type: "cheer", name: "Cool_User", amount: 100 }), "Cool_User cheered 100");
  assert.equal(alertLine({ type: "kicks", name: "Cool_User", amount: 500 }), "Cool_User sent 500 KICKs");
  assert.equal(alertLine({ type: "follow", name: "  ", amount: null }), "Someone followed");
});

test("twitch signatures and the challenge body", () => {
  const raw = JSON.stringify({ challenge: "abc-123", subscription: { id: "1" } });
  const signature = signTwitch("secret", "msg", stamp, raw);
  assert.equal(
    verifyTwitch({ secret: "secret", messageId: "msg", timestamp: stamp, rawBody: raw, signature, now }),
    true,
  );
  assert.equal(
    verifyTwitch({
      secret: "secret",
      messageId: "msg",
      timestamp: stamp,
      rawBody: raw,
      signature: "sha256=dead",
      now,
    }),
    false,
  );
  assert.equal(freshTimestamp("2026-10-08T11:00:00.000Z", now), false);
  assert.equal(twitchChallengeBody(raw), "abc-123");
  assert.equal(twitchChallengeBody("{"), "");
});

test("kick signatures use the public key", () => {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = publicKey.export({ type: "spki", format: "pem" }).toString();
  const raw = JSON.stringify({ broadcaster: { user_id: 7 } });
  const signer = createSign("RSA-SHA256");
  signer.update(kickMessage("msg", stamp, raw));
  signer.end();
  const signature = signer.sign(privateKey).toString("base64");
  assert.equal(
    verifyKick({ publicKeyPem: pem, messageId: "msg", timestamp: stamp, rawBody: raw, signature, now }),
    true,
  );
  assert.equal(
    verifyKick({
      publicKeyPem: pem,
      messageId: "msg",
      timestamp: stamp,
      rawBody: raw,
      signature: Buffer.from("nope").toString("base64"),
      now,
    }),
    false,
  );
});
