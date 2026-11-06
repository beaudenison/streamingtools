import { disconnectPlatform } from "@/lib/auth/account";
import { appOrigin } from "@/lib/auth/http";
import { closeSession, viewer } from "@/lib/auth/session";

export async function POST(request: Request) {
  const origin = appOrigin(request);
  const me = await viewer();
  if (!me) return Response.redirect(new URL("/account", origin));
  const form = await request.formData();
  const platform = form.get("platform");
  if (platform === "twitch" || platform === "kick") {
    const result = await disconnectPlatform(me.id, platform);
    if (result.removedUser) await closeSession();
  }
  return Response.redirect(new URL("/account", origin));
}
