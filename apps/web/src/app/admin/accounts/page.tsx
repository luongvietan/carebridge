import { getPortalT } from "@/lib/i18n/portal-server";
import { Tr } from "@/components/portal-locale";
import { TableScroll } from "@/components/table-scroll";
import { AdminTableHeader } from "@/components/admin-table-header";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountStatusControl } from "@/components/account-status-control";
import { AnonymiseUserButton } from "@/components/anonymise-user-button";
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
  const t = await getPortalT();

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
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold"><Tr>{"All accounts"}</Tr></h1>
      <p className="mt-2 text-sm text-ink"><Tr>{"View and manage account status across professionals, clients and organisations."}</Tr></p>

      <form method="GET" className="mt-6 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1 text-sm text-ink"><Tr>{"Account type"}</Tr><Select
            name="account_type"
            aria-label={t("Account type")}
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
          className="rounded-full bg-brand-strong px-4 py-1.5 text-sm text-white hover:bg-brand-strong-hover"
        ><Tr>{"Apply filter"}</Tr></button>
        {accountTypeFilter && (
          <Link href="/admin/accounts" className="text-sm text-brand-strong hover:underline"><Tr>{"Clear filter"}</Tr></Link>
        )}
      </form>

      <TableScroll className="mt-8 rounded-2xl border border-line shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
        <table className="w-full text-sm">
          <AdminTableHeader>
            <tr>
              <th className="p-3 font-medium"><Tr>{"Email"}</Tr></th>
              <th className="p-3 font-medium"><Tr>{"Account type"}</Tr></th>
              <th className="p-3 font-medium"><Tr>{"Account status"}</Tr></th>
              <th className="p-3 font-medium"><Tr>{"Actions"}</Tr></th>
            </tr>
          </AdminTableHeader>
          <tbody className="divide-y divide-line">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="p-3">
                  {user.account_type === "private_client" || user.account_type === "organisation" ? (
                    <Link href={`/admin/accounts/${user.id}`} className="text-brand-strong hover:underline">
                      {user.email}
                    </Link>
                  ) : (
                    user.email
                  )}
                </td>
                <td className="p-3">
                  <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-ink">
                    {formatLabel(user.account_type)}
                    <Tr>{user.is_founder ? " (founder)" : ""}</Tr>
                  </span>
                </td>
                <td className="p-3">
                  <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-ink">
                    {formatLabel(user.account_status)}
                  </span>
                </td>
                <td className="p-3">
                  {isProtectedAccount(user) ? (
                    <span className="text-ink">—</span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      <AccountStatusControl userId={user.id} current={user.account_status} />
                      <AnonymiseUserButton userId={user.id} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="p-6 text-sm text-ink"><Tr>{"No accounts match this filter."}</Tr></p>
        )}
      </TableScroll>
    </main>
  );
}
