"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import { tr } from "@/lib/i18n";
import { formatVND, groupProductsByApp, getDurationLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MessageCircle, CheckCircle, Zap, ShieldCheck } from "lucide-react";
import { ProductThumbnail } from "@/components/ProductThumbnail";
import type { Product } from "@/lib/types";

const TRUST_ICONS = [Zap, ShieldCheck, CheckCircle];
const TRUST_STYLES = [
  { from: "from-yellow-500", to: "to-orange-400", shadow: "shadow-yellow-200" },
  { from: "from-emerald-500", to: "to-green-400", shadow: "shadow-emerald-200" },
  { from: "from-blue-500", to: "to-indigo-400", shadow: "shadow-blue-200" },
];

interface Props {
  products: Product[];
  stockMap: Record<string, number>;
  isLoggedIn: boolean;
}

export function ProductsContent({ products, stockMap, isLoggedIn }: Props) {
  const { lang } = useLang();
  const T = tr(lang).productsPage;

  const total = products.length;
  const inStock = products.filter(p => (stockMap[p.id] ?? 0) > 0).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dark gradient header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 px-6 py-14">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-green-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-5xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            {T.badge}
          </div>
          <h1 className="mb-2 text-2xl font-black text-white sm:text-4xl">
            {T.title.split("WeChat")[0]}
            <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">WeChat</span>
            {T.title.split("WeChat")[1]}
          </h1>
          <p className="text-slate-400">
            {T.subtitle.replace("{total}", String(total)).replace("{inStock}", String(inStock))}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Trust badges */}
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {T.trust.map((item, i) => {
            const Icon = TRUST_ICONS[i];
            const style = TRUST_STYLES[i];
            return (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${style.from} ${style.to} shadow-md ${style.shadow}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Products */}
        {products.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white py-24 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
              <MessageCircle className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-base font-medium text-gray-500">{T.empty}</p>
            <p className="mt-1 text-sm text-gray-400">{T.emptyDesc}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...groupProductsByApp(products)].map(([appKey, group]) => (
              <AppGroupCard key={appKey} group={group} stockMap={stockMap} isLoggedIn={isLoggedIn} T={T} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AppGroupCard({ group, stockMap, isLoggedIn, T }: {
  group: Product[]; stockMap: Record<string, number>; isLoggedIn: boolean;
  T: ReturnType<typeof tr>["productsPage"];
}) {
  const [idx, setIdx] = useState(0);
  const product = group[Math.min(idx, group.length - 1)];
  const stock = stockMap[product.id] ?? 0;
  const inStock = stock > 0;
  const href = inStock ? (isLoggedIn ? `/products/${product.id}` : "/login?tab=register") : "#";

  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-lg hover:border-emerald-200 overflow-hidden">
      <div className="relative h-52 w-full shrink-0">
        <ProductThumbnail name={product.name} imageUrl={(product as any).image_url} className="h-full w-full" compact />
        <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold backdrop-blur-sm ${
          inStock ? "bg-emerald-500/90 text-white" : "bg-gray-800/80 text-gray-300"
        }`}>
          {inStock ? T.inStock.replace("{n}", String(stock)) : T.outOfStock}
        </span>
      </div>

      {group.length > 1 && (
        <div className="flex flex-wrap gap-1.5 px-5 pt-4">
          {group.map((p, i) => (
            <button key={p.id} onClick={() => setIdx(i)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                i === idx ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {getDurationLabel(p.name)}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-1 font-bold text-gray-900 leading-snug">{product.name}</h3>
        <p className="mb-3 text-sm text-gray-500 leading-relaxed line-clamp-2">{(product as any).description}</p>

        <div className="mb-4 space-y-1.5">
          {T.cardFeatures.map(f => (
            <div key={f} className="flex items-center gap-2 text-xs text-gray-600">
              <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              {f}
            </div>
          ))}
        </div>

        <div className="mt-auto flex items-end justify-between">
          <div>
            <p className="text-2xl font-black text-emerald-600">{formatVND(product.price)}</p>
            <p className="text-xs text-gray-400">{T.perAccount}</p>
          </div>
          <Link href={href}>
            <Button size="sm" disabled={!inStock}>
              {!inStock ? T.outOfStock : isLoggedIn ? T.buyNow : T.registerToBuy}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
