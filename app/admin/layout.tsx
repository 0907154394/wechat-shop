import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="w-48 shrink-0 border-r border-gray-200 bg-white p-4">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Admin</p>
        <nav className="space-y-1">
          {[
            { href: "/admin", label: "Dashboard" },
            { href: "/admin/products", label: "Sản phẩm" },
            { href: "/admin/accounts", label: "Kho acc" },
            { href: "/admin/orders", label: "Đơn hàng" },
            { href: "/admin/settings", label: "Cài đặt ngân hàng" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
