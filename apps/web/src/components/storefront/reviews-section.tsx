"use client";

import { useState } from "react";
import { Button } from "@bazaarx/ui";
import { formatDateTime } from "@bazaarx/utils";
import {
  useReviews,
  useCreateReview,
  useDeleteReview,
  useMarkHelpful,
} from "@/hooks/use-reviews";

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5 text-lg">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={n <= value ? "text-amber-500" : "text-slate-300"}
        >
          ★
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
    <section className="space-y-5 border-t border-slate-200 pt-8">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">Reviews</h2>
        {data.totalReviews > 0 && (
          <span className="text-sm text-amber-600">
            ★ {data.avgRating.toFixed(1)} · {data.totalReviews} review{data.totalReviews > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {data.eligibleOrderId && (
        <form onSubmit={submit} className="space-y-3 rounded-lg border border-slate-200 p-4">
          <div className="text-sm font-medium">Write a review</div>
          <Stars value={rating} onChange={setRating} />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your experience (optional)"
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {create.isError && <p className="text-sm text-red-600">{(create.error as Error).message}</p>}
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Submitting…" : "Submit review"}
          </Button>
        </form>
      )}

      {data.reviews.length === 0 ? (
        <p className="text-sm text-slate-500">No reviews yet.</p>
      ) : (
        <div className="space-y-4">
          {data.reviews.map((r) => (
            <div key={r.id} className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <Stars value={r.rating} />
                <span className="text-xs text-slate-400">{formatDateTime(r.createdAt)}</span>
              </div>
              {r.title && <div className="mt-1 text-sm font-medium">{r.title}</div>}
              {r.body && <p className="mt-1 text-sm text-slate-600">{r.body}</p>}
              <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                <span>{r.authorName}</span>
                <button onClick={() => helpful.mutate(r.id)} className="hover:underline">
                  Helpful ({r.helpfulCount})
                </button>
                {r.isMine && (
                  <button onClick={() => del.mutate(r.id)} className="text-red-500 hover:underline">
                    Delete
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
