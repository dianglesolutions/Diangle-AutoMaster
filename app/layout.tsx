import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: { default: "AutoMaster — Find your next car", template: "%s | AutoMaster" },
  description: "Thoughtfully selected cars, exceptional service. Explore the AutoMaster collection.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Header />{children}<footer className="footer"><div className="container footer-inner"><a className="brand" href="/">AUTO<span>MASTER</span></a><span>Considered cars. Confident journeys.</span><span>© {new Date().getFullYear()} AutoMaster</span></div></footer></body></html>;
}
