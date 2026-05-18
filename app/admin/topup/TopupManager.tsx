"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

function StatusBadge({ status }: { status: string }) {
  if (status === "confirmed") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
      <CheckCircle className="h-3 w-3" /> Đã duyệt
    </span>
  );
  if (status === "rejected") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
      <XCircle className="h-3 w-3" /> Từ chối
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
      <Clock className="h-3 w-3" /> Chờ duyệt
    </span>
  );
}

export function TopupManager({ requests: initial }: { requests: any[] }) {
  const [requests, setRequests] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function handle(id: string, action: "confirm" | "reject") {
    setLoading(id + action);
    const res = await fetch(`/api/admin/topup/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note: notes[id] ?? "" }),
    });
    setLoading(null);
    if (res.ok) {
      setRequests(prev => prev.map(r =>
        r.id === id ? { ...r, status: action === "confirm" ? "confirmed" : "rejected" } : r
      ));
    }
  }

  const pending = requests.filter(r => r.status === "pending");
  const done    = requests.filter(r => r.status !== "pending");

  return (
    <div className="space-y-8">
      {/* Pending */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Chờ duyệt ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-400">
            Không có yêu cầu nào đang chờ.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(r => (
              <div key={r.id} className="rounded-2xl border border-amber-200 bg-white shadow-sm overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-lg font-black text-gray-900">{r.amount_usdt} USDT</p>
                    </div>
                    <p className="text-sm text-gray-600">Khách: <span className="font-semibold">@{r.username}</span></p>
                    <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleString("vi-VN")}</p>
                    {r.tx_hash ? (
                      <a
                        href={`https://tronscan.org/#/transaction/${r.tx_hash}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Kiểm tra TX trên Tronscan
                      </a>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Khách chưa cung cấp TX Hash</p>
                    )}
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 flex items-center gap-2">
                  <input
                    placeholder="Ghi chú (tùy chọn, hiển thị cho khách khi từ chối)"
                    value={notes[r.id] ?? ""}
                    onChange={e => setNotes(p => ({ ...p, [r.id]: e.target.value }))}
                    className="h-9 flex-1 rounded-lg border border-gray-200 px-3 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <Button size="sm" onClick={() => handle(r.id, "confirm")} loading={loading === r.id + "confirm"}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white shrink-0">
                    ✓ Duyệt
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handle(r.id, "reject")} loading={loading === r.id + "reject"}
                    className="border-red-200 text-red-600 hover:bg-red-50 shrink-0">
                    Từ chối
                  </Button>
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
            {done.map(r => (
              <div key={r.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    @{r.username} · {r.amount_usdt} USDT
                  </p>
                  <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleString("vi-VN")}</p>
                  {r.note && <p className="text-xs text-gray-400 italic">{r.note}</p>}
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
