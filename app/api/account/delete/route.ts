import { deleteUser } from "@/lib/auth/account";
import { appOrigin } from "@/lib/auth/http";
import { closeSession, viewer } from "@/lib/auth/session";

export async function POST(request: Request) {
  const me = await viewer();
  if (me) {
    await deleteUser(me.id);
    await closeSession();
  }
  return Response.redirect(new URL("/account", appOrigin(request)));
}
