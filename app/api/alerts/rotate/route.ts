import { viewer } from "@/lib/auth/session";
import { rotateAlertKey } from "@/lib/configs";

export async function POST() {
  const me = await viewer();
  if (!me) return Response.json({ error: "Sign in." }, { status: 401 });
  const overlayKey = await rotateAlertKey(me.id);
  if (!overlayKey) return Response.json({ error: "No alerts yet." }, { status: 404 });
  return Response.json({ overlayKey }, { headers: { "Cache-Control": "no-store" } });
}
