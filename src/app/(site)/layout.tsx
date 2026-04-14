import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { DevBanner } from "@/components/dev-banner";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <DevBanner />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}