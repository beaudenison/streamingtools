import { viewer } from "@/lib/auth/session";
import { readChatConfig, saveChatConfig } from "@/lib/configs";

const quiet = { "Cache-Control": "no-store" };

export async function GET() {
  const me = await viewer();
  if (!me) return Response.json({ signedIn: false }, { status: 401, headers: quiet });
  const config = await readChatConfig(me.id);
  return Response.json({ signedIn: true, config }, { headers: quiet });
}

export async function PUT(request: Request) {
  const me = await viewer();
  if (!me) return Response.json({ error: "Sign in." }, { status: 401, headers: quiet });
  const body = (await request.json().catch(() => null)) as { settings?: unknown } | null;
  const saved = await saveChatConfig(me.id, body?.settings);
  return Response.json(saved, { headers: quiet });
}
