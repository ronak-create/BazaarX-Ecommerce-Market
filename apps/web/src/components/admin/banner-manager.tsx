"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@bazaarx/ui";

type Banner = {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  position: "HOME" | "CATEGORY";
  isActive: boolean;
  priority: number;
};

const KEY = ["admin", "banners"] as const;

export function BannerManager() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Banner[]> => {
      const res = await fetch("/api/admin/banners", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const create = useMutation({
    mutationFn: async (body: { imageUrl: string; linkUrl?: string; position: string; priority: number }) => {
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error?.message ?? "Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const patch = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await fetch(`/api/admin/banners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [priority, setPriority] = useState("0");

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate(
            { imageUrl: imageUrl.trim(), linkUrl: linkUrl.trim() || undefined, position: "HOME", priority: Number(priority) || 0 },
            { onSuccess: () => { setImageUrl(""); setLinkUrl(""); setPriority("0"); } },
          );
        }}
        className="space-y-3 rounded-lg border border-slate-200 p-4"
      >
        <div className="text-sm font-medium">New home banner</div>
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="Link URL (optional)" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input value={priority} onChange={(e) => setPriority(e.target.value)} placeholder="Priority" className="w-28 rounded-md border border-slate-300 px-3 py-2 text-sm" />
        {create.isError && <p className="text-sm text-red-600">{(create.error as Error).message}</p>}
        <Button type="submit" disabled={create.isPending || !imageUrl.trim()}>Add banner</Button>
      </form>

      {isLoading || !data ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : data.length === 0 ? (
        <p className="text-sm text-slate-500">No banners.</p>
      ) : (
        <div className="space-y-3">
          {data.map((b) => (
            <div key={b.id} className="flex items-center gap-4 rounded-lg border border-slate-200 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.imageUrl} alt="" className="h-12 w-24 rounded object-cover" />
              <div className="flex-1 text-xs text-slate-500">
                {b.position} · priority {b.priority}
                {b.linkUrl ? ` · ${b.linkUrl}` : ""}
              </div>
              <button
                onClick={() => patch.mutate({ id: b.id, isActive: !b.isActive })}
                className={`rounded px-2 py-1 text-xs ${b.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}
              >
                {b.isActive ? "Active" : "Hidden"}
              </button>
              <button onClick={() => del.mutate(b.id)} className="text-xs text-red-500 hover:underline">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
