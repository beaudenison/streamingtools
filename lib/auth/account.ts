import { removeSubscriptions } from "@/lib/auth/connect";
import { db } from "@/lib/db";

export async function disconnectPlatform(userId: string, platform: "twitch" | "kick") {
  const database = await db();
  if (!database) return { removedUser: false };
  const rows = await database<{ id: string }[]>`
    select id from connections where user_id = ${userId} and platform = ${platform}
  `;
  if (!rows[0]) return { removedUser: false };
  await removeSubscriptions(rows[0].id);
  await database`delete from connections where id = ${rows[0].id}`;
  const left = await database<{ id: string }[]>`
    select id from connections where user_id = ${userId}
  `;
  if (left.length) return { removedUser: false };
  await database`delete from users where id = ${userId}`;
  return { removedUser: true };
}

export async function deleteUser(userId: string) {
  const database = await db();
  if (!database) return;
  const rows = await database<{ id: string }[]>`
    select id from connections where user_id = ${userId}
  `;
  for (const row of rows) await removeSubscriptions(row.id);
  await database`delete from users where id = ${userId}`;
}
