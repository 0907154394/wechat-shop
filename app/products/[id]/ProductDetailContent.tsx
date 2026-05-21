"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import { tr } from "@/lib/i18n";
import { formatVND, detectCountryCode } from "@/lib/utils";
import { CheckCircle, Zap, ShieldCheck, Clock, ChevronLeft, Star, ChevronDown, Package } from "lucide-react";
import { BuyBox } from "./BuyBox";
import { ReviewSection } from "./ReviewSection";
import { ProductThumbnail } from "@/components/ProductThumbnail";
import type { Product } from "@/lib/types";

const FEATURE_ICONS = [CheckCircle, ShieldCheck, Zap, Clock];
const FEATURE_COLORS = ["text-emerald-500", "text-blue-500", "text-yellow-500", "text-purple-500"];

interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  created_at: string;
}

interface CountryVariant { id: string; code: string; stock: number; }

interface Props {
  product: Product;
  realStock: number;
  reviews: Review[];
  avgRating: number;
  eligibleOrderId: string | null;
  hasReviewed: boolean;
  createOrderAction: (formData: FormData) => Promise<void>;
  maxQtyPerOrder: number;
  orderError: string | null;
  orderErrorLimit: number | null;
  balance: number;
  countryVariants: CountryVariant[];
}

export function ProductDetailContent({
  product, realStock, reviews, avgRating, eligibleOrderId, hasReviewed, createOrderAction,
  maxQtyPerOrder, orderError, orderErrorLimit, balance, countryVariants,
}: Props) {
  const { lang } = useLang();
  const T = tr(lang).productsPage;
  const inStock = realStock > 0;

  const features = T.productFeatures.map((text, i) => ({
    icon: FEATURE_ICONS[i],
    text,
    color: FEATURE_COLORS[i],
  }));

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="border-b border-gray-100 bg-white px-4 py-3">
        <div className="mx-auto max-w-5xl">
          <Link href="/products" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-600 transition-colors">
            <ChevronLeft className="h-4 w-4" /> {T.backToProducts}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="grid gap-0 md:grid-cols-5 md:items-stretch">
            {/* Image */}
            <div className="overflow-hidden border-b border-gray-100 md:border-b-0 md:border-r md:col-span-2 md:self-stretch">
              <ProductThumbnail
                name={product.name}
                imageUrl={product.image_url}
                className="h-64 w-full md:h-full md:min-h-full"
              />
            </div>

            {/* Details */}
            <div className="p-6 md:col-span-3">
              <div className="mb-4">
                <h1 className="text-2xl font-black text-gray-900">{product.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <Zap className="h-3 w-3" /> {T.autoDelivery}
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                    inStock ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                  }`}>
                    <Package className="h-3 w-3" />
                    {inStock ? T.stockLabel.replace("{n}", String(realStock)) : T.outOfStock}
                  </span>
                  {reviews.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      {avgRating.toFixed(1)} ({reviews.length} {T.reviews})
                    </span>
                  )}
                </div>
                {product.description && (
                  <p className="mt-3 text-sm leading-relaxed text-gray-500">{product.description}</p>
                )}
              </div>

              {countryVariants.length > 1 && (
                <div className="mb-4 border-t border-gray-100 pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Đầu số</p>
                  <div className="flex flex-wrap gap-2">
                    {countryVariants.map((v) => {
                      const isCurrent = v.id === product.id;
                      return (
                        <Link key={v.id} href={`/products/${v.id}`}
                          className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
                            isCurrent
                              ? "bg-emerald-500 text-white"
                              : v.stock > 0
                                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                : "bg-gray-100 text-gray-400 line-through cursor-not-allowed pointer-events-none"
                          }`}>
                          {v.code}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mb-5 border-t border-gray-100 pt-4">
                <span className="text-3xl font-black text-emerald-600">{formatVND(product.price)}</span>
                <span className="ml-2 text-sm text-gray-400">{T.perAccount}</span>
              </div>

              <BuyBox
                productId={product.id}
                price={product.price}
                stock={realStock}
                isLoggedIn={true}
                createOrderAction={createOrderAction}
                maxQtyPerOrder={maxQtyPerOrder}
                orderError={orderError}
                orderErrorLimit={orderErrorLimit}
                balance={balance}
              />
            </div>
          </div>
        </div>

        {/* Features + FAQ */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">{T.featuresTitle}</h2>
            <div className="space-y-3">
              {features.map(({ icon: Icon, text, color }) => (
                <div key={text} className="flex items-start gap-3">
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
                  <p className="text-sm text-gray-700">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">{T.faqTitle}</h2>
            <div className="space-y-2">
              {T.faq.map((item, i) => (
                <details key={i} className="group rounded-xl border border-gray-100 bg-gray-50">
                  <summary className="flex cursor-pointer items-center justify-between px-3 py-2.5 text-xs font-semibold text-gray-700 list-none">
                    {item.q}
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-3 pb-2.5 pt-1">
                    <p className="text-xs leading-relaxed text-gray-500">{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>

        <ReviewSection
          productId={product.id}
          eligibleOrderId={eligibleOrderId}
          reviews={reviews}
          avgRating={avgRating}
          hasReviewed={hasReviewed}
        />
      </div>
    </div>
  );
}
