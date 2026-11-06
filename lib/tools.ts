import type { Faq } from "@/lib/seo";

export type ToolKind = "download" | "web";

export type Tool = {
  name: string;
  slug: string;
  blurb: string;
  seoTitle: string;
  description: string;
  keywords: string[];
  faqs: Faq[];
  icon: string;
  kind: ToolKind;
  cta: string;
  href: string;
  version?: string;
  platform?: string;
  steps?: string[];
  notes?: string[];
  download?: string;
};

export const portraitClip: Tool = {
  name: "Portrait Clip",
  slug: "portrait-clip",
  version: "1.0.2",
  platform: "Windows",
  blurb: "Vertical shorts from an OBS or Streamlabs recording.",
  seoTitle: "Portrait Clip for OBS and Streamlabs",
  description:
    "Turn a landscape OBS or Streamlabs recording into a vertical short. Facecam on top, gameplay below. Free for Windows, with no account and no watermark.",
  keywords: [
    "Portrait Clip",
    "vertical clips",
    "OBS",
    "Streamlabs",
    "YouTube Shorts",
    "TikTok",
    "Reels",
    "facecam",
    "gameplay crop",
    "Windows",
  ],
  download:
    "https://github.com/beaudenison/portrait-clip/releases/download/v1.0.2/Portrait.Clip_1.0.2_x64-setup.exe",
  href: "https://github.com/beaudenison/portrait-clip/releases/download/v1.0.2/Portrait.Clip_1.0.2_x64-setup.exe",
  icon: "/icons/portrait-clip.png",
  kind: "download",
  cta: "Download",
  notes: [
    "Compile uses NVIDIA, AMD, or Intel only when that encoder opens. Other PCs get software H.264.",
    "Run this setup to replace 1.0.1. Your clips, layouts, and settings stay.",
  ],
  steps: [
    "Import an MP4, MOV, MKV, WEBM, or AVI from OBS or Streamlabs.",
    "Frame the camera and the gameplay. Locked boxes zoom instead of stretching.",
    "Drag the timeline to the moment you want, then split or trim.",
    "Compile locally at 720p or 1080p, 30 or 60 fps. You get a video only.",
  ],
  faqs: [
    {
      q: "Which recordings does Portrait Clip open?",
      a: "MP4, MOV, MKV, WEBM, and AVI. A landscape recording from OBS or Streamlabs is the usual source. A desktop recording works too.",
    },
    {
      q: "How is a vertical short framed?",
      a: "A new clip puts the facecam in a 16:9 bar across the top of a 9:16 frame. Gameplay fills the rest. Resizing zooms instead of stretching. You can also export square or landscape.",
    },
    {
      q: "Does the app upload my video?",
      a: "No. Portrait Clip has no account. Compile runs on your Windows PC and writes an MP4 to a folder you choose.",
    },
  ],
};

export const chatOverlay: Tool = {
  name: "Chat Overlay",
  slug: "chat",
  blurb: "Twitch and Kick chat for an OBS or Streamlabs browser source.",
  seoTitle: "Twitch and Kick chat overlay for OBS",
  description:
    "Free Twitch and Kick chat overlay for OBS and Streamlabs. Style messages, badges, and filters, then paste the URL into a browser source. Sign in only if you want that look saved.",
  keywords: [
    "Twitch chat overlay",
    "Kick chat overlay",
    "OBS browser source",
    "Streamlabs",
    "chat overlay",
    "Twitch",
    "Kick",
  ],
  href: "/chat",
  icon: "/icons/chat-overlay.svg",
  kind: "web",
  cta: "Open",
  platform: "OBS",
  steps: [
    "Enter a Twitch channel, a Kick channel, or both.",
    "Pick a look and tweak type, badges, and filters.",
    "Copy the overlay URL.",
    "In OBS or Streamlabs, add a Browser Source at 400×700 and paste the URL.",
  ],
  faqs: [
    {
      q: "Which chats can the overlay show?",
      a: "Public Twitch and Kick channels. You can show one platform or both in the same overlay.",
    },
    {
      q: "How do I add it to OBS or Streamlabs?",
      a: "Enter the channel, pick a look, and copy the overlay URL. Add a Browser Source at 400×700 and paste that URL.",
    },
    {
      q: "Do I need a Twitch or Kick account?",
      a: "No. The overlay reads public chat. Sign in if you want the look saved, so the OBS link stays the same when you change it.",
    },
    {
      q: "Will I have to copy a new link every time I change the look?",
      a: "Sign in with Twitch or Kick and the overlay link stays the same. The look is saved on your account. Without a sign-in, the look stays in the link you copy.",
    },
  ],
};

export const alerts: Tool = {
  name: "Alerts",
  slug: "alerts",
  blurb: "Follow, sub, raid, cheer, and KICKs alerts for OBS.",
  seoTitle: "Twitch and Kick alerts for OBS",
  description:
    "Free Twitch and Kick alerts for OBS and Streamlabs. Follows, subs, gifted subs, raids, cheers, and KICKs in one browser source. Sign in with Twitch or Kick.",
  keywords: [
    "Twitch alerts",
    "Kick alerts",
    "OBS browser source",
    "Streamlabs",
    "follower alert",
    "sub alert",
    "raid alert",
    "KICKs alert",
  ],
  href: "/alerts",
  icon: "/icons/alerts.svg",
  kind: "web",
  cta: "Open",
  platform: "OBS",
  steps: [
    "Sign in with Twitch, Kick, or both.",
    "Choose which alerts show, and set the type.",
    "Copy the overlay URL. It stays the same when you change the look.",
    "In OBS or Streamlabs, add a Browser Source at 1920×1080, paste the URL, and turn on Control audio via OBS.",
  ],
  faqs: [
    {
      q: "Which alerts can this show?",
      a: "Twitch follows, new subs, resubs, gifted subs, incoming raids, and cheers. Kick follows, new subs, renewals, gifted subs, and KICKs. Tips are not included.",
    },
    {
      q: "Do I need a Twitch or Kick account?",
      a: "Sign in with Twitch, Kick, or both. Streaming Tools does not ask for a password. The sign-in is what lets alerts hear follows and subs.",
    },
    {
      q: "Does the OBS link change when I edit the look?",
      a: "No. The look is saved on your sign-in. Copy the link once. Use New link if you want the old one to stop.",
    },
  ],
};

export const tools: Tool[] = [portraitClip, chatOverlay, alerts];
