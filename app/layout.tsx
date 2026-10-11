import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NileSignal — Important AI news, made simple",
  description: "Stay ahead of AI without the noise. Real updates from trusted sources, clear context, African technology coverage, and links to original reporting.",
  metadataBase: new URL("https://signal.nileai.solutions"),
  applicationName: "NileSignal",
  appleWebApp: { capable: true, title: "NileSignal", statusBarStyle: "default" },
  openGraph: {
    title: "NileSignal — AI news without the noise",
    description: "Know what changed in AI and why it matters.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
