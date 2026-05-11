"use client";

import { useState } from "react";
import { Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  reviewer_name: string | null;
  created_at: string;
}

interface Props {
  productId: string;
  eligibleOrderId: string | null;
  reviews: Review[];
  avgRating: number;
  hasReviewed: boolean;
}

function Stars({ rating, size = "sm", interactive = false, onChange }: {
  rating: number;
  size?: "sm" | "lg";
  interactive?: boolean;
  onChange?: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const cls = size === "lg" ? "h-6 w-6" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`${cls} transition-colors ${
            i <= (interactive ? hover || rating : rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-gray-200 text-gray-200"
          } ${interactive ? "cursor-pointer" : ""}`}
          onClick={() => interactive && onChange?.(i)}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
        />
      ))}
    </div>
  );
}

export function ReviewSection({ productId, eligibleOrderId, reviews, avgRating, hasReviewed }: Props) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(hasReviewed);
  const [localReviews, setLocalReviews] = useState<Review[]>(reviews);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eligibleOrderId) return;
    setSubmitting(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: eligibleOrderId, product_id: productId, rating, comment }),
    });
    if (res.ok) {
      setSubmitted(true);
      setLocalReviews(prev => [{
        id: Date.now().toString(),
        rating,
        comment: comment.trim() || null,
        reviewer_name: "Bạn",
        created_at: new Date().toISOString(),
      }, ...prev]);
    }
    setSubmitting(false);
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-emerald-500" />
          Đánh giá ({localReviews.length})
        </h2>
        {localReviews.length > 0 && (
          <div className="flex items-center gap-2">
            <Stars rating={Math.round(avgRating)} />
            <span className="text-sm font-bold text-gray-700">{avgRating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Review form */}
      {eligibleOrderId && !submitted && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
          <p className="mb-3 text-sm font-semibold text-gray-700">Viết đánh giá của bạn</p>
          <div className="mb-3">
            <Stars rating={rating} size="lg" interactive onChange={setRating} />
          </div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Nhận xét về sản phẩm (không bắt buộc)..."
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm resize-none focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
          <Button type="submit" size="sm" className="mt-3" disabled={submitting}>
            {submitting ? "Đang gửi..." : "Gửi đánh giá"}
          </Button>
        </form>
      )}

      {submitted && eligibleOrderId && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-medium">
          Bạn đã đánh giá sản phẩm này. Cảm ơn!
        </div>
      )}

      {/* Review list */}
      {localReviews.length === 0 ? (
        <div className="py-8 text-center">
          <Star className="mx-auto mb-2 h-8 w-8 text-gray-200" />
          <p className="text-sm text-gray-400">Chưa có đánh giá nào</p>
          <p className="text-xs text-gray-400 mt-0.5">Hãy là người đầu tiên đánh giá!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {localReviews.map(r => (
            <div key={r.id} className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-400 text-sm font-bold text-white">
                {(r.reviewer_name?.[0] ?? "K").toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">{r.reviewer_name ?? "Khách"}</p>
                  <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString("vi-VN")}</p>
                </div>
                <Stars rating={r.rating} />
                {r.comment && <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{r.comment}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
