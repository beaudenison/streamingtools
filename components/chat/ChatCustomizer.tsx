"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ChatFeed from "@/components/chat/ChatFeed";
import { connectKick, resolveKickChannel } from "@/lib/chat/kick";
import { sampleMessages } from "@/lib/chat/sample";
import {
  applyPreset,
  decodeSettings,
  defaultSettings,
  encodeSettings,
  fonts,
  presets,
  sanitizeSettings,
  type ChatSettings,
  type PresetId,
} from "@/lib/chat/settings";
import { connectTwitch } from "@/lib/chat/twitch";
import type { ChatMessage } from "@/lib/chat/types";
import { useVisibleMessages } from "@/lib/chat/useVisible";

export default function ChatCustomizer() {
  const [settings, setSettings] = useState<ChatSettings>(defaultSettings);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"url" | "saved">("url");
  const [overlayKey, setOverlayKey] = useState("");
  const [saveNote, setSaveNote] = useState("");
  const [live, setLive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [kickStatus, setKickStatus] = useState<"idle" | "ok" | "err">("idle");
  const settingsRef = useRef(settings);
  const skipSave = useRef(true);
  settingsRef.current = settings;

  useEffect(() => {
    let cancel = false;
    (async () => {
      let account: {
        signedIn?: boolean;
        config?: { overlayKey: string; settings: ChatSettings } | null;
      } | null = null;
      try {
        const res = await fetch("/api/chat/config");
        if (res.ok) account = await res.json();
      } catch {
        account = null;
      }
      if (cancel) return;
      let draft: ChatSettings | null = null;
      try {
        const raw = sessionStorage.getItem("st_chat_draft");
        sessionStorage.removeItem("st_chat_draft");
        if (raw) draft = sanitizeSettings(JSON.parse(raw));
      } catch {
        draft = null;
      }
      if (account?.signedIn) {
        if (account.config) {
          setSettings(account.config.settings);
          setOverlayKey(account.config.overlayKey);
        } else {
          const seed = draft ?? decodeSettings(window.location.search);
          setSettings(seed);
          const saved = await fetch("/api/chat/config", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ settings: seed }),
          });
          if (saved.ok) {
            const body = (await saved.json()) as { overlayKey?: string };
            if (body.overlayKey) setOverlayKey(body.overlayKey);
          }
        }
        setMode("saved");
        window.history.replaceState(null, "", "/chat");
      } else {
        setSettings(decodeSettings(window.location.search));
        setMode("url");
      }
      setReady(true);
    })();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || mode !== "url") return;
    const query = encodeSettings(settings);
    const url = query ? `/chat?${query}` : "/chat";
    window.history.replaceState(null, "", url);
  }, [ready, mode, settings]);

  useEffect(() => {
    if (!ready || mode !== "saved") return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      fetch("/api/chat/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      })
        .then((res) => setSaveNote(res.ok ? "" : "Couldn’t save."))
        .catch(() => setSaveNote("Couldn’t save."));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [ready, mode, settings]);

  useEffect(() => {
    if (!live) {
      setLiveMessages([]);
      setKickStatus("idle");
      return;
    }
    let active = true;
    const stops: Array<() => void> = [];
    const push = (message: ChatMessage) => {
      setLiveMessages((current) => [...current.slice(-80), message]);
    };
    const get = () => settingsRef.current;
    // Wait for typing to settle so each keystroke doesn't open a connection.
    const timer = window.setTimeout(() => {
      setKickStatus("idle");
      if (settings.twitch) stops.push(connectTwitch(settings.twitch, get, push));
      if (settings.kick) {
        resolveKickChannel(settings.kick).then((channel) => {
          if (!active) return;
          if (!channel) {
            setKickStatus("err");
            return;
          }
          setKickStatus("ok");
          stops.push(connectKick(channel, get, push));
        });
      }
    }, 500);
    return () => {
      active = false;
      window.clearTimeout(timer);
      stops.forEach((stop) => stop());
    };
  }, [live, settings.twitch, settings.kick]);

  const samples = useMemo(
    () => sampleMessages(settings.twitch, settings.kick),
    [settings.twitch, settings.kick],
  );
  const source = live ? liveMessages : samples;
  const visible = useVisibleMessages(source, settings);
  const overlayUrl = useMemo(() => {
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    if (mode === "saved" && overlayKey) return `${origin}/chat/overlay?k=${overlayKey}`;
    const query = encodeSettings(settings);
    return `${origin}/chat/overlay${query ? `?${query}` : ""}`;
  }, [mode, overlayKey, settings]);

  function signIn(platform: "twitch" | "kick") {
    sessionStorage.setItem("st_chat_draft", JSON.stringify(settings));
    window.location.href = `/api/auth/${platform}?return=/chat`;
  }

  async function rotate() {
    const res = await fetch("/api/chat/rotate", { method: "POST" });
    if (!res.ok) return;
    const body = (await res.json()) as { overlayKey?: string };
    if (body.overlayKey) setOverlayKey(body.overlayKey);
  }

  function patch<K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(overlayUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt("Copy this URL into OBS", overlayUrl);
    }
  }

  return (
    <div className="chat-builder">
      <div className="chat-preview-col">
        <div className="chat-stage">
          <ChatFeed
            messages={visible}
            settings={settings}
            empty={
              live
                ? "Waiting for chat. Go live or type in the channel."
                : "No sample lines match these filters."
            }
          />
        </div>
        <label className="chat-live">
          <input
            type="checkbox"
            checked={live}
            onChange={(e) => setLive(e.target.checked)}
          />
          Use live chat in preview
        </label>
        {live && kickStatus === "err" ? (
          <p className="hint">Couldn’t reach that Kick channel. Check the name.</p>
        ) : null}
      </div>

      <form
        className="chat-controls"
        onSubmit={(e) => {
          e.preventDefault();
          copy();
        }}
      >
        {mode === "url" ? (
          <section>
            <h3>Save this look</h3>
            <p className="hint">
              Sign in and the OBS link stays the same when you change the look.
            </p>
            <div className="actions">
              <a className="btn" href="/api/auth/twitch?return=/chat" onClick={(e) => { e.preventDefault(); signIn("twitch"); }}>
                Twitch
              </a>
              <a className="btn btn-ghost" href="/api/auth/kick?return=/chat" onClick={(e) => { e.preventDefault(); signIn("kick"); }}>
                Kick
              </a>
            </div>
          </section>
        ) : (
          <p className="hint">Saved on this account. The OBS link does not change with the look.</p>
        )}

        <section>
          <h3>Channels</h3>
          <label>
            Twitch
            <input
              type="text"
              value={settings.twitch}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="username"
              onChange={(e) => patch("twitch", e.target.value.trim())}
            />
          </label>
          <label>
            Kick
            <input
              type="text"
              value={settings.kick}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="username"
              onChange={(e) => patch("kick", e.target.value.trim())}
            />
          </label>
          <Toggle
            label="Platform marks"
            checked={settings.showPlatform}
            onChange={(v) => patch("showPlatform", v)}
          />
        </section>

        <section>
          <h3>Look</h3>
          <div className="chat-presets">
            {(Object.keys(presets) as PresetId[]).map((id) => (
              <button
                key={id}
                type="button"
                className="chat-chip"
                onClick={() => setSettings((current) => applyPreset(current, id))}
              >
                {presets[id].label}
              </button>
            ))}
          </div>
          <label>
            Font
            <select
              value={settings.font}
              onChange={(e) =>
                patch("font", e.target.value as ChatSettings["font"])
              }
            >
              {fonts.map((font) => (
                <option key={font.id} value={font.id}>
                  {font.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Size
            <input
              type="range"
              min={12}
              max={32}
              value={settings.size}
              onChange={(e) => patch("size", Number(e.target.value))}
            />
          </label>
          <div className="chat-row">
            <label>
              Names
              <select
                value={settings.nameColorMode}
                onChange={(e) =>
                  patch(
                    "nameColorMode",
                    e.target.value as ChatSettings["nameColorMode"],
                  )
                }
              >
                <option value="platform">Chatter color</option>
                <option value="custom">One color</option>
              </select>
            </label>
            <label>
              Name color
              <input
                type="color"
                value={settings.nameColor}
                disabled={settings.nameColorMode !== "custom"}
                onChange={(e) => patch("nameColor", e.target.value)}
              />
            </label>
          </div>
          <label>
            Message color
            <input
              type="color"
              value={settings.messageColor}
              onChange={(e) => patch("messageColor", e.target.value)}
            />
          </label>
          <label>
            Stroke
            <input
              type="range"
              min={0}
              max={4}
              value={settings.stroke}
              onChange={(e) => patch("stroke", Number(e.target.value))}
            />
          </label>
          <label>
            Shadow
            <input
              type="range"
              min={0}
              max={3}
              value={settings.shadow}
              onChange={(e) => patch("shadow", Number(e.target.value))}
            />
          </label>
        </section>

        <section>
          <h3>Layout</h3>
          <div className="chat-row">
            <label>
              Align
              <select
                value={settings.align}
                onChange={(e) =>
                  patch("align", e.target.value as ChatSettings["align"])
                }
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </label>
            <label>
              Names
              <select
                value={settings.nameLine}
                onChange={(e) =>
                  patch("nameLine", e.target.value as ChatSettings["nameLine"])
                }
              >
                <option value="inline">Inline</option>
                <option value="stack">Own line</option>
              </select>
            </label>
          </div>
          <label>
            Gap
            <input
              type="range"
              min={0}
              max={20}
              value={settings.gap}
              onChange={(e) => patch("gap", Number(e.target.value))}
            />
          </label>
          <label>
            Corners
            <input
              type="range"
              min={0}
              max={18}
              value={settings.radius}
              onChange={(e) => patch("radius", Number(e.target.value))}
            />
          </label>
          <label>
            Message fill
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.msgBgAlpha}
              onChange={(e) => patch("msgBgAlpha", Number(e.target.value))}
            />
          </label>
          <label>
            Panel fill
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.panelBgAlpha}
              onChange={(e) => patch("panelBgAlpha", Number(e.target.value))}
            />
          </label>
        </section>

        <section>
          <h3>Badges and emotes</h3>
          <Toggle
            label="Badges"
            checked={settings.showBadges}
            onChange={(v) => patch("showBadges", v)}
          />
          <Toggle
            label="Emotes"
            checked={settings.showEmotes}
            onChange={(v) => patch("showEmotes", v)}
          />
          <Toggle
            label="Animated emotes"
            checked={settings.animatedEmotes}
            onChange={(v) => patch("animatedEmotes", v)}
          />
          <label>
            Emote size
            <input
              type="range"
              min={0.8}
              max={2.2}
              step={0.1}
              value={settings.emoteScale}
              onChange={(e) => patch("emoteScale", Number(e.target.value))}
            />
          </label>
        </section>

        <section>
          <h3>Behavior</h3>
          <Toggle
            label="Animate new messages"
            checked={settings.animate}
            onChange={(v) => patch("animate", v)}
          />
          <Toggle
            label="Hide bots"
            checked={settings.hideBots}
            onChange={(v) => patch("hideBots", v)}
          />
          <Toggle
            label="Hide !commands"
            checked={settings.hideCommands}
            onChange={(v) => patch("hideCommands", v)}
          />
          <Toggle
            label="Highlight @mentions"
            checked={settings.highlightMentions}
            onChange={(v) => patch("highlightMentions", v)}
          />
          <Toggle
            label="Hide usernames"
            checked={settings.hideNames}
            onChange={(v) => patch("hideNames", v)}
          />
          <label>
            Fade after (sec, 0 = keep)
            <input
              type="range"
              min={0}
              max={60}
              value={settings.fadeSec}
              onChange={(e) => patch("fadeSec", Number(e.target.value))}
            />
          </label>
          <label>
            Max messages
            <input
              type="range"
              min={4}
              max={24}
              value={settings.maxMessages}
              onChange={(e) => patch("maxMessages", Number(e.target.value))}
            />
          </label>
          <label>
            Ignore list
            <input
              type="text"
              value={settings.ignore}
              placeholder="bot1, bot2"
              onChange={(e) => patch("ignore", e.target.value)}
            />
          </label>
        </section>

        <div className="actions">
          <button className="btn" type="submit">
            {copied ? "Copied" : "Copy OBS URL"}
          </button>
          {mode === "saved" ? (
            <button className="btn btn-ghost" type="button" onClick={rotate}>
              New link
            </button>
          ) : null}
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() =>
              setSettings((current) => ({
                ...defaultSettings,
                twitch: current.twitch,
                kick: current.kick,
              }))
            }
          >
            Reset look
          </button>
        </div>
        <p className="hint">
          {saveNote
            ? saveNote
            : mode === "saved"
              ? "OBS → Sources → Browser. Size 400×700. This link stays put. Refresh the source cache if a change does not show. Don’t paste the URL in chat."
              : "OBS → Sources → Browser. Size 400×700. After you recopy, right-click the source and refresh cache. Don’t paste the URL in chat."}
        </p>
      </form>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="chat-toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
