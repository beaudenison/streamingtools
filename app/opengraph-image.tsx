import { ImageResponse } from "next/og";

export const alt =
  "Streaming Tools — Twitch and Kick chat for OBS, and vertical clips from landscape recordings.";
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
          flexDirection: "column",
          justifyContent: "center",
          padding: 88,
          background: "#000000",
          color: "#f8f8f8",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              background: "#11ad32",
              borderRadius: 7,
            }}
          />
          <div
            style={{
              fontSize: 72,
              fontWeight: 600,
              letterSpacing: -2.5,
            }}
          >
            Streaming Tools
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 22,
            marginLeft: 50,
            fontSize: 32,
            color: "#a4a4a4",
            lineHeight: 1.35,
          }}
        >
          <div>Twitch and Kick chat for OBS.</div>
          <div>Vertical clips from landscape recordings.</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
