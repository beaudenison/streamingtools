import { fontCss, type FontId } from "@/lib/chat/settings";

export default function AlertCard({
  line,
  font,
  size,
  color,
  accent,
}: {
  line: string;
  font: FontId;
  size: number;
  color: string;
  accent: string;
}) {
  return (
    <div
      className="alert-card"
      style={{ fontFamily: fontCss(font), fontSize: size, color }}
    >
      <i style={{ background: accent }} />
      <p>{line}</p>
    </div>
  );
}
