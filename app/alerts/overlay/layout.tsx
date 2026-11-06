import type { Metadata } from "next";
import { Comic_Neue, Inter, Press_Start_2P, Roboto } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
});
const comic = Comic_Neue({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-comic",
});
const pixel = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "Alerts",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function AlertsOverlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`alert-overlay-root ${inter.variable} ${roboto.variable} ${comic.variable} ${pixel.variable}`}
    >
      {children}
    </div>
  );
}
