"use client";

/* Hallmark · component: reviews-section · genre: modern-minimal · system: BazaarX tokens
 * pre-emit critique: P4 H4 E4 S5 R4 V4 */

import { useState } from "react";
import { Star, ThumbsUp, Trash } from "@phosphor-icons/react";
import { formatDateTime } from "@bazaarx/utils";
import {
  useReviews,
  useCreateReview,
  useDeleteReview,
  useMarkHelpful,
} from "@/hooks/use-reviews";

function Stars({
  value,
  size = 18,
  onChange,
}: {
  value: number;
  size?: number;
  onChange?: (v: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={`${onChange ? "transition-transform hover:scale-110 active:scale-95" : "cursor-default"} ${
            n <= value ? "text-amber-500" : "text-ink-300"
          }`}
        >
          <Star size={size} weight={n <= value ? "fill" : "regular"} />
        </button>
      ))}
    </div>
  );
}

export function ReviewsSection({ productId }: { productId: string }) {
  const { data, isLoading } = useReviews(productId);
  const create = useCreateReview(productId);
  const del = useDeleteReview(productId);
  const helpful = useMarkHelpful(productId);

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  if (isLoading || !data) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!data!.eligibleOrderId) return;
    create.mutate(
      { productId, orderId: data!.eligibleOrderId, rating, title: title.trim() || undefined, body: body.trim() || undefined },
      {
        onSuccess: () => {
          setTitle("");
          setBody("");
          setRating(5);
        },
      },
    );
  }

  return (
    <section className="space-y-5 border-t border-ink-200 pt-8">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-xl font-semibold text-ink-900">Reviews</h2>
        {data.totalReviews > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-sm font-medium text-emerald-700">
            <Star size={13} weight="fill" />
            {data.avgRating.toFixed(1)}
            <span className="font-normal text-emerald-600/70">· {data.totalReviews} review{data.totalReviews > 1 ? "s" : ""}</span>
          </span>
        )}
      </div>

      {data.eligibleOrderId && (
        <form onSubmit={submit} className="space-y-3 rounded-2xl border border-ink-200 bg-white p-5">
          <div className="text-sm font-medium text-ink-700">Write a review</div>
          <Stars value={rating} size={22} onChange={setRating} />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 outline-none transition-colors focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your experience (optional)"
            rows={3}
            className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 outline-none transition-colors focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          />
          {create.isError && (
            <p className="text-sm font-medium text-accent">{(create.error as Error).message}</p>
          )}
          <button
            type="submit"
            disabled={create.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg shadow-pop transition hover:bg-brand-800 active:scale-[0.98] disabled:opacity-50"
          >
            {create.isPending ? "Submitting…" : "Submit review"}
          </button>
        </form>
      )}

      {data.reviews.length === 0 ? (
        <p className="text-sm text-ink-500">No reviews yet.</p>
      ) : (
        <div className="space-y-4">
          {data.reviews.map((r) => (
            <div key={r.id} className="border-b border-ink-100 pb-4 last:border-b-0">
              <div className="flex items-center justify-between">
                <Stars value={r.rating} size={15} />
                <span className="text-xs text-ink-400">{formatDateTime(r.createdAt)}</span>
              </div>
              {r.title && <div className="mt-1.5 text-sm font-medium text-ink-900">{r.title}</div>}
              {r.body && <p className="mt-1 text-sm leading-relaxed text-ink-600">{r.body}</p>}
              <div className="mt-2 flex items-center gap-4 text-xs text-ink-500">
                <span className="font-medium text-ink-600">{r.authorName}</span>
                <button
                  onClick={() => helpful.mutate(r.id)}
                  className="inline-flex items-center gap-1 transition-colors hover:text-brand-700"
                >
                  <ThumbsUp size={14} /> Helpful (<span className="tabular-nums">{r.helpfulCount}</span>)
                </button>
                {r.isMine && (
                  <button
                    onClick={() => del.mutate(r.id)}
                    className="inline-flex items-center gap-1 text-ink-400 transition-colors hover:text-accent"
                  >
                    <Trash size={14} /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
