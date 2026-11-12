"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AlertCard from "@/components/alerts/AlertCard";
import { tone } from "@/lib/alerts/tone";
import {
  defaultAlertSettings,
  sanitizeAlertSettings,
  type AlertSettings,
} from "@/lib/alerts/settings";
import { fonts } from "@/lib/chat/settings";
import { alertLine, alertTypes, type AlertType } from "@/lib/events/types";

const labels: Record<AlertType, string> = {
  follow: "Follows",
  sub: "New subs",
  resub: "Resubs",
  gift: "Gifted subs",
  raid: "Raids",
  cheer: "Cheers",
  kicks: "KICKs",
};

type Account = {
  signedIn: boolean;
  twitch: { displayName: string; needsReauth: boolean; lastError: string | null } | null;
  kick: { displayName: string; needsReauth: boolean; lastError: string | null } | null;
  config: { overlayKey: string; settings: AlertSettings } | null;
};

export default function AlertsCustomizer() {
  const [account, setAccount] = useState<Account | null>(null);
  const [settings, setSettings] = useState<AlertSettings>(defaultAlertSettings);
  const [overlayKey, setOverlayKey] = useState("");
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState("Cool_User followed");
  const [note, setNote] = useState("");
  const skipSave = useRef(true);

  useEffect(() => {
    let cancel = false;
    fetch("/api/alerts/config")
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as Account;
      })
      .then((data) => {
        if (cancel) return;
        if (data?.config) {
          setAccount(data);
          setSettings(sanitizeAlertSettings(data.config.settings));
          setOverlayKey(data.config.overlayKey);
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancel) setReady(true);
      });
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !account?.signedIn) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      fetch("/api/alerts/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      })
        .then((res) => setNote(res.ok ? "" : "Couldn’t save."))
        .catch(() => setNote("Couldn’t save."));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [account?.signedIn, ready, settings]);

  const overlayUrl = useMemo(() => {
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    return overlayKey ? `${origin}/alerts/overlay?k=${overlayKey}` : "";
  }, [overlayKey]);

  async function copy() {
    if (!overlayUrl) return;
    try {
      await navigator.clipboard.writeText(overlayUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt("Copy this URL into OBS", overlayUrl);
    }
  }

  async function rotate() {
    const res = await fetch("/api/alerts/rotate", { method: "POST" });
    if (!res.ok) return;
    const body = (await res.json()) as { overlayKey?: string };
    if (body.overlayKey) setOverlayKey(body.overlayKey);
  }

  async function test(type: AlertType) {
    const res = await fetch("/api/alerts/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    if (!res.ok) return;
    const body = (await res.json()) as { line?: string };
    if (body.line) {
      setPreview(body.line);
      if (settings.sound) tone();
    }
  }

  if (!ready) return null;

  if (!account?.signedIn) {
    return (
      <div className="account-block">
        <p className="lede">
          Sign in with Twitch, Kick, or both. Alerts use the official events for that
          channel. Chat can keep a saved look on the same sign-in.
        </p>
        <div className="actions">
          <a className="btn" href="/api/auth/twitch?return=/alerts">
            Sign in with Twitch
          </a>
          <a className="btn btn-ghost" href="/api/auth/kick?return=/alerts">
            Sign in with Kick
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-builder">
      <div className="chat-preview-col">
        <div className="alert-stage">
          <AlertCard
            line={preview}
            font={settings.font}
            size={Math.min(settings.size, 36)}
            color={settings.color}
            accent={settings.accent}
          />
        </div>
        <div className="actions">
          {alertTypes.map((type) => (
            <button key={type} className="btn btn-ghost" type="button" onClick={() => test(type)}>
              Test {labels[type].toLowerCase()}
            </button>
          ))}
        </div>
      </div>
      <form
        className="chat-controls"
        onSubmit={(event) => {
          event.preventDefault();
          copy();
        }}
      >
        <section>
          <h3>Channels</h3>
          <p className="hint">
            {account.twitch ? `Twitch ${account.twitch.displayName}` : "Twitch is not connected."}
            {account.twitch?.needsReauth ? " Connect it again." : ""}
          </p>
          <p className="hint">
            {account.kick ? `Kick ${account.kick.displayName}` : "Kick is not connected."}
            {account.kick?.needsReauth ? " Connect it again." : ""}
          </p>
          {account.twitch?.lastError ? <p className="hint">{account.twitch.lastError}</p> : null}
          {account.kick?.lastError ? <p className="hint">{account.kick.lastError}</p> : null}
          <div className="actions">
            {!account.twitch || account.twitch.needsReauth ? (
              <a className="btn" href="/api/auth/twitch?return=/alerts">
                Connect Twitch
              </a>
            ) : null}
            {!account.kick || account.kick.needsReauth ? (
              <a className="btn btn-ghost" href="/api/auth/kick?return=/alerts">
                Connect Kick
              </a>
            ) : null}
          </div>
        </section>
        <section>
          <h3>Alerts</h3>
          {alertTypes.map((type) => (
            <label className="chat-toggle" key={type}>
              <input
                type="checkbox"
                checked={settings.enabled[type]}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    enabled: { ...current.enabled, [type]: event.target.checked },
                  }))
                }
              />
              {labels[type]}
            </label>
          ))}
        </section>
        <section>
          <h3>Look</h3>
          <label>
            Font
            <select
              value={settings.font}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  font: event.target.value as AlertSettings["font"],
                }))
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
              min={24}
              max={72}
              value={settings.size}
              onChange={(event) =>
                setSettings((current) => ({ ...current, size: Number(event.target.value) }))
              }
            />
          </label>
          <label>
            Text
            <input
              type="color"
              value={settings.color}
              onChange={(event) =>
                setSettings((current) => ({ ...current, color: event.target.value }))
              }
            />
          </label>
          <label>
            Mark
            <input
              type="color"
              value={settings.accent}
              onChange={(event) =>
                setSettings((current) => ({ ...current, accent: event.target.value }))
              }
            />
          </label>
          <label className="chat-toggle">
            <input
              type="checkbox"
              checked={settings.sound}
              onChange={(event) =>
                setSettings((current) => ({ ...current, sound: event.target.checked }))
              }
            />
            Tone
          </label>
        </section>
        <div className="actions">
          <button className="btn" type="submit">
            {copied ? "Copied" : "Copy OBS URL"}
          </button>
          <button className="btn btn-ghost" type="button" onClick={rotate}>
            New link
          </button>
        </div>
        <p className="hint">
          {note ||
            "OBS → Sources → Browser. Size 1920×1080. Turn on Control audio via OBS. This link stays put when you change the look."}
        </p>
        <p className="hint">{alertLine({ type: "follow", name: "Cool_User", amount: null })} is the shape of a card. Tips are not included.</p>
      </form>
    </div>
  );
}
