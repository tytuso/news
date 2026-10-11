import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#5145e8", borderRadius: 112 }}>
        <div style={{ fontSize: 315, fontWeight: 900, color: "white", letterSpacing: -26 }}>N</div>
        <div style={{ width: 23, height: 23, borderRadius: 12, background: "#bfffd1", position: "absolute", right: 99, top: 110 }} />
      </div>
    ),
    size
  );
}
