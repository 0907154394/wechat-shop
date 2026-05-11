import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "linear-gradient(145deg,#09d669,#07c160)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* WeChat double-bubble SVG */}
        <svg width="22" height="20" viewBox="0 0 64 54" fill="white">
          <ellipse cx="22" cy="20" rx="19" ry="14" />
          <polygon points="8,34 3,44 18,34" />
          <ellipse cx="44" cy="32" rx="16" ry="11" fillOpacity="0.85" />
          <polygon points="55,43 60,52 48,43" fillOpacity="0.85" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
