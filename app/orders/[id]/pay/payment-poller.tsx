"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function PaymentStatusPoller({ orderId }: { orderId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const interval = setInterval(async () => {
      const { data } = await supabase.from("orders").select("status").eq("id", orderId).single();
      if (data?.status === "delivered") {
        clearInterval(interval);
        router.push(`/orders/${orderId}`);
      }
    }, 5000);

    const channel = supabase
      .channel(`order-${orderId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => { if (payload.new.status === "delivered") router.push(`/orders/${orderId}`); }
      )
      .subscribe();

    return () => { clearInterval(interval); supabase.removeChannel(channel); };
  }, [orderId, router]);

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex items-center gap-4">
      <div className="relative shrink-0">
        <div className="h-10 w-10 rounded-full border-4 border-emerald-200 border-t-emerald-500 animate-spin" />
      </div>
      <div>
        <p className="font-semibold text-emerald-900">Đang chờ thanh toán...</p>
        <p className="mt-0.5 text-sm text-emerald-600">Trang sẽ tự chuyển ngay khi hệ thống nhận được tiền</p>
      </div>
    </div>
  );
}
