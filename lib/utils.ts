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
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "DH";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
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
