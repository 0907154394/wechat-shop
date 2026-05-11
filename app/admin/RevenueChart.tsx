"use client";

import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type DataPoint = { label: string; revenue: number; orders: number };

function formatShort(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}tr`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return `${value}`;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-emerald-600 font-bold">
        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(payload[0]?.value ?? 0)}
      </p>
      <p className="text-gray-400 text-xs">{payload[1]?.value ?? 0} đơn hàng</p>
    </div>
  );
}

export function RevenueChart({ weekData, monthData }: { weekData: DataPoint[]; monthData: DataPoint[] }) {
  const [view, setView] = useState<"week" | "month">("week");
  const data = view === "week" ? weekData : monthData;
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = data.reduce((s, d) => s + d.orders, 0);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Doanh thu</h2>
          <p className="mt-1 text-2xl font-black text-gray-900">
            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalRevenue)}
          </p>
          <p className="text-sm text-gray-400">{totalOrders} đơn · {view === "week" ? "7 ngày qua" : "30 ngày qua"}</p>
        </div>
        <div className="flex rounded-xl border border-gray-200 overflow-hidden">
          {(["week", "month"] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                view === v ? "bg-emerald-500 text-white" : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {v === "week" ? "7 ngày" : "30 ngày"}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={formatShort} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={40} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5, fill: "#10b981" }} />
          <Area type="monotone" dataKey="orders" stroke="#6366f1" strokeWidth={0} fill="none" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
