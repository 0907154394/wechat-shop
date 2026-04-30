import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/utils";
import type { Product } from "@/lib/types";

export const revalidate = 60;

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("price");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Tất cả sản phẩm</h1>
      <p className="mb-8 text-gray-500">Tài khoản WeChat xác thực, giao ngay sau thanh toán</p>

      {!products || products.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-20 text-center text-gray-400">
          Chưa có sản phẩm nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(products as Product[]).map((product) => (
            <Card key={product.id} className="flex flex-col">
              <CardContent className="flex-1 pt-6">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
                  💬
                </div>
                <h3 className="mb-1 font-semibold text-gray-900">{product.name}</h3>
                <p className="mb-3 text-sm text-gray-500">{product.description}</p>
                <p className="text-xl font-bold text-green-600">{formatVND(product.price)}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {product.stock > 0 ? `Còn ${product.stock} acc` : "Hết hàng"}
                </p>
              </CardContent>
              <CardFooter>
                <Link href={`/products/${product.id}`} className="w-full">
                  <Button className="w-full" disabled={product.stock === 0}>
                    {product.stock === 0 ? "Hết hàng" : "Xem chi tiết"}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
