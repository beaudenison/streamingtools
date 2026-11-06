import { count, person, type NormalizedEvent } from "@/lib/events/types";

function text(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, 180);
  return trimmed || null;
}

export function mapTwitch(
  type: string,
  event: Record<string, unknown>,
): NormalizedEvent | null {
  if (type === "channel.follow") {
    return { platform: "twitch", type: "follow", name: person(event.user_name), amount: null, message: null };
  }
  if (type === "channel.subscribe") {
    if (event.is_gift === true) return null;
    return { platform: "twitch", type: "sub", name: person(event.user_name), amount: null, message: null };
  }
  if (type === "channel.subscription.message") {
    const message = event.message;
    const body =
      message && typeof message === "object"
        ? text((message as { text?: unknown }).text)
        : null;
    return {
      platform: "twitch",
      type: "resub",
      name: person(event.user_name),
      amount: count(event.cumulative_months),
      message: body,
    };
  }
  if (type === "channel.subscription.gift") {
    return {
      platform: "twitch",
      type: "gift",
      name: event.is_anonymous === true ? "Someone" : person(event.user_name),
      amount: count(event.total),
      message: null,
    };
  }
  if (type === "channel.cheer") {
    return {
      platform: "twitch",
      type: "cheer",
      name: event.is_anonymous === true ? "Someone" : person(event.user_name),
      amount: count(event.bits),
      message: text(event.message),
    };
  }
  if (type === "channel.raid") {
    return {
      platform: "twitch",
      type: "raid",
      name: person(event.from_broadcaster_user_name),
      amount: count(event.viewers),
      message: null,
    };
  }
  return null;
}

function kickUser(value: unknown) {
  if (!value || typeof value !== "object") return "Someone";
  const record = value as { username?: unknown; is_anonymous?: unknown };
  if (record.is_anonymous === true) return "Someone";
  return person(record.username);
}

export function mapKick(type: string, body: Record<string, unknown>): NormalizedEvent | null {
  if (type === "channel.followed") {
    return { platform: "kick", type: "follow", name: kickUser(body.follower), amount: null, message: null };
  }
  if (type === "channel.subscription.new") {
    return { platform: "kick", type: "sub", name: kickUser(body.subscriber), amount: null, message: null };
  }
  if (type === "channel.subscription.renewal") {
    return {
      platform: "kick",
      type: "resub",
      name: kickUser(body.subscriber),
      amount: count(body.duration),
      message: null,
    };
  }
  if (type === "channel.subscription.gifts") {
    const giftees = Array.isArray(body.giftees) ? body.giftees.length : null;
    return {
      platform: "kick",
      type: "gift",
      name: kickUser(body.gifter),
      amount: giftees || null,
      message: null,
    };
  }
  if (type === "kicks.gifted") {
    const gift =
      body.gift && typeof body.gift === "object" ? (body.gift as Record<string, unknown>) : {};
    return {
      platform: "kick",
      type: "kicks",
      name: kickUser(body.sender),
      amount: count(gift.amount),
      message: text(gift.message),
    };
  }
  return null;
}

export function broadcasterId(platform: "twitch" | "kick", body: Record<string, unknown>) {
  if (platform === "twitch") {
    const id = body.broadcaster_user_id ?? body.to_broadcaster_user_id;
    return typeof id === "string" && id ? id : "";
  }
  const broadcaster = body.broadcaster;
  if (!broadcaster || typeof broadcaster !== "object") return "";
  const id = (broadcaster as { user_id?: unknown }).user_id;
  if (typeof id === "number" || typeof id === "string") return String(id);
  return "";
}
