import type { Metadata } from "next";
import Link from "next/link";
import Atmosphere from "@/components/Atmosphere";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <Atmosphere />
      <div className="site">
        <Header />
        <main className="main">
          <div className="home-intro">
            <h1>Page not found</h1>
            <p className="lede">That page is not on Streaming Tools.</p>
          </div>
          <p className="hint">
            <Link href="/">Tools</Link>
            {" · "}
            <Link href="/portrait-clip">Portrait Clip</Link>
            {" · "}
            <Link href="/chat">Chat Overlay</Link>
            {" · "}
            <Link href="/alerts">Alerts</Link>
          </p>
        </main>
        <Footer />
      </div>
    </>
  );
}
