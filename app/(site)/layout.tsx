import Atmosphere from "@/components/Atmosphere";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Atmosphere />
      <div className="site">
        <Header />
        {children}
        <Footer />
      </div>
      <Analytics />
    </>
  );
}
