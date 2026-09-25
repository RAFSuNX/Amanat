import { ImageResponse } from "next/og"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        backgroundColor: "#0a0a0a",
        padding: "60px",
      }}
    >
      <div style={{ display: "flex" }}>
        <div style={{ width: "48px", height: "4px", backgroundColor: "#3d8c5e" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: "80px", fontWeight: 700, color: "#f0f0f0", lineHeight: 1, letterSpacing: "-3px" }}>
          Amanat
        </div>
        <div style={{ marginTop: "12px", fontSize: "28px", color: "#3d8c5e", fontWeight: 600 }}>
          The Hope for All of Us
        </div>
        <div style={{ marginTop: "20px", fontSize: "22px", color: "#888", lineHeight: 1.5 }}>
          A transparent welfare platform connecting donors with those in need across Bangladesh.
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "18px", color: "#555", fontWeight: 500 }}>Bangladesh Welfare Platform</div>
        <div style={{ fontSize: "18px", color: "#3d8c5e" }}>amanat.org</div>
      </div>
    </div>,
    { ...size },
  )
}
