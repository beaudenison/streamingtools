import { ImageResponse } from "next/og";

export const alt =
  "Chat Overlay — Twitch and Kick chat for an OBS or Streamlabs browser source.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 56,
          padding: 80,
          background: "#000000",
          color: "#f8f8f8",
        }}
      >
        <div
          style={{
            width: 220,
            height: 220,
            borderRadius: 28,
            background: "#0a0a0a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 118,
              height: 86,
              borderRadius: 18,
              background: "#11ad32",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: 720,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 22,
              color: "#a4a4a4",
              letterSpacing: 0.4,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                background: "#11ad32",
                borderRadius: 3,
              }}
            />
            Streaming Tools
          </div>
          <div
            style={{
              marginTop: 14,
              fontSize: 64,
              fontWeight: 600,
              letterSpacing: -2,
            }}
          >
            Chat Overlay
          </div>
          <div
            style={{
              marginTop: 16,
              fontSize: 28,
              color: "#a4a4a4",
              lineHeight: 1.35,
            }}
          >
            Twitch and Kick chat for OBS and Streamlabs.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
