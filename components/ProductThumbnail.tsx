"use client";

const DURATIONS: Record<string, string> = {
  "1-thang": "1 Tháng",
  "3-thang": "3 Tháng",
  "6-thang": "6 Tháng",
  "1-nam":   "1 Năm",
};

type AppKey = "wechat" | "qq" | "douyin" | "weibo" | "xiaohongshu" | "kuaishou";

const APP_CONFIG: Record<AppKey, { label: string; bg: string; glow: string }> = {
  wechat:      { label: "WeChat",      bg: "linear-gradient(145deg,#051c10 0%,#0a3520 100%)", glow: "#07c160" },
  qq:          { label: "QQ",          bg: "linear-gradient(145deg,#012f6b 0%,#0052b4 100%)", glow: "#1b74e4" },
  douyin:      { label: "Douyin",      bg: "linear-gradient(145deg,#000000 0%,#1a0a0a 100%)", glow: "#fe2c55" },
  weibo:       { label: "Weibo",       bg: "linear-gradient(145deg,#6b0010 0%,#b0001e 100%)", glow: "#e6162d" },
  xiaohongshu: { label: "Xiaohongshu", bg: "linear-gradient(145deg,#6b0010 0%,#cc0022 100%)", glow: "#ff2442" },
  kuaishou:    { label: "Kuaishou",    bg: "linear-gradient(145deg,#6b2800 0%,#cc5200 100%)", glow: "#ff6600" },
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

function WeChatIcon({ glow }: { glow: string }) {
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

function QQIcon({ glow }: { glow: string }) {
  return (
    <svg viewBox="0 0 100 100" style={{ width: "52%", maxWidth: 120, overflow: "visible", filter: `drop-shadow(0 0 14px ${glow}88) drop-shadow(0 6px 10px rgba(0,0,0,0.6))` }}>
      <rect x="0" y="0" width="100" height="100" rx="22" ry="22" fill="url(#qqGrad)" />
      <defs>
        <linearGradient id="qqGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b8be9" />
          <stop offset="100%" stopColor="#1b74e4" />
        </linearGradient>
      </defs>
      {/* Body */}
      <ellipse cx="50" cy="55" rx="22" ry="26" fill="white" />
      {/* Head */}
      <ellipse cx="50" cy="34" rx="18" ry="17" fill="white" />
      {/* Eyes */}
      <ellipse cx="43" cy="31" rx="4" ry="5" fill="#1a1a2e" />
      <ellipse cx="57" cy="31" rx="4" ry="5" fill="#1a1a2e" />
      <circle cx="44" cy="29.5" r="1.5" fill="white" />
      <circle cx="58" cy="29.5" r="1.5" fill="white" />
      {/* Beak */}
      <ellipse cx="50" cy="39" rx="5" ry="3" fill="#f4a400" />
      {/* Belly */}
      <ellipse cx="50" cy="57" rx="13" ry="16" fill="#f5c842" />
      {/* Feet */}
      <ellipse cx="40" cy="80" rx="7" ry="3.5" fill="#f4a400" />
      <ellipse cx="60" cy="80" rx="7" ry="3.5" fill="#f4a400" />
    </svg>
  );
}

function DouyinIcon({ glow }: { glow: string }) {
  return (
    <svg viewBox="0 0 100 100" style={{ width: "52%", maxWidth: 120, overflow: "visible", filter: `drop-shadow(0 0 14px ${glow}88) drop-shadow(0 6px 10px rgba(0,0,0,0.6))` }}>
      <rect x="0" y="0" width="100" height="100" rx="22" ry="22" fill="#010101" />
      {/* Cyan shadow */}
      <text x="36" y="74" fontSize="62" fontWeight="900" fontFamily="Arial Black,sans-serif" fill="#25f4ee" opacity="0.9">d</text>
      {/* Red shadow */}
      <text x="40" y="70" fontSize="62" fontWeight="900" fontFamily="Arial Black,sans-serif" fill="#fe2c55" opacity="0.9">d</text>
      {/* White main */}
      <text x="38" y="72" fontSize="62" fontWeight="900" fontFamily="Arial Black,sans-serif" fill="white">d</text>
      {/* Note circle top */}
      <circle cx="71" cy="22" r="9" fill="#fe2c55" />
      <circle cx="75" cy="18" r="9" fill="#25f4ee" />
      <circle cx="73" cy="20" r="9" fill="white" />
    </svg>
  );
}

function WeiboIcon({ glow }: { glow: string }) {
  return (
    <svg viewBox="0 0 100 100" style={{ width: "52%", maxWidth: 120, overflow: "visible", filter: `drop-shadow(0 0 14px ${glow}88) drop-shadow(0 6px 10px rgba(0,0,0,0.6))` }}>
      <rect x="0" y="0" width="100" height="100" rx="22" ry="22" fill="url(#wbGrad)" />
      <defs>
        <linearGradient id="wbGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff4e50" />
          <stop offset="100%" stopColor="#e6162d" />
        </linearGradient>
      </defs>
      {/* Cloud/bubble body */}
      <ellipse cx="48" cy="60" rx="28" ry="22" fill="white" />
      <ellipse cx="34" cy="50" rx="14" ry="12" fill="white" />
      {/* Eyes */}
      <circle cx="42" cy="56" r="5" fill="#1a1a1a" />
      <circle cx="56" cy="54" r="6" fill="#1a1a1a" />
      <circle cx="43.5" cy="54.5" r="2" fill="white" />
      <circle cx="57.5" cy="52.5" r="2" fill="white" />
      {/* Smile */}
      <path d="M42 64 Q50 70 58 64" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Signal waves */}
      <path d="M68 28 Q78 20 82 28" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.9" />
      <path d="M63 33 Q76 22 82 34" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

function XiaohongshuIcon({ glow }: { glow: string }) {
  return (
    <svg viewBox="0 0 100 100" style={{ width: "52%", maxWidth: 120, overflow: "visible", filter: `drop-shadow(0 0 14px ${glow}88) drop-shadow(0 6px 10px rgba(0,0,0,0.6))` }}>
      <rect x="0" y="0" width="100" height="100" rx="22" ry="22" fill="url(#xhsGrad)" />
      <defs>
        <linearGradient id="xhsGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff6b7a" />
          <stop offset="100%" stopColor="#ff2442" />
        </linearGradient>
      </defs>
      {/* Book pages */}
      <rect x="22" y="25" width="56" height="52" rx="6" fill="white" />
      <rect x="22" y="25" width="28" height="52" rx="6" fill="white" />
      <rect x="48" y="25" width="30" height="52" rx="6" fill="#ffe0e4" />
      {/* Spine */}
      <rect x="46" y="25" width="6" height="52" fill="#ffb3be" />
      {/* Lines on left page */}
      <rect x="28" y="38" width="16" height="2.5" rx="1.25" fill="#ff2442" opacity="0.6" />
      <rect x="28" y="45" width="14" height="2.5" rx="1.25" fill="#ff2442" opacity="0.4" />
      <rect x="28" y="52" width="15" height="2.5" rx="1.25" fill="#ff2442" opacity="0.4" />
      <rect x="28" y="59" width="12" height="2.5" rx="1.25" fill="#ff2442" opacity="0.4" />
      {/* Star on right page */}
      <text x="56" y="62" fontSize="26" fill="#ff2442" textAnchor="middle">✦</text>
    </svg>
  );
}

function KuaishouIcon({ glow }: { glow: string }) {
  return (
    <svg viewBox="0 0 100 100" style={{ width: "52%", maxWidth: 120, overflow: "visible", filter: `drop-shadow(0 0 14px ${glow}88) drop-shadow(0 6px 10px rgba(0,0,0,0.6))` }}>
      <rect x="0" y="0" width="100" height="100" rx="22" ry="22" fill="url(#ksGrad)" />
      <defs>
        <linearGradient id="ksGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffaa00" />
          <stop offset="100%" stopColor="#ff6600" />
        </linearGradient>
      </defs>
      {/* Camera body */}
      <rect x="18" y="34" width="52" height="36" rx="8" fill="white" />
      {/* Lens */}
      <circle cx="44" cy="52" r="13" fill="#1a1a1a" />
      <circle cx="44" cy="52" r="9" fill="#333" />
      <circle cx="44" cy="52" r="5" fill="#555" />
      <circle cx="41" cy="49" r="2" fill="white" opacity="0.5" />
      {/* Play triangle (fast/kuai) */}
      <polygon points="41,46 41,58 53,52" fill="white" opacity="0.9" />
      {/* Flash/button */}
      <rect x="58" y="38" width="8" height="6" rx="2" fill="#ff6600" />
      {/* Viewfinder */}
      <rect x="20" y="36" width="10" height="7" rx="2" fill="#ddd" />
      {/* Lightning bolt side */}
      <polygon points="74,34 68,52 73,52 67,70 79,48 73,48" fill="white" opacity="0.95" />
    </svg>
  );
}

function AppIcon({ app, glow }: { app: AppKey; glow: string }) {
  if (app === "qq") return <QQIcon glow={glow} />;
  if (app === "douyin") return <DouyinIcon glow={glow} />;
  if (app === "weibo") return <WeiboIcon glow={glow} />;
  if (app === "xiaohongshu") return <XiaohongshuIcon glow={glow} />;
  if (app === "kuaishou") return <KuaishouIcon glow={glow} />;
  return <WeChatIcon glow={glow} />;
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
  const { label, bg, glow } = APP_CONFIG[app];
  const duration = detectDuration(name);

  return (
    <div
      className={`relative flex flex-col overflow-hidden ${className}`}
      style={{ background: bg }}
    >
      {/* Glow orb */}
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

      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: "18px 18px",
        }}
      />

      {/* App icon */}
      <div className="relative z-10 flex flex-1 items-center justify-center" aria-hidden>
        <AppIcon app={app} glow={glow} />
      </div>

      {/* Bottom text */}
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
