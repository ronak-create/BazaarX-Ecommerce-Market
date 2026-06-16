"use client";

import { InlineLoader } from "@/components/loading-screen";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { formatDateTime } from "@bazaarx/utils";
import type { AdminUserDTO, Paginated } from "@bazaarx/types";

const ROLES = ["", "BUYER", "SELLER", "RESELLER", "ADMIN"];

export function UserManager() {
  const qc = useQueryClient();
  const [role, setRole] = useState("");
  const [q, setQ] = useState("");
  const key = ["admin", "users", role, q] as const;

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async (): Promise<Paginated<AdminUserDTO>> => {
      const params = new URLSearchParams();
      if (role) params.set("role", role);
      if (q) params.set("q", q);
      const res = await fetch(`/api/admin/users?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const ban = useMutation({
    mutationFn: async ({ id, banned }: { id: string; banned: boolean }) => {
      await fetch(`/api/admin/users/${id}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banned }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const suspend = useMutation({
    mutationFn: async ({ id, suspended }: { id: string; suspended: boolean }) => {
      await fetch(`/api/admin/users/${id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspended }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name/email" className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          {ROLES.map((r) => (
            <option key={r || "all"} value={r}>{r || "All roles"}</option>
          ))}
        </select>
      </div>

      {isLoading || !data ? (
        <InlineLoader />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
              <th className="py-2">User</th>
              <th>Role</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((u) => (
              <tr key={u.id} className="border-b border-slate-100">
                <td className="py-2">
                  <div className="font-medium">{u.name ?? "—"}</div>
                  <div className="text-xs text-slate-500">{u.email ?? u.phone ?? u.id.slice(0, 8)}</div>
                </td>
                <td>
                  {u.role}
                  {u.sellerStatus ? <span className="ml-1 text-xs text-slate-400">({u.sellerStatus})</span> : null}
                </td>
                <td className="text-xs text-slate-500">{formatDateTime(u.createdAt)}</td>
                <td className="text-right">
                  {u.role !== "ADMIN" && (
                    <div className="flex justify-end gap-2">
                      {u.sellerStatus && (
                        <button
                          onClick={() => suspend.mutate({ id: u.id, suspended: u.sellerStatus !== "SUSPENDED" })}
                          className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                        >
                          {u.sellerStatus === "SUSPENDED" ? "Reinstate" : "Suspend"}
                        </button>
                      )}
                      <button
                        onClick={() => ban.mutate({ id: u.id, banned: !u.isBanned })}
                        className={`rounded border px-2 py-1 text-xs ${u.isBanned ? "border-slate-300 hover:bg-slate-50" : "border-red-300 text-red-600 hover:bg-red-50"}`}
                      >
                        {u.isBanned ? "Unban" : "Ban"}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
