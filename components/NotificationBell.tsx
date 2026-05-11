"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Package, Info, X, CheckCheck } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  order_id: string | null;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell({ isTransparent }: { isTransparent?: boolean }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef<any>(null);

  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      const sb = createClient();
      supabaseRef.current = sb;

      sb.auth.getUser().then(({ data }) => {
        if (!data.user) return;
        setUserId(data.user.id);

        sb.from("notifications")
          .select("*")
          .eq("user_id", data.user.id)
          .order("created_at", { ascending: false })
          .limit(20)
          .then(({ data: notifs }) => { if (notifs) setNotifications(notifs); });

        const channel = sb
          .channel("user-notif-" + data.user.id)
          .on("postgres_changes", {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${data.user.id}`,
          }, (payload) => {
            setNotifications(prev => [payload.new as Notification, ...prev]);
          })
          .subscribe();

        return () => { sb.removeChannel(channel); };
      });
    });

    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifications.filter(n => !n.is_read).length;

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0 && userId) {
      await supabaseRef.current?.from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  }

  if (!userId) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
          isTransparent
            ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
            : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
        }`}
        aria-label="Thông báo"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-gray-200/60 z-50">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="font-semibold text-gray-900">Thông báo</p>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                <p className="text-sm font-medium text-gray-400">Chưa có thông báo</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 transition-colors hover:bg-gray-50/50 ${!n.is_read ? "bg-emerald-50/40" : ""}`}
                >
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    n.type === "order_delivered" ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                  }`}>
                    {n.type === "order_delivered" ? <Package className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{n.message}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <p className="text-[10px] text-gray-400">
                        {new Date(n.created_at).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                      {n.order_id && (
                        <Link
                          href={`/orders/${n.order_id}`}
                          onClick={() => setOpen(false)}
                          className="text-[10px] font-semibold text-emerald-600 hover:underline"
                        >
                          Xem đơn →
                        </Link>
                      )}
                    </div>
                  </div>
                  {!n.is_read && (
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5">
              <p className="flex items-center gap-1 text-xs text-gray-400">
                <CheckCheck className="h-3.5 w-3.5" />
                {unread === 0 ? "Tất cả đã đọc" : `${unread} chưa đọc`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
