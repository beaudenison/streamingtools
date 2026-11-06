import { ignoreList, type ChatSettings } from "./settings";
import type { ChatMessage } from "./types";

export function isVisible(message: ChatMessage, settings: ChatSettings) {
  if (settings.hideBots && message.isBot) return false;
  if (settings.hideCommands && message.isCommand) return false;
  if (ignoreList(settings).includes(message.user.toLowerCase())) return false;
  return true;
}

export function mentionsChannel(text: string, settings: ChatSettings) {
  const names = [settings.twitch, settings.kick]
    .map((n) => n.trim().toLowerCase())
    .filter(Boolean);
  if (!names.length) return false;
  const lower = text.toLowerCase();
  return names.some((n) => lower.includes(`@${n}`));
}
