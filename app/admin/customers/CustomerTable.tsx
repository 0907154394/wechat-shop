"use client";

import { useState } from "react";
import { ShoppingBag, Ban, CheckCircle, Search, Wallet, Users } from "lucide-react";

function formatUSDT(n: number) {
  const s = (+n).toFixed(4).replace(/\.?0+$/, "");
  return `${s} USDT`;
}
const formatVND = formatUSDT;

export function CustomerTable({
  rows,
  toggleBanAction,
}: {
  rows: any[];
  toggleBanAction: (fd: FormData) => Promise<void>;
}) {
  const [search, setSearch] = useState("");

  const filtered = rows.filter(u => {
    const q = search.toLowerCase();
    return (
      !q ||
      u.user_metadata?.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.user_metadata?.full_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm username, email..."
          className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-5 py-3 text-left font-semibold text-gray-500">Khách hàng</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-500">Đăng ký</th>
              <th className="px-5 py-3 text-center font-semibold text-gray-500">Đơn hàng</th>
              <th className="px-5 py-3 text-right font-semibold text-gray-500">Chi tiêu</th>
              <th className="px-5 py-3 text-right font-semibold text-gray-500">Số dư ví</th>
              <th className="px-5 py-3 text-center font-semibold text-gray-500">Trạng thái</th>
              <th className="px-5 py-3 text-center font-semibold text-gray-500">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                  Không tìm thấy khách hàng nào
                </td>
              </tr>
            ) : filtered.map((u: any) => {
              const isBanned = !!u.banned_until;
              const initials = (u.user_metadata?.full_name ?? u.user_metadata?.username ?? u.email ?? "?")
                .trim().split(" ").slice(-2).map((w: string) => w[0]).join("").toUpperCase();

              return (
                <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${isBanned ? "opacity-60" : ""}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 text-xs font-black text-white">
                        {initials}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{u.user_metadata?.full_name || "—"}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                        {u.user_metadata?.username && (
                          <p className="text-xs font-mono text-gray-300">@{u.user_metadata.username}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {new Date(u.created_at).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {u.stats.total > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        <ShoppingBag className="h-3 w-3" /> {u.stats.total}
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-emerald-600">
                    {u.stats.spent > 0 ? formatVND(u.stats.spent) : <span className="font-normal text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {u.balance > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                        <Wallet className="h-3 w-3" /> {formatVND(u.balance)}
                      </span>
                    ) : <span className="text-gray-300 text-xs">0đ</span>}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {isBanned ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-600">
                        <Ban className="h-3 w-3" /> Bị khoá
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                        <CheckCircle className="h-3 w-3" /> Hoạt động
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <form action={toggleBanAction}>
                      <input type="hidden" name="user_id" value={u.id} />
                      <input type="hidden" name="is_banned" value={isBanned ? "true" : "false"} />
                      <button type="submit" className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isBanned ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-red-100 text-red-600 hover:bg-red-200"
                      }`}>
                        {isBanned ? "Mở khoá" : "Khoá"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && search === "" && (
          <div className="py-16 text-center text-gray-400">
            <Users className="mx-auto mb-3 h-10 w-10 opacity-30" />
            <p>Chưa có khách hàng nào đăng ký</p>
          </div>
        )}
      </div>
    </div>
  );
}
