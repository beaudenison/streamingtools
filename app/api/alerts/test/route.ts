import { viewer } from "@/lib/auth/session";
import { insertAlert } from "@/lib/configs";
import { alertLine, alertTypes, type AlertType, type NormalizedEvent } from "@/lib/events/types";

const samples: Record<AlertType, Pick<NormalizedEvent, "amount">> = {
  follow: { amount: null },
  sub: { amount: null },
  resub: { amount: 6 },
  gift: { amount: 5 },
  raid: { amount: 12 },
  cheer: { amount: 100 },
  kicks: { amount: 500 },
};

export async function POST(request: Request) {
  const me = await viewer();
  if (!me) return Response.json({ error: "Sign in." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { type?: string } | null;
  const type = body?.type;
  if (!type || !alertTypes.includes(type as AlertType)) {
    return Response.json({ error: "Unknown alert." }, { status: 400 });
  }
  const kind = type as AlertType;
  const event: NormalizedEvent = {
    platform: me.twitch ? "twitch" : "kick",
    type: kind,
    name: "Test",
    amount: samples[kind].amount,
    message: null,
  };
  await insertAlert(me.id, event, `test:${crypto.randomUUID()}`, true);
  return Response.json(
    { ...event, line: alertLine(event) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
