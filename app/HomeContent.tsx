"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/utils";
import type { Product } from "@/lib/types";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  Zap, Landmark, ShieldCheck,
  CheckCircle, MessageCircle, ArrowRight, Clock, Star,
} from "lucide-react";
import { tr } from "@/lib/i18n";
import { useLang } from "@/lib/LanguageContext";
import { ProductThumbnail } from "@/components/ProductThumbnail";

interface HomeContentProps {
  user: SupabaseUser | null;
  products: Product[] | null;
}

export function HomeContent({ user, products }: HomeContentProps) {
  const { lang } = useLang();
  const T = tr(lang);

  const featureIcons = [Zap, Landmark, ShieldCheck] as const;
  const featureColors = [
    { from: "from-yellow-500", to: "to-orange-400", shadow: "shadow-yellow-200" },
    { from: "from-blue-500", to: "to-indigo-400", shadow: "shadow-blue-200" },
    { from: "from-emerald-500", to: "to-green-400", shadow: "shadow-emerald-200" },
  ] as const;

  const guaranteeIcons = [ShieldCheck, Clock, Star] as const;
  const guaranteeColors = [
    { from: "from-emerald-500", to: "to-green-400", shadow: "shadow-emerald-200" },
    { from: "from-blue-500", to: "to-cyan-400", shadow: "shadow-blue-200" },
    { from: "from-yellow-500", to: "to-orange-400", shadow: "shadow-yellow-200" },
  ] as const;

  const stats = [
    { value: "500+",     label: T.stats.s1, color: "from-emerald-500 to-green-400",  shadow: "shadow-emerald-100" },
    { value: "200+",     label: T.stats.s2, color: "from-blue-500 to-cyan-400",      shadow: "shadow-blue-100"    },
    { value: "< 1 min",  label: T.stats.s3, color: "from-violet-500 to-purple-400",  shadow: "shadow-violet-100"  },
    { value: "24/7",     label: T.stats.s4, color: "from-amber-500 to-orange-400",   shadow: "shadow-amber-100"   },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 px-6 pb-24 pt-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-green-400/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl text-center">
          <div data-gsap="hero-badge" className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            {T.hero.badge}
          </div>
          <h1 data-gsap="hero-title" className="mb-6 text-5xl font-black leading-tight tracking-tight text-white sm:text-6xl">
            {T.hero.title[0]}{" "}
            <span className="gradient-text">{T.hero.title[1]}</span>
            <br />{T.hero.title[2]}
          </h1>
          <p data-gsap="hero-desc" className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-slate-400">
            {T.hero.desc}{" "}
            <span className="font-semibold text-emerald-400">{T.hero.descHighlight}</span>.
          </p>
          <div data-gsap="hero-cta" className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/products">
              <Button size="lg" className="w-full px-8 shadow-lg shadow-emerald-900/50 sm:w-auto">
                {T.hero.cta1} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            {!user && (
              <Link href="/login?tab=register">
                <Button size="lg" variant="outline" className="w-full border-slate-600 bg-transparent px-8 text-slate-300 hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400 sm:w-auto">
                  {T.hero.cta2}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map(({ value, label, color, shadow }) => (
              <div key={label} data-gsap="stat" className={`rounded-2xl bg-gradient-to-br ${color} p-px shadow-lg ${shadow}`}>
                <div className="flex h-full flex-col items-center justify-center rounded-2xl bg-white px-4 py-6 text-center">
                  <p className={`bg-gradient-to-br ${color} bg-clip-text text-3xl font-black text-transparent`}>{value}</p>
                  <p className="mt-1.5 text-xs font-medium text-gray-500">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="bg-gray-50 px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <div data-gsap="section-title" className="mb-10">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-600">{T.features.tag}</p>
            <h2 className="text-2xl font-bold text-gray-900">{T.features.title}</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {T.features.items.map((item, i) => {
              const Icon = featureIcons[i];
              const { from, to, shadow } = featureColors[i];
              return (
                <div key={item.title} data-gsap="feature-card" className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                  <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${from} ${to} shadow-md ${shadow}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="mb-1.5 font-bold text-gray-900">{item.title}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-gray-500">{item.desc}</p>
                  <ul className="space-y-1.5">
                    {item.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                        <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── GUARANTEE ── */}
      <section className="bg-gray-50 px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <div data-gsap="section-title" className="mb-8">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-600">{T.guarantee.tag}</p>
            <h2 className="text-2xl font-bold text-gray-900">{T.guarantee.title}</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {T.guarantee.items.map((item, i) => {
              const Icon = guaranteeIcons[i];
              const { from, to, shadow } = guaranteeColors[i];
              return (
                <div key={item.title} data-gsap="guarantee-card" className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${from} ${to} shadow-md ${shadow}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="font-bold text-gray-900">{item.title}</p>
                  <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PRODUCTS (logged in) ── */}
      {user && (
        <section className="bg-white px-6 py-14">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-600">{T.products.tag}</p>
                <h2 className="text-2xl font-bold text-gray-900">{T.products.title}</h2>
              </div>
              <Link href="/products" className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700">
                {T.products.viewAll} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {!products || products.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
                <MessageCircle className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p className="font-medium text-gray-400">{T.products.empty}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} T={T} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function ProductCard({ product, T }: { product: Product; T: ReturnType<typeof tr> }) {
  const inStock = product.stock > 0;
  return (
    <div data-gsap="product-card" className="flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-lg hover:border-emerald-200 overflow-hidden">
      {/* Thumbnail */}
      <div className="relative h-56 w-full shrink-0">
        <ProductThumbnail name={product.name} imageUrl={product.image_url} className="h-full w-full" />
        <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold backdrop-blur-sm ${
          inStock ? "bg-emerald-500/90 text-white" : "bg-gray-800/80 text-gray-300"
        }`}>
          {inStock ? `Còn ${product.stock}` : T.products.outOfStock}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-1 font-bold text-gray-900 leading-snug">{product.name}</h3>
        <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-500 line-clamp-2">{product.description}</p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-black text-emerald-600">{formatVND(product.price)}</p>
            <p className="text-xs text-gray-400">{T.products.perAccount}</p>
          </div>
          <Link href={`/products/${product.id}`}>
            <Button size="sm" disabled={!inStock}>
              {!inStock ? T.products.outOfStock : T.products.buy}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
