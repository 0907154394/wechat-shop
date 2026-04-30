export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";

export default async function AdminAccountsPage() {
  const supabase = await createClient();

  const { data: products } = await supabase.from("products").select("id, name").eq("is_active", true);
  const { data: accounts } = await supabase
    .from("wechat_accounts")
    .select("*, products(name)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Kho tài khoản WeChat</h1>

      {/* Import form */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="mb-4 font-semibold text-gray-900">Nhập acc mới (bulk)</h2>
          <p className="mb-4 text-sm text-gray-500">
            Mỗi dòng một acc. Định dạng: <code className="bg-gray-100 px-1 rounded">username|password|phone|email_backup</code>
          </p>
          <form action={importAccountsAction}>
            <div className="flex flex-col gap-4">
              <select
                name="product_id"
                required
                className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-green-500 focus:outline-none"
              >
                <option value="">Chọn sản phẩm</option>
                {products?.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <textarea
                name="bulk_data"
                required
                rows={8}
                placeholder="username1|password1|+84901234567|backup@email.com&#10;username2|password2|+84901234568|"
                className="w-full rounded-lg border border-gray-300 p-3 text-sm font-mono focus:border-green-500 focus:outline-none"
              />
              <Button type="submit" className="w-full sm:w-auto">Nhập kho</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Accounts table */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 font-semibold text-gray-900">Danh sách acc ({accounts?.length ?? 0})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-left text-gray-500 font-medium">Username</th>
                  <th className="pb-3 text-left text-gray-500 font-medium">Sản phẩm</th>
                  <th className="pb-3 text-left text-gray-500 font-medium">SĐT</th>
                  <th className="pb-3 text-left text-gray-500 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {accounts?.map((acc: any) => (
                  <tr key={acc.id} className="border-b border-gray-50">
                    <td className="py-2 font-mono">{acc.username}</td>
                    <td className="py-2 text-gray-600">{acc.products?.name}</td>
                    <td className="py-2 text-gray-600">{acc.phone_number || "-"}</td>
                    <td className="py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        acc.status === "available" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                      }`}>
                        {acc.status === "available" ? "Còn hàng" : "Đã bán"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function importAccountsAction(formData: FormData) {
  "use server";

  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = await createAdminClient();

  const productId = formData.get("product_id") as string;
  const bulkData = formData.get("bulk_data") as string;

  const lines = bulkData.trim().split("\n").filter(Boolean);
  const rows = lines.map((line) => {
    const parts = line.split("|");
    return {
      product_id: productId,
      username: parts[0]?.trim() || "",
      password: parts[1]?.trim() || "",
      phone_number: parts[2]?.trim() || null,
      backup_email: parts[3]?.trim() || null,
      status: "available",
    };
  }).filter((r) => r.username && r.password);

  if (rows.length > 0) {
    await supabase.from("wechat_accounts").insert(rows);

    // Update product stock
    const { data: product } = await supabase
      .from("products")
      .select("stock")
      .eq("id", productId)
      .single();

    if (product) {
      await supabase
        .from("products")
        .update({ stock: product.stock + rows.length })
        .eq("id", productId);
    }
  }

  revalidatePath("/admin/accounts");
}
