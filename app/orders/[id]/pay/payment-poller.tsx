"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function PaymentStatusPoller({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<string>("pending");

  useEffect(() => {
    const supabase = createClient();

    // Poll every 5 seconds
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();

      if (data?.status === "delivered") {
        clearInterval(interval);
        router.push(`/orders/${orderId}`);
      }
    }, 5000);

    // Also use realtime
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => {
          if (payload.new.status === "delivered") {
            router.push(`/orders/${orderId}`);
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [orderId, router]);

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Đang chờ xác nhận thanh toán...</span>
      </div>
      <p className="mt-1 text-xs text-blue-500">
        Trang sẽ tự động chuyển khi thanh toán được xác nhận
      </p>
    </div>
  );
}
