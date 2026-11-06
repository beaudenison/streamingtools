import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { randomToken, sha256 } from "@/lib/secret";

const cookieName = "st_session";
const month = 60 * 60 * 24 * 30;

export type ChannelLink = {
  login: string;
  displayName: string;
  needsReauth: boolean;
  lastError: string | null;
};

export type Viewer = {
  id: string;
  twitch: ChannelLink | null;
  kick: ChannelLink | null;
};

type Row = {
  id: string;
  platform: "twitch" | "kick" | null;
  login: string | null;
  display_name: string | null;
  needs_reauth: boolean | null;
  last_error: string | null;
};

function link(row: Row): ChannelLink | null {
  if (!row.platform || !row.login || !row.display_name) return null;
  return {
    login: row.login,
    displayName: row.display_name,
    needsReauth: Boolean(row.needs_reauth),
    lastError: row.last_error,
  };
}

export function viewerName(viewer: Viewer) {
  return viewer.twitch?.displayName || viewer.kick?.displayName || "Account";
}

export async function viewer(): Promise<Viewer | null> {
  try {
    const database = await db();
    if (!database) return null;
    const token = (await cookies()).get(cookieName)?.value;
    if (!token) return null;
    const rows = await database<Row[]>`
      select u.id, c.platform, c.login, c.display_name, c.needs_reauth, c.last_error
      from sessions s
      join users u on u.id = s.user_id
      left join connections c on c.user_id = u.id
      where s.token_hash = ${sha256(token)}
        and s.expires_at > now()
    `;
    if (!rows.length) return null;
    const viewer: Viewer = { id: rows[0].id, twitch: null, kick: null };
    for (const row of rows) {
      const next = link(row);
      if (row.platform && next) viewer[row.platform] = next;
    }
    return viewer;
  } catch {
    return null;
  }
}

export async function openSession(userId: string) {
  const database = await db();
  if (!database) throw new Error("database missing");
  const token = randomToken();
  const id = crypto.randomUUID();
  const expires = new Date(Date.now() + month * 1000);
  await database`
    insert into sessions (id, user_id, token_hash, expires_at)
    values (${id}, ${userId}, ${sha256(token)}, ${expires})
  `;
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: month,
  });
}

export async function closeSession() {
  const database = await db();
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (database && token) {
    await database`delete from sessions where token_hash = ${sha256(token)}`;
  }
  jar.set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
