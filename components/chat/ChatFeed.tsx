"use client";

import { fontCss, type ChatSettings } from "@/lib/chat/settings";
import type { ChatMessage } from "@/lib/chat/types";

function strokeShadow(stroke: number, shadow: number) {
  const layers: string[] = [];
  if (stroke > 0) {
    const s = 0.45 + stroke * 0.45;
    layers.push(
      `${s}px 0 #000`,
      `-${s}px 0 #000`,
      `0 ${s}px #000`,
      `0 -${s}px #000`,
      `${s}px ${s}px #000`,
      `-${s}px ${s}px #000`,
      `${s}px -${s}px #000`,
      `-${s}px -${s}px #000`,
    );
  }
  if (shadow > 0) {
    const blur = shadow * 3.2;
    layers.push(`0 0 ${blur}px rgba(0,0,0,0.9)`, `0 ${shadow}px ${blur}px #000`);
  }
  return layers.join(", ") || "none";
}

function hexAlpha(color: string, alpha: number) {
  const hex = color.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16) || 0;
  const g = parseInt(hex.slice(2, 4), 16) || 0;
  const b = parseInt(hex.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function PlatformMark({ platform }: { platform: "twitch" | "kick" }) {
  if (platform === "kick") {
    return (
      <svg className="chat-platform" viewBox="0 0 16 16" aria-hidden>
        <path
          fill="#53fc18"
          d="M2 2h6v4h2V4h2V2h2v4h-2v2h2v2h-2v2h2v4h-2v-2H10v-2H8v4H2V2zm4 10V6H4v6h2z"
        />
      </svg>
    );
  }
  return (
    <svg className="chat-platform" viewBox="0 0 16 16" aria-hidden>
      <path
        fill="#bf94ff"
        d="M3 1 1 4v9h3v2h2l2-2h3l4-4V1H3zm11 7-2 2H8L6 12v-2H4V3h10v5zM11 5H9.5v3.5H11V5zm-4 0H5.5v3.5H7V5z"
      />
    </svg>
  );
}

export default function ChatFeed({
  messages,
  settings,
  empty,
}: {
  messages: ChatMessage[];
  settings: ChatSettings;
  empty?: string;
}) {
  const panel = settings.panelBgAlpha > 0;
  const emotePx = Math.round(settings.size * settings.emoteScale);

  return (
    <div
      className={`chat-feed chat-feed-${settings.align}${panel ? " is-panel" : ""}`}
      style={{
        fontFamily: fontCss(settings.font),
        fontSize: `${settings.size}px`,
        color: settings.messageColor,
        gap: `${settings.gap}px`,
        textShadow: strokeShadow(settings.stroke, settings.shadow),
        background: panel
          ? hexAlpha(settings.panelBg, settings.panelBgAlpha)
          : "transparent",
        borderRadius: panel ? `${settings.radius}px` : 0,
        padding: panel ? "12px 14px" : 0,
        ["--chat-radius" as string]: `${settings.radius}px`,
        ["--chat-msg-bg" as string]: hexAlpha(settings.msgBg, settings.msgBgAlpha),
      }}
    >
      {messages.length === 0 ? (
        <p className="chat-empty">{empty ?? "Waiting for chat."}</p>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`chat-line${settings.animate ? " is-in" : ""}${
              message.mentioned && settings.highlightMentions ? " is-mention" : ""
            }${settings.msgBgAlpha > 0 ? " has-bg" : ""}`}
          >
            {settings.showPlatform ? (
              <PlatformMark platform={message.platform} />
            ) : null}
            {settings.showBadges
              ? message.badges.map((badge) => (
                  <img
                    key={badge.id}
                    className="chat-badge"
                    src={badge.url}
                    alt=""
                    title={badge.title}
                    width={18}
                    height={18}
                  />
                ))
              : null}
            {settings.hideNames ? null : (
              <span
                className={`chat-name${settings.nameLine === "stack" ? " is-stack" : ""}`}
                style={{
                  color:
                    settings.nameColorMode === "custom"
                      ? settings.nameColor
                      : message.color || settings.nameColor,
                }}
              >
                {message.user}
                {settings.nameLine === "inline" ? ":" : ""}
              </span>
            )}
            {!settings.hideNames && settings.nameLine === "stack" ? <br /> : null}
            <span className="chat-text">
              {message.fragments.map((fragment, i) => {
                if (fragment.type === "text" || !settings.showEmotes) {
                  return (
                    <span key={i}>
                      {fragment.type === "emote" ? fragment.name : fragment.text}
                    </span>
                  );
                }
                const src =
                  !settings.animatedEmotes && fragment.urlStatic
                    ? fragment.urlStatic
                    : fragment.url;
                return (
                  <img
                    key={i}
                    className="chat-emote"
                    src={src}
                    alt={fragment.name}
                    title={fragment.name}
                    style={{ height: emotePx, width: "auto" }}
                  />
                );
              })}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
