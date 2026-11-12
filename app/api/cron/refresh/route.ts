import { pruneExpired, refreshDue } from "@/lib/auth/connect";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
      return new Response("unauthorized", { status: 401 });
    }
  }
  await refreshDue(2 * 24 * 60 * 60 * 1000);
  await pruneExpired();
  return Response.json({ ok: true });
}
