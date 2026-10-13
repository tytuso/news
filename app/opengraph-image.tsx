import { ImageResponse } from "next/og";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column",
      justifyContent: "space-between", background: "#171b3a", color: "white", padding: 78,
      fontFamily: "Arial, sans-serif", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 35, fontWeight: 700 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 68, height: 68,
          borderRadius: 20, background: "#6758f5", color: "white", fontSize: 42, fontWeight: 900 }}>N</div>
        NileSignal
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 76, lineHeight: 1.04, letterSpacing: -3, fontWeight: 800 }}>Stay ahead of AI.</div>
        <div style={{ fontSize: 76, lineHeight: 1.04, letterSpacing: -3, fontWeight: 800, color: "#ada3ff" }}>Skip the noise.</div>
        <div style={{ color: "#c8cee9", fontSize: 25, marginTop: 20 }}>AI news made simple · Powered by Nile AI Solutions</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 23, color: "#a9b3d2" }}>
        <span>signal.nileai.solutions</span><span>Global + Africa</span>
      </div>
    </div>, size
  );
}
