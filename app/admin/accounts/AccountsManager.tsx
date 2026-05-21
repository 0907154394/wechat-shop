"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, RefreshCw, Plus, ArrowLeft, X, FileSpreadsheet } from "lucide-react";
import { formatVND, groupProductsByApp } from "@/lib/utils";
import { ProductThumbnail } from "@/components/ProductThumbnail";
import * as XLSX from "xlsx";

interface Product { id: string; name: string; price: number; stock: number }
interface Account {
  id: string; product_id: string; username: string; password: string;
  phone_number: string | null; backup_email: string | null;
  status: "available" | "sold"; created_at: string;
}

function parseLine(raw: string) {
  const line = raw.trim();
  if (!line || line.startsWith("#")) return null;
  let parts: string[];
  if (line.includes("|"))       parts = line.split("|");
  else if (line.includes("\t")) parts = line.split("\t");
  else if (line.includes(":"))  parts = line.split(":");
  else                          parts = line.split(/\s{2,}/);
  parts = parts.map(p => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  return { username: parts[0], password: parts[1], phone: parts[2] ?? "", email: parts[3] ?? "" };
}

export function AccountsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading]   = useState(true);

  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  // create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createPrice, setCreatePrice] = useState("");
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState("");

  // import
  const [pasteText, setPasteText]       = useState("");
  const [importing, setImporting]       = useState(false);
  const [importResult, setImportResult] = useState<{ ok: number; fail: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleExcelFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        // Skip header row if first cell looks like a label (not a wechat ID)
        const start = rows.length > 0 && typeof rows[0][0] === "string" &&
          !/^wxid|^[a-zA-Z0-9+_]{4,}/.test(rows[0][0]) ? 1 : 0;
        const lines = rows.slice(start)
          .filter(r => r.length >= 2 && r[0] && r[1])
          .map(r => r.map((c: any) => String(c ?? "").trim()).join("|"));
        setPasteText(lines.join("\n"));
        setImportResult(null);
      } catch {
        alert("Không đọc được file Excel. Hãy thử lưu lại dạng .xlsx");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function fetchAll() {
    setLoading(true);
    const res  = await fetch("/api/admin/accounts");
    const data = await res.json();
    setProducts(data.products ?? []);
    setAccounts(data.accounts ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  // keep activeProduct in sync
  useEffect(() => {
    if (activeProduct) {
      const fresh = products.find(p => p.id === activeProduct.id);
      if (fresh) setActiveProduct(fresh);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  const stockMap = useMemo(() => {
    const m: Record<string, { available: number; sold: number }> = {};
    accounts.forEach(a => {
      if (!m[a.product_id]) m[a.product_id] = { available: 0, sold: 0 };
      m[a.product_id][a.status]++;
    });
    return m;
  }, [accounts]);

  const parsedLines = useMemo(() =>
    pasteText.split("\n")
      .map(line => ({ raw: line, parsed: parseLine(line) }))
      .filter(x => x.raw.trim() && !x.raw.trim().startsWith("#")),
    [pasteText]
  );
  const validCount   = parsedLines.filter(x => x.parsed).length;
  const invalidCount = parsedLines.filter(x => !x.parsed).length;

  async function handleCreateKho() {
    if (!createName.trim() || !createPrice) return;
    setCreating(true); setCreateError("");
    const res  = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: createName.trim(), price: parseInt(createPrice) }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setCreateError(data.error ?? "Lỗi tạo kho"); return; }
    setShowCreate(false); setCreateName(""); setCreatePrice("");
    fetchAll();
  }

  async function handleImport() {
    if (!activeProduct || validCount === 0) return;
    setImporting(true); setImportResult(null);
    const rows = parsedLines.filter(x => x.parsed).map(x => ({
      username: x.parsed!.username, password: x.parsed!.password,
      phone: x.parsed!.phone, email: x.parsed!.email,
    }));
    const res  = await fetch("/api/admin/import-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: activeProduct.id, rows }),
    });
    const data = await res.json();
    setImporting(false);
    const ok   = data.imported ?? 0;
    setImportResult({ ok, fail: rows.length - ok });
    if (ok > 0) { setPasteText(""); fetchAll(); }
  }

  if (loading && !activeProduct) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  // ─── VIEW: Import (inside a kho) ─────────────────────────────────────────
  if (activeProduct) {
    const khoAll   = accounts.filter(a => a.product_id === activeProduct.id);
    const khoAvail = khoAll.filter(a => a.status === "available").length;
    const khoSold  = khoAll.filter(a => a.status === "sold").length;

    return (
      <div className="min-h-screen bg-gray-50/60 p-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => { setActiveProduct(null); setImportResult(null); setPasteText(""); }}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-gray-500" />
          </button>
          <div className="h-9 w-9 overflow-hidden rounded-xl">
            <ProductThumbnail name={activeProduct.name} className="h-full w-full" compact />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 truncate">{activeProduct.name}</h1>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-600 ring-1 ring-emerald-100">
                {formatVND(activeProduct.price)}
              </span>
            </div>
            <p className="text-sm text-gray-400">
              <span className={`font-semibold ${khoAvail > 0 ? "text-emerald-500" : "text-red-400"}`}>{khoAvail} còn</span>
              <span className="mx-1.5 text-gray-200">·</span>{khoSold} đã bán
              <span className="mx-1.5 text-gray-200">·</span>{khoAll.length} tổng
            </p>
          </div>
          <button onClick={fetchAll}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 text-gray-400 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Import panel — centered, wider */}
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-gray-800">Nhập tài khoản vào kho</p>
                <p className="mt-0.5 text-xs text-gray-400">
                  Mỗi dòng:{" "}
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px]">username|password</code>
                  <span className="ml-1 text-gray-300">hoặc thêm |sdt|email</span>
                </p>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleExcelFile(f); e.target.value = ""; }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Import Excel
                </button>
              </div>
            </div>

            <div className="relative"
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleExcelFile(f);
              }}
            >
              <textarea
                value={pasteText}
                onChange={e => { setPasteText(e.target.value); setImportResult(null); }}
                rows={12}
                placeholder="Dán vào đây hoặc kéo thả file Excel..."
                className="w-full resize-y rounded-xl border border-gray-200 bg-gray-50 p-3 font-mono text-xs leading-[1.6] text-gray-700 placeholder-gray-300 transition focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                spellCheck={false}
              />
              {pasteText && (
                <div className="absolute right-3 top-3 flex gap-1.5">
                  {validCount > 0 && (
                    <span className="rounded-lg bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                      {validCount} hợp lệ
                    </span>
                  )}
                  {invalidCount > 0 && (
                    <span className="rounded-lg bg-red-400 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                      {invalidCount} lỗi
                    </span>
                  )}
                </div>
              )}
            </div>

            {validCount > 0 && (
              <div className="mt-3 overflow-hidden rounded-xl border border-emerald-100">
                <div className="flex items-center justify-between bg-emerald-50 px-3 py-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-500">Preview</span>
                  <span className="text-[10px] text-emerald-400">{validCount} tài khoản</span>
                </div>
                {parsedLines.filter(x => x.parsed).slice(0, 5).map((x, i) => (
                  <div key={i} className="flex items-center gap-2 border-t border-emerald-50 px-3 py-1.5">
                    <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" />
                    <span className="w-2/5 truncate font-mono text-xs font-medium text-gray-700">{x.parsed!.username}</span>
                    <span className="font-mono text-xs text-gray-300">••••••</span>
                    {x.parsed!.phone && <span className="ml-auto text-[10px] text-gray-400">{x.parsed!.phone}</span>}
                  </div>
                ))}
                {validCount > 5 && (
                  <p className="border-t border-emerald-50 py-1.5 text-center text-[11px] text-gray-400">
                    + {validCount - 5} tài khoản nữa
                  </p>
                )}
              </div>
            )}

            {invalidCount > 0 && (
              <div className="mt-3 flex items-start gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-500">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {invalidCount} dòng thiếu dữ liệu, sẽ bỏ qua khi nhập
              </div>
            )}

            {importResult && (
              <div className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                importResult.fail === 0 ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-500"
              }`}>
                <CheckCircle2 className="h-4 w-4" />
                Đã nhập {importResult.ok} tài khoản
                {importResult.fail > 0 ? ` · ${importResult.fail} lỗi` : " thành công ✓"}
              </div>
            )}

            <Button
              className="mt-4 w-full"
              size="lg"
              loading={importing}
              disabled={validCount === 0}
              onClick={handleImport}
            >
              {validCount === 0 ? "Dán tài khoản vào ô trên" : `Nhập ${validCount} tài khoản vào kho`}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── VIEW: List (kho grid) ────────────────────────────────────────────────
  const totalAvail = accounts.filter(a => a.status === "available").length;
  const totalSold  = accounts.filter(a => a.status === "sold").length;

  return (
    <div className="min-h-screen bg-gray-50/60 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kho tài khoản</h1>
          <p className="text-sm text-gray-400">
            <span className="font-semibold text-emerald-500">{totalAvail} acc còn</span>
            <span className="mx-1.5 text-gray-200">·</span>
            {totalSold} đã bán
            <span className="mx-1.5 text-gray-200">·</span>
            {products.length} kho
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 text-gray-400 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Button onClick={() => { setShowCreate(true); setCreateName(""); setCreatePrice(""); setCreateError(""); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Tạo kho mới
          </Button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-36">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
            <svg className="h-8 w-8 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-500">Chưa có kho nào</p>
          <p className="mt-1 text-xs text-gray-400">Tạo kho đầu tiên để bắt đầu nhập acc</p>
          <Button className="mt-5 gap-2" onClick={() => { setShowCreate(true); setCreateName(""); setCreatePrice(""); setCreateError(""); }}>
            <Plus className="h-4 w-4" /> Tạo kho mới
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...groupProductsByApp(products)].flatMap(([, group]) => group).map((product) => (
            <AdminProductCard
              key={product.id}
              product={product}
              stockMap={stockMap}
              onImport={(p: Product) => { setActiveProduct(p); setPasteText(""); setImportResult(null); }}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header — fixed */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
              <h3 className="text-base font-bold text-gray-900">Tạo kho mới</h3>
              <button onClick={() => { setShowCreate(false); setCreateName(""); setCreatePrice(""); setCreateError(""); }} className="rounded-lg p-1 hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto px-6 pb-2 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Tên kho</label>
                <input value={createName} onChange={e => setCreateName(e.target.value)}
                  placeholder="VD: Acc WeChat 1 tháng"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  onKeyDown={e => e.key === "Enter" && handleCreateKho()}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Giá bán (USDT)</label>
                <input type="number" value={createPrice} onChange={e => setCreatePrice(e.target.value)}
                  placeholder="VD: 5"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  onKeyDown={e => e.key === "Enter" && handleCreateKho()}
                />
              </div>
              {createName.trim() && (
                <div className="overflow-hidden rounded-xl">
                  <ProductThumbnail name={createName} className="h-48 w-full" />
                </div>
              )}
              {createError && <p className="text-xs text-red-500">{createError}</p>}
            </div>

            {/* Footer — fixed */}
            <div className="flex gap-2 px-6 py-5 shrink-0 border-t border-gray-100 mt-2">
              <Button className="flex-1" disabled={!createName.trim() || !createPrice} loading={creating} onClick={handleCreateKho}>
                Tạo kho
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => { setShowCreate(false); setCreateError(""); }}>Hủy</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminProductCard({
  product,
  stockMap,
  onImport,
}: {
  product: Product;
  stockMap: Record<string, { available: number; sold: number }>;
  onImport: (p: Product) => void;
}) {
  const s = stockMap[product.id] ?? { available: 0, sold: 0 };
  const isEmpty = s.available === 0;

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md hover:ring-gray-200">
      <div className="relative h-44">
        <ProductThumbnail name={product.name} className="h-full w-full" compact />
        <div className={`absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold text-white shadow backdrop-blur-sm ${isEmpty ? "bg-red-500" : "bg-black/55"}`}>
          {isEmpty ? "Hết hàng" : `${s.available} acc`}
        </div>
      </div>
      <div className="flex flex-col gap-1 p-4">
        <h3 className="truncate font-bold text-gray-900 leading-snug">{product.name}</h3>
        <p className="text-sm font-semibold text-emerald-600">{formatVND(product.price)}</p>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className={`font-semibold ${s.available > 0 ? "text-emerald-500" : "text-red-400"}`}>{s.available} còn</span>
          <span className="text-gray-200">·</span>
          <span>{s.sold} đã bán</span>
        </div>
        <button onClick={() => onImport(product)}
          className="mt-2 w-full rounded-xl bg-gray-900 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-gray-700 active:scale-[.98]">
          Nhập acc →
        </button>
      </div>
    </div>
  );
}
