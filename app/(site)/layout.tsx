import Atmosphere from "@/components/Atmosphere";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
    </>
  );
}
