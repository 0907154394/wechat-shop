"use client";

const BG   = "linear-gradient(145deg,#051c10 0%,#0a3520 100%)";
const GLOW = "#07c160";

const DURATIONS: Record<string, string> = {
  "1-thang": "1 Tháng",
  "3-thang": "3 Tháng",
  "6-thang": "6 Tháng",
  "1-nam":   "1 Năm",
};

function detectDuration(name: string): string {
  // Strip all diacritics to bypass NFC/NFD encoding ambiguity
  const n = name.toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const monthMatch = n.match(/(?:^| )(\d+) *thang(?= |$)/);
  if (monthMatch) {
    const num = parseInt(monthMatch[1], 10);
    if (num === 6) return DURATIONS["6-thang"];
    if (num === 3) return DURATIONS["3-thang"];
    if (num === 1) return DURATIONS["1-thang"];
  }
  if (/(?:^| )1 *nam(?= |$)/.test(n)) return DURATIONS["1-nam"];
  return "";
}

interface ProductThumbnailProps {
  name: string;
  imageUrl?: string | null;
  className?: string;
  compact?: boolean;
}

export function ProductThumbnail({ name, imageUrl, className = "", compact = false }: ProductThumbnailProps) {
  if (imageUrl) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
      </div>
    );
  }

  const duration = detectDuration(name);

  return (
    <div
      className={`relative flex flex-col overflow-hidden ${className}`}
      style={{ background: BG }}
    >
      {/* Glow orb behind icon */}
      <div
        className="absolute"
        style={{
          top: "50%", left: "50%",
          transform: "translate(-50%, -60%)",
          width: "80%", paddingBottom: "80%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${GLOW}30 0%, ${GLOW}10 40%, transparent 70%)`,
        }}
      />

      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: "18px 18px",
        }}
      />

      {/* WeChat icon — accurate app icon style */}
      <div className="wc-icon-float relative z-10 flex flex-1 items-center justify-center" aria-hidden>
        <svg
          viewBox="0 0 100 100"
          style={{
            width: "52%", maxWidth: 120, overflow: "visible",
            filter: `drop-shadow(0 0 14px ${GLOW}88) drop-shadow(0 6px 10px rgba(0,0,0,0.6))`,
          }}
        >
          {/* Green rounded square background */}
          <rect x="0" y="0" width="100" height="100" rx="22" ry="22" fill="#4caf2e" />
          <rect x="0" y="0" width="100" height="100" rx="22" ry="22"
            fill="url(#wcGrad)" />
          <defs>
            <linearGradient id="wcGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#5ecb35" />
              <stop offset="100%" stopColor="#3da820" />
            </linearGradient>
          </defs>

          {/* Back bubble (larger, top-left) */}
          <ellipse cx="38" cy="36" rx="24" ry="19" fill="white" />
          <polygon points="24,52 16,62 36,52" fill="white" />
          {/* Eyes on back bubble */}
          <circle cx="31" cy="35" r="3" fill="#3da820" />
          <circle cx="44" cy="35" r="3" fill="#3da820" />

          {/* Front bubble (smaller, bottom-right) */}
          <ellipse cx="63" cy="54" rx="20" ry="16" fill="white" fillOpacity="0.95" />
          <polygon points="72,67 80,76 60,67" fill="white" fillOpacity="0.95" />
          {/* Eyes on front bubble */}
          <circle cx="57" cy="53" r="2.5" fill="#3da820" />
          <circle cx="68" cy="53" r="2.5" fill="#3da820" />
        </svg>
      </div>

      {/* Bottom text — hidden in compact mode */}
      {!compact && (
        <div
          className="relative z-10 px-4 py-4 text-center"
          style={{ background: "rgba(0,0,0,0.55)", borderTop: `1px solid ${GLOW}40` }}
        >
          <p
            className="truncate font-black leading-none tracking-widest text-white uppercase"
            style={{ fontSize: 18, letterSpacing: "0.12em" }}
          >
            WeChat{duration ? ` · ${duration}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
