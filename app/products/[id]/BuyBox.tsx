"use client";

import { useState } from "react";
import { Minus, Plus, Wallet, Zap, Bitcoin } from "lucide-react";
import { formatVND } from "@/lib/utils";

interface Props {
  productId: string;
  price: number;
  stock: number;
  isLoggedIn: boolean;
  createOrderAction: (formData: FormData) => Promise<void>;
}

export function BuyBox({ productId, price, stock, isLoggedIn, createOrderAction }: Props) {
  const [qty, setQty] = useState(1);
  const [payMethod, setPayMethod] = useState<"wallet" | "usdt">("wallet");
  const maxQty = Math.min(stock, 10);

  return (
    <form action={createOrderAction}>
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="quantity" value={qty} />
      <input type="hidden" name="pay_method" value={payMethod} />

      {/* Quantity */}
      <div className="mb-5">
        <p className="mb-2 text-sm font-medium text-gray-600">Số lượng</p>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-100 disabled:opacity-40">
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-10 text-center text-base font-bold text-gray-800">{qty}</span>
          <button type="button" onClick={() => setQty(q => Math.min(maxQty, q + 1))} disabled={qty >= maxQty}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-100 disabled:opacity-40">
            <Plus className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs text-gray-400">Tối đa {maxQty}</span>
        </div>
      </div>

      {/* Payment method */}
      <div className="mb-5">
        <p className="mb-2 text-sm font-medium text-gray-600">Phương thức thanh toán</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPayMethod("wallet")}
            className={`flex items-center gap-2 rounded-xl border-2 px-3 py-3 transition-all ${
              payMethod === "wallet"
                ? "border-emerald-500 bg-emerald-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <Wallet className={`h-4 w-4 shrink-0 ${payMethod === "wallet" ? "text-emerald-600" : "text-gray-400"}`} />
            <div className="text-left">
              <p className={`text-sm font-semibold leading-none ${payMethod === "wallet" ? "text-emerald-700" : "text-gray-600"}`}>Số dư ví</p>
              <p className="mt-0.5 text-[10px] text-gray-400">Nạp rồi thanh toán</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPayMethod("usdt")}
            className={`flex items-center gap-2 rounded-xl border-2 px-3 py-3 transition-all ${
              payMethod === "usdt"
                ? "border-violet-500 bg-violet-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <Bitcoin className={`h-4 w-4 shrink-0 ${payMethod === "usdt" ? "text-violet-600" : "text-gray-400"}`} />
            <div className="text-left">
              <p className={`text-sm font-semibold leading-none ${payMethod === "usdt" ? "text-violet-700" : "text-gray-600"}`}>USDT</p>
              <p className="mt-0.5 text-[10px] text-gray-400">Quét QR · TRC20</p>
            </div>
          </button>
        </div>
      </div>

      {/* Total */}
      <div className="mb-5 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
        <span className="text-sm text-gray-500">Tổng tiền</span>
        <span className="text-xl font-black text-emerald-600">{formatVND(price * qty)}</span>
      </div>

      {/* Submit */}
      {stock > 0 ? (
        <button
          type="submit"
          disabled={!isLoggedIn}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Zap className="h-4 w-4" />
          {isLoggedIn ? "Đặt hàng ngay" : "Đăng nhập để mua"}
        </button>
      ) : (
        <button disabled className="w-full rounded-xl bg-gray-200 py-3.5 text-sm font-bold text-gray-400 cursor-not-allowed">
          Hết hàng
        </button>
      )}

      {!isLoggedIn && (
        <p className="mt-2 text-center text-xs text-gray-400">
          <a href="/login" className="font-semibold text-emerald-600 hover:underline">Đăng nhập</a>
          {" "}hoặc{" "}
          <a href="/login?tab=register" className="font-semibold text-emerald-600 hover:underline">Đăng ký</a>
          {" "}để mua hàng
        </p>
      )}
    </form>
  );
}
