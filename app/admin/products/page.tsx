"use client";

import { useEffect, useState, useMemo } from "react";
import { Eye, EyeOff, Trash2, Search, RefreshCw, Pencil, X, Check, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductThumbnail } from "@/components/ProductThumbnail";
import { formatVND } from "@/lib/utils";

interface Product {
  id: string; name: string; price: number; stock: number; is_active: boolean | null;
}
interface Account {
  id: string; product_id: string; username: string; password: string;
  phone_number: string | null; backup_email: string | null;
  status: "available" | "sold"; created_at: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  // filters
  const [filterStatus, setFilterStatus] = useState<"all" | "available" | "sold">("all");
  const [search, setSearch]             = useState("");
  const [showPwdIds, setShowPwdIds]     = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId]         = useState<string | null>(null);
  const [deleting, setDeleting]         = useState(false);

  // edit modal
  const [editOpen, setEditOpen]   = useState(false);
  const [editName, setEditName]   = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [syncing, setSyncing]     = useState(false);

  async function fetchAll() {
    setLoading(true);
    const res  = await fetch("/api/admin/accounts");
    const data = await res.json();
    setProducts(data.products ?? []);
    setAccounts(data.accounts ?? []);
    if (!activeId && data.products?.length) setActiveId(data.products[0].id);
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  const activeProduct = products.find(p => p.id === activeId) ?? null;

  const stockMap = useMemo(() => {
    const m: Record<string, { available: number; sold: number }> = {};
    accounts.forEach(a => {
      if (!m[a.product_id]) m[a.product_id] = { available: 0, sold: 0 };
      m[a.product_id][a.status]++;
    });
    return m;
  }, [accounts]);

  const filtered = useMemo(() => accounts.filter(a => {
    if (a.product_id !== activeId)    return false;
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (search && !a.username.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [accounts, activeId, filterStatus, search]);

  function togglePwd(id: string) {
    setShowPwdIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    await fetch(`/api/admin/accounts/${id}`, { method: "DELETE" });
    setAccounts(prev => prev.filter(a => a.id !== id));
    setDeleteId(null);
    setDeleting(false);
  }

  async function handleSyncStock() {
    setSyncing(true);
    await fetch("/api/admin/sync-stock", { method: "POST" });
    await fetchAll();
    setSyncing(false);
  }

  function openEdit() {
    if (!activeProduct) return;
    setEditName(activeProduct.name);
    setEditPrice(activeProduct.price.toString());
    setEditOpen(true);
  }

  async function handleSaveEdit() {
    if (!activeId) return;
    setEditSaving(true);
    await fetch(`/api/admin/products/${activeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, price: parseInt(editPrice) }),
    });
    setEditSaving(false);
    setEditOpen(false);
    fetchAll();
  }

  async function handleToggleActive() {
    if (!activeProduct) return;
    const newActive = !activeProduct.is_active;
    setProducts(prev => prev.map(p => p.id === activeId ? { ...p, is_active: newActive } : p));
    const res = await fetch(`/api/admin/products/${activeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: newActive }),
    });
    if (!res.ok) {
      setProducts(prev => prev.map(p => p.id === activeId ? { ...p, is_active: !newActive } : p));
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  const s = activeId ? (stockMap[activeId] ?? { available: 0, sold: 0 }) : null;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50/60">

      {/* ── LEFT SIDEBAR: tier list ── */}
      <div className="flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5">
          <h2 className="text-sm font-bold text-gray-800">Sản phẩm</h2>
          <button
            onClick={handleSyncStock}
            title="Đồng bộ tồn kho"
            className="rounded-lg p-1 hover:bg-gray-100"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-gray-400 ${syncing || loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {products.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-gray-400">
              Chưa có sản phẩm.<br />Tạo kho mới ở mục Kho acc.
            </p>
          ) : (
            products.map(p => {
              const ps      = stockMap[p.id] ?? { available: 0, sold: 0 };
              const active  = activeId === p.id;
              const isEmpty = ps.available === 0;
              return (
                <button
                  key={p.id}
                  onClick={() => { setActiveId(p.id); setFilterStatus("all"); setSearch(""); }}
                  className={`w-full border-l-2 px-3 py-3 text-left transition-colors ${
                    active
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-transparent hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg">
                      <ProductThumbnail name={p.name} className="h-full w-full" compact />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-semibold ${active ? "text-emerald-700" : "text-gray-700"}`}>
                        {p.name}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold ${isEmpty ? "text-red-400" : "text-emerald-500"}`}>
                          {ps.available} còn
                        </span>
                        <span className="text-[10px] text-gray-300">·</span>
                        <span className="text-[10px] text-gray-400">{ps.sold} bán</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT CONTENT: account list ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {!activeProduct ? (
          <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
            Chọn sản phẩm bên trái để xem acc
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-gray-200 bg-white px-6 py-4">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                <ProductThumbnail name={activeProduct.name} className="h-full w-full" compact />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold text-gray-900 truncate">{activeProduct.name}</h1>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-600 ring-1 ring-emerald-100">
                    {formatVND(activeProduct.price)}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                    activeProduct.is_active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {activeProduct.is_active ? "Đang bán" : "Tạm ẩn"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-400">
                  <span className="font-semibold text-emerald-500">{s!.available} còn hàng</span>
                  <span className="mx-1.5 text-gray-200">·</span>
                  {s!.sold} đã bán
                  <span className="mx-1.5 text-gray-200">·</span>
                  {s!.available + s!.sold} tổng
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleToggleActive}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                    activeProduct.is_active
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100"
                  }`}
                >
                  {activeProduct.is_active
                    ? <ToggleRight className="h-4 w-4 text-emerald-500" />
                    : <ToggleLeft className="h-4 w-4 text-orange-400" />
                  }
                  {activeProduct.is_active ? "Đang bán" : "Hiện lên web"}
                </button>
                <button
                  onClick={openEdit}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Sửa
                </button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-6 py-2.5">
              <span className="text-sm font-semibold text-gray-700">
                {filtered.length}
                <span className="ml-1 font-normal text-gray-400">/ {s!.available + s!.sold}</span>
              </span>
              <div className="ml-auto flex items-center gap-2">
                <div className="flex rounded-lg border border-gray-200 text-xs">
                  {(["all", "available", "sold"] as const).map((st, i) => (
                    <button key={st} onClick={() => setFilterStatus(st)}
                      className={`px-3 py-1.5 font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                        i > 0 ? "border-l border-gray-200" : ""
                      } ${filterStatus === st ? "bg-emerald-600 text-white" : "bg-white text-gray-500 hover:text-emerald-600"}`}
                    >
                      {st === "all" ? "Tất cả" : st === "available" ? "Còn hàng" : "Đã bán"}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Tìm username..."
                    className="h-8 w-44 rounded-lg border border-gray-200 pl-8 pr-3 text-xs focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Account list */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                  <div className="mb-3 h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium">Không có tài khoản</p>
                  <p className="mt-1 text-xs text-gray-300">Nhập acc qua mục Kho acc</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 bg-white">
                  {filtered.map((acc, idx) => {
                    const showPwd = showPwdIds.has(acc.id);
                    return (
                      <div
                        key={acc.id}
                        className={`flex items-center gap-4 px-6 py-3 transition-colors hover:bg-gray-50 ${
                          acc.status === "sold" ? "opacity-45" : ""
                        }`}
                      >
                        <span className="w-8 shrink-0 text-center text-xs text-gray-300">{idx + 1}</span>
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          acc.status === "available" ? "bg-emerald-400" : "bg-gray-300"
                        }`} />
                        <div className="min-w-0 flex-1 grid grid-cols-3 gap-4 items-center">
                          <span className="font-mono text-sm font-semibold text-gray-800 truncate">
                            {acc.username}
                          </span>
                          <button
                            onClick={() => togglePwd(acc.id)}
                            className="flex items-center gap-1.5 font-mono text-xs text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showPwd ? acc.password : "••••••••••"}
                            {showPwd ? <EyeOff className="h-3 w-3 shrink-0" /> : <Eye className="h-3 w-3 shrink-0" />}
                          </button>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            {acc.phone_number && <span>{acc.phone_number}</span>}
                            {acc.backup_email && <span className="truncate">{acc.backup_email}</span>}
                          </div>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          acc.status === "available"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-gray-100 text-gray-400"
                        }`}>
                          {acc.status === "available" ? "Còn hàng" : "Đã bán"}
                        </span>
                        {acc.status === "available" && (
                          <button
                            onClick={() => setDeleteId(acc.id)}
                            className="shrink-0 rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Delete confirm ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-1.5 text-base font-bold text-gray-900">Xóa tài khoản này?</h3>
            <p className="mb-6 text-sm text-gray-400">Hành động không thể hoàn tác.</p>
            <div className="flex gap-2">
              <Button className="flex-1 bg-red-500 hover:bg-red-600" loading={deleting} onClick={() => handleDelete(deleteId)}>Xóa</Button>
              <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>Hủy</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit modal ── */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center gap-4 px-5 py-4" style={{ background: "linear-gradient(135deg,#051c10 0%,#0a3520 100%)" }}>
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                <ProductThumbnail name={editName} className="h-full w-full" compact />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.45)" }}>Sửa sản phẩm</p>
                <p className="mt-0.5 truncate text-base font-bold text-white">{editName || "—"}</p>
              </div>
              <button
                onClick={() => setEditOpen(false)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors"
                style={{ background: "rgba(255,255,255,0.12)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.22)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
              >
                <X className="h-3.5 w-3.5 text-white" />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Tên sản phẩm</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Nhập tên sản phẩm..."
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-medium text-gray-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Giá bán</label>
                <div className="relative">
                  <input
                    type="number"
                    value={editPrice}
                    onChange={e => setEditPrice(e.target.value)}
                    placeholder="100000"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 pr-14 text-sm font-medium text-gray-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">VND</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  className="flex-1 gap-1.5"
                  loading={editSaving}
                  disabled={!editName.trim() || !editPrice}
                  onClick={handleSaveEdit}
                >
                  <Check className="h-4 w-4" /> Lưu thay đổi
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>
                  Hủy
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
