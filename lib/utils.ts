import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSDT(amount: number) {
  const n = +amount;
  const s = n.toFixed(4).replace(/\.?0+$/, "");
  return `${s} USDT`;
}

// Backward-compat alias — all existing formatVND calls now display USDT
export const formatVND = formatUSDT;

export type AppKey = "wechat" | "qq" | "douyin" | "weibo" | "xiaohongshu" | "kuaishou";

export function detectApp(name: string): AppKey {
  const n = name.toLowerCase().normalize("NFC");
  if (/\bqq\b/.test(n)) return "qq";
  if (/douyin|抖音/.test(n)) return "douyin";
  if (/weibo|微博/.test(n)) return "weibo";
  if (/xiaohongshu|小红书|xhs/.test(n)) return "xiaohongshu";
  if (/kuaishou|快手/.test(n)) return "kuaishou";
  return "wechat";
}

const DURATION_ORDER = ["", "1-thang", "3-thang", "6-thang", "1-nam"];
const DURATION_LABELS: Record<string, string> = {
  "": "Cơ bản", "1-thang": "1 Tháng", "3-thang": "3 Tháng", "6-thang": "6 Tháng", "1-nam": "1 Năm",
};

function detectDurationKey(name: string): string {
  const n = name.toLowerCase().normalize("NFC")
    .replace(/tháng/g, "thang").replace(/năm/g, "nam")
    .replace(/\s+/g, " ").trim();
  const words = n.split(" ");
  for (let i = 0; i + 1 < words.length; i++) {
    if (words[i + 1] === "thang") {
      const num = parseInt(words[i], 10);
      if (num === 1) return "1-thang";
      if (num === 3) return "3-thang";
      if (num === 6) return "6-thang";
    }
    if (words[i] === "1" && words[i + 1] === "nam") return "1-nam";
  }
  return "";
}

export function getDurationLabel(name: string): string {
  return DURATION_LABELS[detectDurationKey(name)] ?? "Cơ bản";
}

export function getDurationOrder(name: string): number {
  const idx = DURATION_ORDER.indexOf(detectDurationKey(name));
  return idx === -1 ? 99 : idx;
}

export function groupProductsByApp<T extends { name: string }>(products: T[]): Map<AppKey, T[]> {
  const map = new Map<AppKey, T[]>();
  for (const p of products) {
    const app = detectApp(p.name);
    if (!map.has(app)) map.set(app, []);
    map.get(app)!.push(p);
  }
  for (const [, group] of map) {
    group.sort((a, b) => getDurationOrder(a.name) - getDurationOrder(b.name));
  }
  return map;
}

export function generateOrderCode() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let rand = "";
  for (let i = 0; i < 4; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `WC-${yy}${mm}${dd}-${rand}`;
}

export function buildVietQRUrl({
  bankId,
  accountNo,
  accountName,
  amount,
  addInfo,
}: {
  bankId: string;
  accountNo: string;
  accountName: string;
  amount: number;
  addInfo: string;
}) {
  const params = new URLSearchParams({
    amount: amount.toString(),
    addInfo,
    accountName,
  });
  return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?${params}`;
}
