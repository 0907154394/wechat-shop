export const dynamic = "force-dynamic";
import { createAdminClient } from "@/lib/supabase/server";
import { Users } from "lucide-react";
import { revalidatePath } from "next/cache";
import { CustomerTable } from "./CustomerTable";

async function toggleBanAction(formData: FormData) {
  "use server";
  const userId = formData.get("user_id") as string;
  const isBanned = formData.get("is_banned") === "true";
  const supabase = await createAdminClient();
  await supabase.auth.admin.updateUserById(userId, {
    ban_duration: isBanned ? "none" : "87600h",
  });
  revalidatePath("/admin/customers");
}

export default async function CustomersPage() {
  const supabase = await createAdminClient();

  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 500 });
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e: string) => e.trim());

  const customers = users
    .filter((u: any) => !adminEmails.includes(u.email ?? ""))
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const [{ data: orders }, { data: credits }] = await Promise.all([
    supabase.from("orders").select("user_id, amount, status"),
    supabase.from("user_credits").select("user_id, balance"),
  ]);

  const statsMap: Record<string, { total: number; spent: number }> = {};
  for (const o of orders ?? []) {
    if (!statsMap[o.user_id]) statsMap[o.user_id] = { total: 0, spent: 0 };
    statsMap[o.user_id].total += 1;
    if (o.status === "delivered") statsMap[o.user_id].spent += o.amount;
  }

  const balanceMap: Record<string, number> = {};
  for (const c of credits ?? []) {
    balanceMap[c.user_id] = Number(c.balance);
  }

  const rows = customers.map((u: any) => ({
    ...u,
    stats: statsMap[u.id] ?? { total: 0, spent: 0 },
    balance: balanceMap[u.id] ?? 0,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Khách hàng</h1>
          <p className="mt-1 text-sm text-gray-500">{customers.length} tài khoản đã đăng ký</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-400 shadow-lg">
          <Users className="h-6 w-6 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Tổng khách",  value: customers.length,                                              color: "bg-blue-50 text-blue-700"    },
          { label: "Đã mua hàng", value: customers.filter((u: any) => statsMap[u.id]?.total > 0).length, color: "bg-emerald-50 text-emerald-700" },
          { label: "Có số dư",    value: Object.values(balanceMap).filter(b => b > 0).length,            color: "bg-violet-50 text-violet-700"  },
          { label: "Bị khoá",     value: customers.filter((u: any) => u.banned_until).length,           color: "bg-red-50 text-red-700"      },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-2xl ${color} px-5 py-4`}>
            <p className="text-2xl font-black">{value}</p>
            <p className="text-sm font-medium opacity-80">{label}</p>
          </div>
        ))}
      </div>

      <CustomerTable rows={rows} toggleBanAction={toggleBanAction} />
    </div>
  );
}
