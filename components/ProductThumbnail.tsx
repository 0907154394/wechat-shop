"use client";

const DURATIONS: Record<string, string> = {
  "1-thang": "1 Tháng",
  "3-thang": "3 Tháng",
  "6-thang": "6 Tháng",
  "1-nam":   "1 Năm",
};

type AppKey = "wechat" | "qq" | "douyin" | "weibo" | "xiaohongshu" | "kuaishou";

const APP_CONFIG: Record<AppKey, { label: string; bg: string; glow: string; localIcon?: string; cdnIcon?: string }> = {
  wechat:      { label: "WeChat",      bg: "linear-gradient(145deg,#051c10 0%,#0a3520 100%)", glow: "#07c160", cdnIcon: "https://cdn.simpleicons.org/wechat/white" },
  qq:          { label: "QQ",          bg: "linear-gradient(145deg,#012f6b 0%,#0052b4 100%)", glow: "#1b74e4", localIcon: "/icons/qq.png" },
  douyin:      { label: "Douyin",      bg: "linear-gradient(145deg,#000000 0%,#1a0a0a 100%)", glow: "#fe2c55", localIcon: "/icons/tiktok.png" },
  weibo:       { label: "Weibo",       bg: "linear-gradient(145deg,#6b0010 0%,#b0001e 100%)", glow: "#e6162d", localIcon: "/icons/weibo.png" },
  xiaohongshu: { label: "Xiaohongshu", bg: "linear-gradient(145deg,#6b0010 0%,#cc0022 100%)", glow: "#ff2442", cdnIcon: "https://cdn.simpleicons.org/xiaohongshu/white" },
  kuaishou:    { label: "Kuaishou",    bg: "linear-gradient(145deg,#6b2800 0%,#cc5200 100%)", glow: "#ff6600", cdnIcon: "https://cdn.simpleicons.org/kuaishou/white" },
};

function detectApp(name: string): AppKey {
  const n = name.toLowerCase().normalize("NFC");
  if (/\bqq\b/.test(n)) return "qq";
  if (/douyin|抖音/.test(n)) return "douyin";
  if (/weibo|微博/.test(n)) return "weibo";
  if (/xiaohongshu|小红书|xhs/.test(n)) return "xiaohongshu";
  if (/kuaishou|快手/.test(n)) return "kuaishou";
  return "wechat";
}

function detectDuration(name: string): string {
  const n = name.toLowerCase()
    .normalize("NFC")
    .replace(/tháng/g, "thang")
    .replace(/năm/g, "nam")
    .replace(/\s+/g, " ")
    .trim();
  const words = n.split(" ");
  for (let i = 0; i + 1 < words.length; i++) {
    if (words[i + 1] === "thang") {
      const num = parseInt(words[i], 10);
      if (num === 1) return DURATIONS["1-thang"];
      if (num === 3) return DURATIONS["3-thang"];
      if (num === 6) return DURATIONS["6-thang"];
    }
    if (words[i] === "1" && words[i + 1] === "nam") return DURATIONS["1-nam"];
  }
  return "";
}

function WeChatSVG({ glow }: { glow: string }) {
  return (
    <svg viewBox="0 0 100 100" style={{ width: "52%", maxWidth: 120, overflow: "visible", filter: `drop-shadow(0 0 14px ${glow}88) drop-shadow(0 6px 10px rgba(0,0,0,0.6))` }}>
      <rect x="0" y="0" width="100" height="100" rx="22" ry="22" fill="#4caf2e" />
      <rect x="0" y="0" width="100" height="100" rx="22" ry="22" fill="url(#wcGrad)" />
      <defs>
        <linearGradient id="wcGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5ecb35" />
          <stop offset="100%" stopColor="#3da820" />
        </linearGradient>
      </defs>
      <ellipse cx="38" cy="36" rx="24" ry="19" fill="white" />
      <polygon points="24,52 16,62 36,52" fill="white" />
      <circle cx="31" cy="35" r="3" fill="#3da820" />
      <circle cx="44" cy="35" r="3" fill="#3da820" />
      <ellipse cx="63" cy="54" rx="20" ry="16" fill="white" fillOpacity="0.95" />
      <polygon points="72,67 80,76 60,67" fill="white" fillOpacity="0.95" />
      <circle cx="57" cy="53" r="2.5" fill="#3da820" />
      <circle cx="68" cy="53" r="2.5" fill="#3da820" />
    </svg>
  );
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

  const app = detectApp(name);
  const { label, bg, glow, localIcon, cdnIcon } = APP_CONFIG[app];
  const duration = detectDuration(name);
  const iconSrc = localIcon ?? cdnIcon;

  return (
    <div
      className={`relative flex flex-col overflow-hidden ${className}`}
      style={{ background: bg }}
    >
      <div
        className="absolute"
        style={{
          top: "50%", left: "50%",
          transform: "translate(-50%, -60%)",
          width: "80%", paddingBottom: "80%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${glow}30 0%, ${glow}10 40%, transparent 70%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: "18px 18px",
        }}
      />

      <div className="relative z-10 flex flex-1 items-center justify-center" aria-hidden>
        {app === "wechat" ? (
          <WeChatSVG glow={glow} />
        ) : (
          <img
            src={iconSrc}
            alt={label}
            style={{
              width: "48%", maxWidth: 110,
              filter: `drop-shadow(0 0 14px ${glow}88) drop-shadow(0 6px 10px rgba(0,0,0,0.6))`,
            }}
          />
        )}
      </div>

      {!compact && (
        <div
          className="relative z-10 px-4 py-4 text-center"
          style={{ background: "rgba(0,0,0,0.55)", borderTop: `1px solid ${glow}40` }}
        >
          <p
            className="truncate font-black leading-none tracking-widest text-white uppercase"
            style={{ fontSize: 18, letterSpacing: "0.12em" }}
          >
            {label}{duration ? ` · ${duration}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
