export type Platform = "twitch" | "kick";

export type EmoteFile = {
  url: string;
  urlStatic?: string;
};

export type Fragment =
  | { type: "text"; text: string }
  | { type: "emote"; name: string; url: string; urlStatic?: string };

export type Badge = {
  id: string;
  title: string;
  url: string;
};

export type ChatMessage = {
  id: string;
  platform: Platform;
  user: string;
  color: string;
  raw: string;
  fragments: Fragment[];
  badges: Badge[];
  isBot: boolean;
  isCommand: boolean;
  mentioned: boolean;
  ts: number;
};
