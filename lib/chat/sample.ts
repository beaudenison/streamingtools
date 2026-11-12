import type { ChatMessage } from "./types";

const KAPPA = "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/2.0";
const POG =
  "https://cdn.7tv.app/emote/60ae4eee5d3fdae58314148d/2x.webp";
const CATJAM = "https://cdn.betterttv.net/emote/5f1b0186cf6d2144653d2970/2x";
const MOD =
  "https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/2";
const SUB =
  "https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/2";
const VIP =
  "https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/2";
const BROADCASTER =
  "https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/2";

export function sampleMessages(twitch: string, kick: string): ChatMessage[] {
  const mention = twitch || kick || "you";
  return [
    {
      id: "s1",
      platform: "twitch",
      user: "maple",
      color: "#ff7a18",
      raw: "first clip of the night Kappa",
      fragments: [
        { type: "text", text: "first clip of the night " },
        { type: "emote", name: "Kappa", url: KAPPA, urlStatic: KAPPA },
      ],
      badges: [{ id: "mod", title: "Moderator", url: MOD }],
      isBot: false,
      isCommand: false,
      mentioned: false,
      ts: Date.now() - 20000,
    },
    {
      id: "s2",
      platform: "kick",
      user: "nova",
      color: "#53fc18",
      raw: "that play was dirty",
      fragments: [
        { type: "text", text: "that play was dirty " },
        { type: "emote", name: "catJAM", url: CATJAM },
      ],
      badges: [{ id: "sub", title: "Subscriber", url: SUB }],
      isBot: false,
      isCommand: false,
      mentioned: false,
      ts: Date.now() - 16000,
    },
    {
      id: "s3",
      platform: "twitch",
      user: "Nightbot",
      color: "#8a8a8a",
      raw: "Follow the socials in the panels.",
      fragments: [{ type: "text", text: "Follow the socials in the panels." }],
      badges: [],
      isBot: true,
      isCommand: false,
      mentioned: false,
      ts: Date.now() - 14000,
    },
    {
      id: "s4",
      platform: "kick",
      user: "rift",
      color: "#00d4ff",
      raw: "!clip",
      fragments: [{ type: "text", text: "!clip" }],
      badges: [],
      isBot: false,
      isCommand: true,
      mentioned: false,
      ts: Date.now() - 11000,
    },
    {
      id: "s5",
      platform: "twitch",
      user: "jules",
      color: "#c084fc",
      raw: `@${mention} you seeing this`,
      fragments: [
        { type: "text", text: `@${mention} you seeing this ` },
        { type: "emote", name: "Pog", url: POG },
      ],
      badges: [{ id: "vip", title: "VIP", url: VIP }],
      isBot: false,
      isCommand: false,
      mentioned: true,
      ts: Date.now() - 7000,
    },
    {
      id: "s6",
      platform: "kick",
      user: kick || "host",
      color: "#11ad32",
      raw: "thanks for hanging out",
      fragments: [{ type: "text", text: "thanks for hanging out" }],
      badges: [{ id: "broadcaster", title: "Broadcaster", url: BROADCASTER }],
      isBot: false,
      isCommand: false,
      mentioned: false,
      ts: Date.now() - 3000,
    },
  ];
}
