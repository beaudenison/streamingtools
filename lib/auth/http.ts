import { site } from "@/lib/site";

const returns = new Set(["/", "/chat", "/alerts", "/account"]);

export function appOrigin(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? url.host;
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

export function safeReturn(value: string | null) {
  if (value && returns.has(value)) return value;
  return "/account";
}

export function webhookUrl(path: "/api/webhooks/twitch" | "/api/webhooks/kick") {
  return `${site.url}${path}`;
}

export function authConfigured(platform: "twitch" | "kick") {
  if (!process.env.DATABASE_URL || !process.env.TOKEN_KEY || process.env.TOKEN_KEY.length < 16) {
    return false;
  }
  if (platform === "twitch") {
    return Boolean(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET);
  }
  return Boolean(process.env.KICK_CLIENT_ID && process.env.KICK_CLIENT_SECRET);
}
