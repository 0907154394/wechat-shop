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
