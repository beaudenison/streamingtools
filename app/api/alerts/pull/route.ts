import { pullAlerts } from "@/lib/configs";
import { alertLine, type AlertType } from "@/lib/events/types";

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("k") || "";
  const pulled = await pullAlerts(key);
  if (!pulled) return Response.json({ error: "missing" }, { status: 404 });
  return Response.json(
    {
      settings: pulled.settings,
      events: pulled.events.map((event) => ({
        ...event,
        line: alertLine({
          type: event.type as AlertType,
          name: event.name,
          amount: event.amount,
        }),
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
