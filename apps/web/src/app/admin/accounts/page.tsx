import { redirect } from "next/navigation";
import { AccountStatusControl } from "@/components/account-status-control";
import { requireAdmin } from "@/lib/auth/admin";
import type { AccountStatus } from "@/lib/admin/account-status";
import { createServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/lib/supabase/types";
import { Select } from "@/components/ui/select";

export const dynamic = "force-dynamic";

type AccountType = Database["public"]["Enums"]["account_type"];

type UserRow = {
  id: string;
  email: string;
  account_type: AccountType;
  account_status: AccountStatus;
  is_founder: boolean;
};

const ACCOUNT_TYPES: AccountType[] = [
  "professional",
  "private_client",
  "organisation",
  "admin",
];

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function isProtectedAccount(user: UserRow) {
  return user.account_type === "admin" || user.is_founder;
}

function pickAccountType(
  params: Record<string, string | string[] | undefined>,
): AccountType | undefined {
  const value = params.account_type;
  if (typeof value !== "string" || !value) return undefined;
  return ACCOUNT_TYPES.includes(value as AccountType) ? (value as AccountType) : undefined;
}

export default async function AdminAccountsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await requireAdmin())) redirect("/login");

  const params = await searchParams;
  const accountTypeFilter = pickAccountType(params);
  const admin = createServiceClient();

  let query = admin
    .from("users")
    .select("id, email, account_type, account_status, is_founder")
    .order("account_type", { ascending: true })
    .order("email", { ascending: true });

  if (accountTypeFilter) {
    query = query.eq("account_type", accountTypeFilter);
  }

  const { data } = await query;
  const users = (data ?? []) as UserRow[];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">All accounts</h1>
      <p className="mt-2 text-sm text-[#5b6a62]">
        View and manage account status across professionals, clients and organisations.
      </p>

      <form method="GET" className="mt-6 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1 text-sm text-[#5b6a62]">
          Account type
          <Select
            name="account_type"
            aria-label="Account type"
            defaultValue={accountTypeFilter ?? ""}
            className="w-56"
            options={[
              { value: "", label: "All types" },
              ...ACCOUNT_TYPES.map((type) => ({ value: type, label: formatLabel(type) })),
            ]}
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-[#0c6e4f] px-4 py-1.5 text-sm text-white hover:bg-[#0a5c42]"
        >
          Apply filter
        </button>
        {accountTypeFilter && (
          <a href="/admin/accounts" className="text-sm text-[#198038] hover:underline">
            Clear filter
          </a>
        )}
      </form>

      <div className="mt-8 overflow-x-auto border border-[#dbe7e0]">
        <table className="w-full text-sm">
          <thead className="border-b border-[#dbe7e0] bg-[#f5f7f6] text-left">
            <tr>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Account type</th>
              <th className="p-3 font-medium">Account status</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dbe7e0]">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="p-3">{user.email}</td>
                <td className="p-3">
                  <span className="bg-[#f5f7f6] px-2 py-0.5 text-xs text-[#5b6a62]">
                    {formatLabel(user.account_type)}
                    {user.is_founder ? " (founder)" : ""}
                  </span>
                </td>
                <td className="p-3">
                  <span className="bg-[#f5f7f6] px-2 py-0.5 text-xs text-[#5b6a62]">
                    {formatLabel(user.account_status)}
                  </span>
                </td>
                <td className="p-3">
                  {isProtectedAccount(user) ? (
                    <span className="text-[#5b6a62]">—</span>
                  ) : (
                    <AccountStatusControl userId={user.id} current={user.account_status} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="p-6 text-sm text-[#5b6a62]">No accounts match this filter.</p>
        )}
      </div>
    </main>
  );
}
