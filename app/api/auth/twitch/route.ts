import { authConfigured, appOrigin } from "@/lib/auth/http";
import { beginLogin } from "@/lib/auth/finish";

export async function GET(request: Request) {
  const origin = appOrigin(request);
  if (!authConfigured("twitch")) {
    return Response.redirect(new URL("/account?error=setup", origin));
  }
  const url = await beginLogin({
    platform: "twitch",
    origin,
    returnTo: new URL(request.url).searchParams.get("return"),
  });
  return Response.redirect(url);
}
