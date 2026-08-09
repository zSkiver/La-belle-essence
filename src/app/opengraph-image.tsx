import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";

export const alt = `${siteConfig.name} — perfumaria árabe em Rio Verde, GO`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Imagem de compartilhamento gerada a partir dos tokens da marca.
 * Substitua por uma arte oficial quando houver material fotográfico próprio.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(140deg, #FAF6F2 0%, #F7EBE6 48%, #F0DCD6 100%)",
          color: "#2E211E",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: 22,
              letterSpacing: 10,
              textTransform: "uppercase",
              color: "#8A6A2F",
            }}
          >
            La Belle Essence
          </span>
          <span style={{ marginTop: 8, fontSize: 16, letterSpacing: 6, color: "#5F4A44" }}>
            RIO VERDE · GOIÁS
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 62, lineHeight: 1.1, maxWidth: 900 }}>
            Fragrâncias que transformam presença em memória.
          </span>
          <span style={{ marginTop: 28, fontSize: 24, color: "#96574F" }}>
            Perfumaria árabe · Centro e Buriti Shopping
          </span>
        </div>

        <div style={{ display: "flex", height: 2, width: 180, background: "#C6A15B" }} />
      </div>
    ),
    size,
  );
}
