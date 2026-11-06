import { chatSettingsForKey } from "@/lib/configs";

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("k") || "";
  const settings = await chatSettingsForKey(key);
  if (!settings) return Response.json({ error: "missing" }, { status: 404 });
  return Response.json(settings, { headers: { "Cache-Control": "no-store" } });
}
