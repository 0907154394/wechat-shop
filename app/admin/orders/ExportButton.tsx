"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export function ExportButton({ orders }: { orders: any[] }) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    const { utils, writeFile } = await import("xlsx").then(m => m);
    const rows = orders.map(o => ({
      "Mã đơn": o.order_code,
      "Sản phẩm": o.products?.name ?? "",
      "Số tiền (VNĐ)": o.amount,
      "Trạng thái": { pending: "Chờ TT", paid: "Đã TT", delivered: "Đã giao", cancelled: "Huỷ" }[o.status as string] ?? o.status,
      "Ngày tạo": new Date(o.created_at).toLocaleString("vi-VN"),
      "Thanh toán lúc": o.paid_at ? new Date(o.paid_at).toLocaleString("vi-VN") : "",
    }));
    const ws = utils.json_to_sheet(rows);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Đơn hàng");
    writeFile(wb, `don-hang-${new Date().toISOString().slice(0, 10)}.xlsx`);
    setLoading(false);
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors disabled:opacity-60"
    >
      <Download className="h-4 w-4" />
      {loading ? "Đang xuất..." : "Xuất Excel"}
    </button>
  );
}
