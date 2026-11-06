import { viewer, viewerName } from "@/lib/auth/session";

export async function GET() {
  const me = await viewer();
  if (!me) return Response.json({ signedIn: false }, { headers: { "Cache-Control": "no-store" } });
  return Response.json(
    { signedIn: true, name: viewerName(me) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
