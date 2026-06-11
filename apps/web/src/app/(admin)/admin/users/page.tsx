import { UserManager } from "@/components/admin/user-manager";

export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="mt-1 text-sm text-slate-500">Manage buyers, sellers, and resellers.</p>
      </header>
      <UserManager />
    </div>
  );
}
