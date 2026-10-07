import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nile AI Signal — AI intelligence without the noise",
  description:
    "A live AI intelligence feed that tracks important releases, research and business moves, then explains what matters.",
  metadataBase: new URL("https://signal.nileai.solutions"),
  openGraph: {
    title: "Nile AI Signal",
    description: "Know what changed in AI before it affects your work.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
