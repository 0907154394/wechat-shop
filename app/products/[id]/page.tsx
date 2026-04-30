export const dynamic = "force-dynamic";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatVND, generateOrderCode, buildVietQRUrl } from "@/lib/utils";
import type { Product } from "@/lib/types";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (!product) notFound();

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">{(product as Product).name}</h1>
        <p className="text-gray-500">{(product as Product).description}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <p className="text-sm text-gray-500">Giá</p>
              <p className="text-3xl font-bold text-green-600">{formatVND((product as Product).price)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tồn kho</p>
              <p className="font-medium text-gray-900">
                {(product as Product).stock > 0 ? `${(product as Product).stock} tài khoản` : "Hết hàng"}
              </p>
            </div>
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              ✓ Giao hàng tự động sau thanh toán<br />
              ✓ Có số điện thoại & email backup đi kèm<br />
              ✓ Hỗ trợ nếu có vấn đề trong 24h
            </div>

            {(product as Product).stock > 0 && (
              <form action={createOrderAction}>
                <input type="hidden" name="product_id" value={product.id} />
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={!user}
                >
                  {user ? "Mua ngay" : "Đăng nhập để mua"}
                </Button>
                {!user && (
                  <p className="mt-2 text-center text-xs text-gray-500">
                    <a href="/login" className="text-green-600 underline">Đăng nhập</a> để tiến hành mua hàng
                  </p>
                )}
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <h3 className="font-semibold text-gray-900">Hướng dẫn mua hàng</h3>
            {[
              "Đăng nhập hoặc đăng ký tài khoản",
              'Nhấn "Mua ngay" để tạo đơn hàng',
              "Chuyển khoản đúng số tiền & nội dung",
              "Hệ thống tự xác nhận & giao tài khoản",
              "Kiểm tra email hoặc trang đơn hàng",
            ].map((step, i) => (
              <div key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-600">{step}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function createOrderAction(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const productId = formData.get("product_id") as string;
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (!product || product.stock < 1) redirect("/products");

  const orderCode = generateOrderCode();

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      product_id: productId,
      quantity: 1,
      amount: product.price,
      order_code: orderCode,
      status: "pending",
    })
    .select()
    .single();

  if (error || !order) redirect("/products");

  redirect(`/orders/${order.id}/pay`);
}
