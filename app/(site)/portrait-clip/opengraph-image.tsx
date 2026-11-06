import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt =
  "Portrait Clip — vertical clips from OBS and Streamlabs recordings.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const icon = await readFile(
    join(process.cwd(), "public/icons/portrait-clip.png"),
  );
  const iconSrc = `data:image/png;base64,${icon.toString("base64")}`;

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
        <img
          src={iconSrc}
          width={220}
          height={220}
          alt=""
          style={{ borderRadius: 28 }}
        />
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
            Portrait Clip
          </div>
          <div
            style={{
              marginTop: 16,
              fontSize: 28,
              color: "#a4a4a4",
              lineHeight: 1.35,
            }}
          >
            Vertical clips from OBS and Streamlabs recordings.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
