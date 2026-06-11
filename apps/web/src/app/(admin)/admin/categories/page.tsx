import { CategoryManager } from "@/components/admin/category-manager";

export const dynamic = "force-dynamic";

export default function AdminCategoriesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Categories</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage the category tree (up to 3 levels deep).
        </p>
      </header>
      <CategoryManager />
    </div>
  );
}
