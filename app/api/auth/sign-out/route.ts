import { appOrigin } from "@/lib/auth/http";
import { closeSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  await closeSession();
  return Response.redirect(new URL("/account", appOrigin(request)));
}
