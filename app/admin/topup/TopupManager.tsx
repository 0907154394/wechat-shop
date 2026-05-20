"use client";

import { CheckCircle, XCircle, Clock, ExternalLink, Zap } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  if (status === "confirmed") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
      <CheckCircle className="h-3 w-3" /> Đã xác nhận
    </span>
  );
  if (status === "rejected") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
      <XCircle className="h-3 w-3" /> Từ chối
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
      <Clock className="h-3 w-3" /> Chờ thanh toán
    </span>
  );
}

export function TopupManager({ requests }: { requests: any[] }) {
  const pending = requests.filter((r: any) => r.status === "pending");
  const done    = requests.filter((r: any) => r.status !== "pending");

  return (
    <div className="space-y-8">
      {/* Auto-processing notice */}
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
        <Zap className="h-5 w-5 shrink-0 text-emerald-500" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">Xử lý tự động</p>
          <p className="text-xs text-emerald-600">Hệ thống tự kiểm tra Tronscan mỗi 5 phút và cộng tiền vào ví khách. Không cần duyệt tay.</p>
        </div>
      </div>

      {/* Pending */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Đang chờ ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-400">
            Không có yêu cầu nào đang chờ.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((r: any) => (
              <div key={r.id} className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-lg font-black text-gray-900">{r.amount_usdt} USDT</p>
                    <p className="text-sm text-gray-600">Khách: <span className="font-semibold">@{r.username}</span></p>
                    <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleString("vi-VN")}</p>
                    {r.tx_hash ? (
                      <a
                        href={`https://tronscan.org/#/transaction/${r.tx_hash}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Xem TX trên Tronscan
                      </a>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Chưa phát hiện giao dịch — đang chờ tự động</p>
                    )}
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      {done.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Đã xử lý ({done.length})
          </h2>
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden divide-y divide-gray-50">
            {done.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    @{r.username} · {r.amount_usdt} USDT
                  </p>
                  <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleString("vi-VN")}</p>
                  {r.tx_hash && (
                    <a
                      href={`https://tronscan.org/#/transaction/${r.tx_hash}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> TX Hash
                    </a>
                  )}
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
