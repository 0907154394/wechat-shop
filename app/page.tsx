import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/utils";
import type { Product } from "@/lib/types";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("price");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Hero */}
      <section className="mb-16 text-center">
        <div className="mb-4 inline-block rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-700">
          Giao hàng tự động sau thanh toán
        </div>
        <h1 className="mb-4 text-4xl font-bold text-gray-900">
          Mua tài khoản WeChat <br />
          <span className="text-green-600">uy tín, giao ngay</span>
        </h1>
        <p className="mx-auto max-w-xl text-lg text-gray-500">
          Tài khoản WeChat chính hãng, xác thực số điện thoại. Thanh toán qua chuyển khoản ngân hàng,
          nhận tài khoản ngay lập tức.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/products">
            <Button size="lg">Xem sản phẩm</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">Đăng ký ngay</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mb-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          { icon: "⚡", title: "Giao hàng tức thì", desc: "Tài khoản giao tự động sau khi hệ thống xác nhận thanh toán" },
          { icon: "🏦", title: "Thanh toán ngân hàng VN", desc: "Hỗ trợ MB Bank, Vietcombank, Techcombank, ACB và hầu hết ngân hàng" },
          { icon: "🛡️", title: "Đảm bảo chất lượng", desc: "Tài khoản đã kiểm tra, có backup email và số điện thoại đi kèm" },
        ].map((f) => (
          <Card key={f.title} className="text-center">
            <CardContent className="pt-6">
              <div className="mb-3 text-4xl">{f.icon}</div>
              <h3 className="mb-2 font-semibold text-gray-900">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Products */}
      <section>
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Sản phẩm nổi bật</h2>
        {!products || products.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center text-gray-400">
            Chưa có sản phẩm. Admin hãy thêm sản phẩm trong trang quản trị.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(products as Product[]).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="flex flex-col">
      <CardContent className="flex-1 pt-6">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
          💬
        </div>
        <h3 className="mb-1 font-semibold text-gray-900">{product.name}</h3>
        <p className="mb-3 text-sm text-gray-500 line-clamp-2">{product.description}</p>
        <p className="text-xl font-bold text-green-600">{formatVND(product.price)}</p>
        <p className="mt-1 text-xs text-gray-400">
          {product.stock > 0 ? `Còn ${product.stock} acc` : "Hết hàng"}
        </p>
      </CardContent>
      <CardFooter>
        <Link href={`/products/${product.id}`} className="w-full">
          <Button
            className="w-full"
            disabled={product.stock === 0}
          >
            {product.stock === 0 ? "Hết hàng" : "Mua ngay"}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
