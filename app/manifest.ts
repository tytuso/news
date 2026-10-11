import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "NileSignal — AI News Made Simple",
    short_name: "NileSignal",
    description: "Know what changed in AI and why it matters.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8f9fc",
    theme_color: "#4f46e5",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
    ]
  };
}
