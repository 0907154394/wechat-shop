"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useLang } from "@/lib/LanguageContext";
import { tr } from "@/lib/i18n";

export function WalletPayButton({ orderId, sufficient, amount }: {
  orderId: string;
  sufficient: boolean;
  amount: number;
}) {
  const router = useRouter();
  const { lang } = useLang();
  const T = tr(lang).pay;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePay() {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/orders/${orderId}/pay-with-balance`, { method: "POST" });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (data.error === "insufficient_balance") {
        setError(T.insufficientTitle);
      } else if (data.error === "deliver_failed") {
        setError(lang === "ZH" ? "库存暂时不足，请联系客服。" : lang === "EN" ? "Out of stock. Please contact support." : "Kho hàng tạm hết. Vui lòng liên hệ hỗ trợ.");
      } else {
        setError(lang === "ZH" ? "发生错误，请重试。" : lang === "EN" ? "An error occurred. Please try again." : "Có lỗi xảy ra. Vui lòng thử lại.");
      }
      return;
    }

    router.push(`/orders/${orderId}`);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      <Button
        size="lg"
        className="w-full font-semibold tracking-wide"
        disabled={!sufficient || loading}
        loading={loading}
        onClick={handlePay}
      >
        <Wallet className="mr-2 h-4 w-4" />
        {sufficient
          ? `${lang === "ZH" ? "付款" : lang === "EN" ? "Pay" : "Thanh toán"} ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)}`
          : T.insufficientBtn}
      </Button>
    </div>
  );
}
