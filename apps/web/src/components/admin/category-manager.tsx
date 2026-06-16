"use client";

import { InlineLoader } from "@/components/loading-screen";

import { useState } from "react";
import { Button } from "@bazaarx/ui";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  flattenCategories,
} from "@/hooks/use-categories";
import type { CategoryNode } from "@bazaarx/types";

function Tree({ nodes, onDelete }: { nodes: CategoryNode[]; onDelete: (id: string) => void }) {
  return (
    <ul className="space-y-1">
      {nodes.map((n) => (
        <li key={n.id}>
          <div className="flex items-center justify-between rounded border border-slate-200 px-3 py-1.5">
            <span className="text-sm">
              {n.name} <span className="text-xs text-slate-400">L{n.level}</span>
            </span>
            <button
              onClick={() => onDelete(n.id)}
              className="text-xs text-red-500 hover:underline"
            >
              Delete
            </button>
          </div>
          {n.children.length > 0 && (
            <div className="ml-5 mt-1 border-l border-slate-100 pl-3">
              <Tree nodes={n.children} onDelete={onDelete} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function CategoryManager() {
  const { data: tree, isLoading } = useCategories();
  const create = useCreateCategory();
  const del = useDeleteCategory();

  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");

  const options = tree ? flattenCategories(tree).filter((o) => o.level < 3) : [];

  function add() {
    create.mutate(
      { name: name.trim(), parentId: parentId || null },
      { onSuccess: () => setName("") },
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <section>
        <h2 className="mb-3 text-lg font-medium">Add category</h2>
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">— Top level —</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <Button disabled={create.isPending || name.trim().length === 0} onClick={add}>
            {create.isPending ? "Adding…" : "Add category"}
          </Button>
          {create.isError && (
            <p className="text-sm text-red-600">{(create.error as Error).message}</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Category tree</h2>
        {isLoading ? (
          <InlineLoader />
        ) : tree && tree.length > 0 ? (
          <Tree nodes={tree} onDelete={(id) => del.mutate(id)} />
        ) : (
          <p className="text-sm text-slate-500">No categories yet.</p>
        )}
        {del.isError && <p className="mt-2 text-sm text-red-600">{(del.error as Error).message}</p>}
      </section>
    </div>
  );
}
