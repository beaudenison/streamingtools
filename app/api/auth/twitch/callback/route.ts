import { appOrigin } from "@/lib/auth/http";
import { finishLogin } from "@/lib/auth/finish";
import { openSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  const origin = appOrigin(request);
  const url = new URL(request.url);
  const back = (path: string) => Response.redirect(new URL(path, origin));
  if (url.searchParams.get("error")) return back("/account?error=denied");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return back("/account?error=failed");
  try {
    const result = await finishLogin({ platform: "twitch", origin, code, state });
    if (result.userId) await openSession(result.userId);
    return back(result.path);
  } catch {
    return back("/account?error=failed");
  }
}
