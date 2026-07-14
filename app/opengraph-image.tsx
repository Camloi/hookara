import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Hookara — AI-powered crochet pattern generator";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 30%, #f5d0fe 60%, #e9d5ff 100%)",
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <span
            style={{
              fontSize: "72px",
              fontWeight: "bold",
              color: "#1a1a2e",
              letterSpacing: "-2px",
              fontFamily: "sans-serif",
            }}
          >
            Hookara
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              fontSize: "28px",
              color: "#6b21a8",
              fontWeight: "600",
              fontFamily: "sans-serif",
            }}
          >
            YouTube 🧶 → ✍️
          </div>
        </div>

        <div
          style={{
            fontSize: "36px",
            color: "#374151",
            textAlign: "center",
            maxWidth: "900px",
            lineHeight: "1.3",
            fontFamily: "sans-serif",
          }}
        >
          Transform any YouTube crochet tutorial
          <br />
          into a structured written pattern
        </div>

        <div
          style={{
            marginTop: "40px",
            fontSize: "22px",
            color: "#9333ea",
            fontWeight: "500",
            fontFamily: "sans-serif",
          }}
        >
          hookara.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
