import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/config";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            backgroundColor: "#f97316",
            borderRadius: "16px",
            marginBottom: 24,
          }}
        >
          <span style={{ color: "white", fontSize: 64, fontWeight: 700 }}>M</span>
        </div>
        <div style={{ color: "white", fontSize: 48, fontWeight: 700 }}>{siteConfig.author}</div>
        <div style={{ color: "#a1a1aa", fontSize: 20, marginTop: 8 }}>{siteConfig.tag}</div>
      </div>
    ),
    { ...size }
  );
}