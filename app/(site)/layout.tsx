import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

// Habillage du site public (marketing) : smooth scroll, curseur, nav, footer.
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grain">
      <Cursor />
      <SmoothScroll>
        <Nav />
        <main>{children}</main>
        <Footer />
      </SmoothScroll>
    </div>
  );
}
