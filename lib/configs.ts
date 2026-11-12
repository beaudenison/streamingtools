import { sanitizeAlertSettings } from "@/lib/alerts/settings";
import { sanitizeSettings } from "@/lib/chat/settings";
import { db } from "@/lib/db";
import { alertTypes, type NormalizedEvent } from "@/lib/events/types";
import { randomToken } from "@/lib/secret";

type AlertRow = {
  id: string;
  platform: "twitch" | "kick";
  type: string;
  name: string;
  amount: number | null;
  message: string | null;
  is_test: boolean;
  created_at: Date;
};

export async function readChatConfig(userId: string) {
  const database = await db();
  if (!database) return null;
  const rows = await database<{ overlay_key: string; settings: unknown }[]>`
    select overlay_key, settings from chat_configs where user_id = ${userId}
  `;
  if (!rows[0]) return null;
  return { overlayKey: rows[0].overlay_key, settings: sanitizeSettings(rows[0].settings) };
}

export async function saveChatConfig(userId: string, settings: unknown) {
  const database = await db();
  if (!database) throw new Error("database missing");
  const clean = sanitizeSettings(settings);
  const key = randomToken();
  const rows = await database<{ overlay_key: string }[]>`
    insert into chat_configs (user_id, overlay_key, settings)
    values (${userId}, ${key}, ${database.json(clean)})
    on conflict (user_id) do update set
      settings = excluded.settings,
      updated_at = now()
    returning overlay_key
  `;
  return { overlayKey: rows[0].overlay_key, settings: clean };
}

export async function rotateChatKey(userId: string) {
  const database = await db();
  if (!database) throw new Error("database missing");
  const key = randomToken();
  const rows = await database<{ overlay_key: string }[]>`
    update chat_configs set overlay_key = ${key}, updated_at = now()
    where user_id = ${userId}
    returning overlay_key
  `;
  return rows[0]?.overlay_key ?? "";
}

export async function chatSettingsForKey(key: string) {
  const database = await db();
  if (!database || !key) return null;
  const rows = await database<{ settings: unknown }[]>`
    select settings from chat_configs where overlay_key = ${key}
  `;
  if (!rows[0]) return null;
  return sanitizeSettings(rows[0].settings);
}

export async function readAlertConfig(userId: string) {
  const database = await db();
  if (!database) return null;
  const key = randomToken();
  const rows = await database<{ overlay_key: string; settings: unknown }[]>`
    insert into alert_configs (user_id, overlay_key, settings)
    values (${userId}, ${key}, ${database.json(sanitizeAlertSettings(null))})
    on conflict (user_id) do update set user_id = excluded.user_id
    returning overlay_key, settings
  `;
  return {
    overlayKey: rows[0].overlay_key,
    settings: sanitizeAlertSettings(rows[0].settings),
  };
}

export async function saveAlertConfig(userId: string, settings: unknown) {
  const database = await db();
  if (!database) throw new Error("database missing");
  const clean = sanitizeAlertSettings(settings);
  await readAlertConfig(userId);
  const rows = await database<{ overlay_key: string }[]>`
    update alert_configs set settings = ${database.json(clean)}, updated_at = now()
    where user_id = ${userId}
    returning overlay_key
  `;
  return { overlayKey: rows[0].overlay_key, settings: clean };
}

export async function rotateAlertKey(userId: string) {
  const database = await db();
  if (!database) throw new Error("database missing");
  const key = randomToken();
  const rows = await database<{ overlay_key: string }[]>`
    update alert_configs set overlay_key = ${key}, updated_at = now()
    where user_id = ${userId}
    returning overlay_key
  `;
  return rows[0]?.overlay_key ?? "";
}

export async function insertAlert(
  userId: string,
  event: NormalizedEvent,
  dedupeKey: string,
  isTest = false,
) {
  const database = await db();
  if (!database) return;
  await database`
    insert into alert_events (
      id, user_id, platform, type, name, amount, message, dedupe_key, is_test
    ) values (
      ${crypto.randomUUID()}, ${userId}, ${event.platform}, ${event.type},
      ${event.name}, ${event.amount}, ${event.message}, ${dedupeKey}, ${isTest}
    )
    on conflict (user_id, dedupe_key) do nothing
  `;
}

export async function pullAlerts(key: string) {
  const database = await db();
  if (!database || !key) return null;
  const configs = await database<{ user_id: string; settings: unknown }[]>`
    select user_id, settings from alert_configs where overlay_key = ${key}
  `;
  if (!configs[0]) return null;
  const settings = sanitizeAlertSettings(configs[0].settings);
  const enabled = alertTypes.filter((type) => settings.enabled[type]);
  const userId = configs[0].user_id;
  const events = enabled.length
    ? await database<AlertRow[]>`
        update alert_events
        set delivered_at = now()
        where id in (
          select id from alert_events
          where user_id = ${userId}
            and delivered_at is null
            and created_at > now() - interval '2 minutes'
            and (is_test or type = any(${enabled}))
        )
        returning id, platform, type, name, amount, message, is_test, created_at
      `
    : await database<AlertRow[]>`
        update alert_events
        set delivered_at = now()
        where id in (
          select id from alert_events
          where user_id = ${userId}
            and delivered_at is null
            and created_at > now() - interval '2 minutes'
            and is_test
        )
        returning id, platform, type, name, amount, message, is_test, created_at
      `;
  await database`delete from alert_events where created_at < now() - interval '15 minutes'`;
  return {
    settings,
    events: [...events]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((event) => ({
        id: event.id,
        platform: event.platform,
        type: event.type,
        name: event.name,
        amount: event.amount,
        message: event.message,
      })),
  };
}

export async function userIdForBroadcaster(platform: "twitch" | "kick", platformUserId: string) {
  const database = await db();
  if (!database || !platformUserId) return null;
  const rows = await database<{ user_id: string; webhook_secret_enc: string | null }[]>`
    select user_id, webhook_secret_enc from connections
    where platform = ${platform} and platform_user_id = ${platformUserId}
  `;
  return rows[0] ?? null;
}
