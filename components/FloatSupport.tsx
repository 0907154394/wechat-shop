"use client";

import { useState, useRef, useEffect } from "react";
import { X, Headphones, MessageCircle, ChevronRight, Copy, Check } from "lucide-react";

interface Props {
  wechatId?: string;
  telegram?: string;
}

function ZaloLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="24" fill="#0068FF" />
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle"
        fill="white" fontSize="22" fontWeight="900" fontFamily="Arial, sans-serif">Z</text>
    </svg>
  );
}

function FacebookLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="24" fill="#1877F2" />
      <path d="M28.5 25.5l.75-4.5H25V18c0-1.24.6-2.44 2.53-2.44H29.5V12s-1.8-.3-3.52-.3c-3.6 0-5.95 2.18-5.95 6.13V21H16v4.5h4.03V36h4.97V25.5H28.5z" fill="white" />
    </svg>
  );
}

function WeChatLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="24" fill="#07c160" />
      <ellipse cx="18" cy="20" rx="10" ry="8" fill="white" />
      <polygon points="10,26 7,32 16,26" fill="white" />
      <circle cx="15" cy="19" r="1.5" fill="#07c160" />
      <circle cx="21" cy="19" r="1.5" fill="#07c160" />
      <ellipse cx="31" cy="26" rx="9" ry="7" fill="white" fillOpacity="0.88" />
      <polygon points="37,32 40,38 30,32" fill="white" fillOpacity="0.88" />
      <circle cx="28" cy="25" r="1.3" fill="#07c160" />
      <circle cx="34" cy="25" r="1.3" fill="#07c160" />
    </svg>
  );
}

function TelegramLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="24" fill="#29A8E9" />
      <path d="M10 23.5l6.5 2.5 2.5 7.5 3.5-3.5 7 5 5-18-24.5 6.5z" fill="white" opacity="0.5" />
      <path d="M10 23.5l24.5-6.5-7 10.5M16.5 26l2.5 7.5 3.5-3.5" fill="none" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 23.5l6.5 2.5 18-8.5" fill="white" />
    </svg>
  );
}

export function FloatSupport({ wechatId, telegram }: Props) {
  const [open, setOpen]         = useState(false);
  const [copied, setCopied]     = useState(false);
  const [showWcId, setShowWcId] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowWcId(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  type Item = {
    icon: React.ReactNode;
    label: string;
    labelZh: string;
    sub: string;
    href?: string;
    onClickCustom?: () => void;
    ping?: boolean;
  };

  const items: Item[] = [
    ...(wechatId ? [{
      icon: <WeChatLogo />,
      label: "WeChat 客服",
      labelZh: "微信客服",
      sub: wechatId,
      onClickCustom: () => setShowWcId(v => !v),
    }] : []),
    ...(telegram ? [{
      icon: <TelegramLogo />,
      label: "Telegram",
      labelZh: "Telegram",
      sub: telegram.startsWith("@") ? telegram : `@${telegram}`,
      href: `https://t.me/${telegram.replace("@", "")}`,
    }] : []),
  ];

  async function copyWechat() {
    if (!wechatId) return;
    await navigator.clipboard.writeText(wechatId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div ref={ref} className="fixed bottom-6 right-5 z-50 flex flex-col items-end gap-3">

      {open && (
        <div className="mb-1 w-68 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/8"
          style={{ animation: "floatCardIn 0.2s cubic-bezier(.22,1,.36,1) both", width: 272 }}>

          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-emerald-600 to-green-500 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-black text-white">WeChat <span className="text-emerald-200">Shop</span></p>
                <p className="text-[10px] font-medium text-white/60 uppercase tracking-widest">Vietnam · 越南微信店</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full p-1 text-white/70 hover:bg-white/20">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Items */}
          <div className="divide-y divide-gray-100">
            {items.length === 0 ? (
              <div className="px-4 py-5 text-center text-xs text-gray-400">
                Chưa cấu hình liên hệ.<br />
                Vào <span className="font-semibold text-emerald-600">Admin → Cài đặt</span>
              </div>
            ) : items.map((item, i) => (
              <div key={item.label}>
                {item.href ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer"
                    className="group/item flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                    style={{ animation: `floatCardIn 0.2s cubic-bezier(.22,1,.36,1) ${i * 60}ms both` }}
                  >
                    <div className="relative shrink-0">
                      {item.icon}
                      {item.ping && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                      <p className="text-[10px] text-gray-400">{item.labelZh}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 group-hover/item:text-gray-400" />
                  </a>
                ) : (
                  <button onClick={item.onClickCustom}
                    className="group/item flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                    style={{ animation: `floatCardIn 0.2s cubic-bezier(.22,1,.36,1) ${i * 60}ms both` }}
                  >
                    <div className="shrink-0">{item.icon}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800">{item.label} · <span className="text-emerald-600">{item.labelZh}</span></p>
                      <p className="font-mono text-[11px] text-gray-400">{item.sub}</p>
                    </div>
                    <ChevronRight className={`h-4 w-4 shrink-0 text-gray-300 transition-transform ${showWcId ? "rotate-90" : ""}`} />
                  </button>
                )}

                {/* WeChat ID copy panel */}
                {item.onClickCustom && showWcId && (
                  <div className="mx-4 mb-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
                      WeChat ID · 微信号
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-bold text-gray-800">{wechatId}</span>
                      <button onClick={copyWechat}
                        className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-white transition hover:bg-emerald-600"
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <p className="mt-1.5 text-[9px] text-emerald-400">搜索此微信号添加客服 · Tìm kiếm WeChat ID này</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-2 text-center">
            <p className="text-[10px] text-gray-400">
              Phản hồi trong vài phút · 几分钟内回复
            </p>
          </div>
        </div>
      )}

      {/* Trigger button */}
      <div className="group relative">
        {!open && (
          <div className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap opacity-0 transition-all duration-200 group-hover:opacity-100">
            <div className="rounded-xl bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
              Support · 客服
              <div className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 translate-x-1/2 rotate-45 bg-gray-900" />
            </div>
          </div>
        )}
        {!open && (
          <>
            <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-20" style={{ animation: "support-ring 2s ease-out 0s infinite" }} />
            <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-15" style={{ animation: "support-ring 2s ease-out 0.6s infinite" }} />
          </>
        )}
        <button onClick={() => { setOpen(!open); setShowWcId(false); }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
          style={{
            background: open
              ? "linear-gradient(135deg,#334155,#1e293b)"
              : "linear-gradient(145deg,#09d669 0%,#07c160 45%,#05a050 100%)",
            boxShadow: open
              ? "0 6px 20px rgba(0,0,0,0.35)"
              : "0 6px 28px rgba(7,193,96,0.6), 0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
        >
          {!open && <div className="pointer-events-none absolute inset-0 rounded-full" style={{ background: "linear-gradient(145deg,rgba(255,255,255,0.22) 0%,transparent 55%)" }} />}
          {open ? <X className="h-5 w-5 text-white" strokeWidth={2.5} /> : <Headphones className="h-6 w-6 text-white" strokeWidth={2} />}
        </button>
        {!open && (
          <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white shadow">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          </span>
        )}
      </div>

      <style>{`
        @keyframes floatCardIn { from { opacity:0; transform:translateY(10px) scale(0.96); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes support-ring { 0% { box-shadow:0 0 0 0 rgba(7,193,96,0.6); } 70% { box-shadow:0 0 0 12px rgba(7,193,96,0); } 100% { box-shadow:0 0 0 0 rgba(7,193,96,0); } }
      `}</style>
    </div>
  );
}
