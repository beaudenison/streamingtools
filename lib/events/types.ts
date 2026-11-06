export const alertTypes = [
  "follow",
  "sub",
  "resub",
  "gift",
  "raid",
  "cheer",
  "kicks",
] as const;

export type AlertType = (typeof alertTypes)[number];

export type NormalizedEvent = {
  platform: "twitch" | "kick";
  type: AlertType;
  name: string;
  amount: number | null;
  message: string | null;
};

export function alertLine(event: Pick<NormalizedEvent, "type" | "name" | "amount">) {
  const name = event.name.trim() || "Someone";
  const amount = event.amount;
  switch (event.type) {
    case "follow":
      return `${name} followed`;
    case "sub":
      return `${name} subscribed`;
    case "resub":
      return amount && amount > 1
        ? `${name} resubscribed for ${amount} months`
        : `${name} resubscribed`;
    case "gift":
      return amount && amount > 1 ? `${name} gifted ${amount}` : `${name} gifted a sub`;
    case "raid":
      return amount ? `Raid from ${name}, ${amount} viewers` : `Raid from ${name}`;
    case "cheer":
      return amount ? `${name} cheered ${amount}` : `${name} cheered`;
    case "kicks":
      return amount ? `${name} sent ${amount} KICKs` : `${name} sent KICKs`;
  }
}

export function person(value: unknown) {
  if (typeof value !== "string") return "Someone";
  const name = value.trim().slice(0, 64);
  return name || "Someone";
}

export function count(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}
