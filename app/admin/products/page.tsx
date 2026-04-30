export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Quản lý sản phẩm</h1>

      {/* Add product form */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="mb-4 font-semibold text-gray-900">Thêm sản phẩm mới</h2>
          <form action={addProductAction} className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Tên sản phẩm</label>
              <input
                name="name"
                required
                placeholder="VD: WeChat Account CN - Xác thực SĐT"
                className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Giá (VND)</label>
              <input
                name="price"
                type="number"
                required
                min="1000"
                placeholder="50000"
                className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">Mô tả</label>
              <textarea
                name="description"
                rows={3}
                placeholder="Mô tả chi tiết sản phẩm..."
                className="rounded-lg border border-gray-300 p-3 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Thêm sản phẩm</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Products table */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 font-semibold text-gray-900">Danh sách sản phẩm</h2>
          <div className="space-y-3">
            {products?.map((product: any) => (
              <div key={product.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.description}</p>
                  <p className="mt-1 text-sm text-green-600 font-medium">{formatVND(product.price)} · {product.stock} acc</p>
                </div>
                <form action={toggleProductAction}>
                  <input type="hidden" name="id" value={product.id} />
                  <input type="hidden" name="is_active" value={product.is_active ? "true" : "false"} />
                  <Button
                    type="submit"
                    variant={product.is_active ? "outline" : "default"}
                    size="sm"
                  >
                    {product.is_active ? "Ẩn" : "Hiện"}
                  </Button>
                </form>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function addProductAction(formData: FormData) {
  "use server";
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = await createAdminClient();

  await supabase.from("products").insert({
    name: formData.get("name") as string,
    description: formData.get("description") as string || null,
    price: parseInt(formData.get("price") as string),
    stock: 0,
    is_active: true,
  });

  revalidatePath("/admin/products");
}

async function toggleProductAction(formData: FormData) {
  "use server";
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = await createAdminClient();

  const id = formData.get("id") as string;
  const currentActive = formData.get("is_active") === "true";

  await supabase.from("products").update({ is_active: !currentActive }).eq("id", id);
  revalidatePath("/admin/products");
}
