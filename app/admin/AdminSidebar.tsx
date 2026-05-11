"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, Archive, ShoppingBag, Settings, MessageCircle, Users, ChevronRight, LogOut, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const nav = [
  { href: "/admin",           label: "Dashboard",   icon: LayoutDashboard, badge: null },
  { href: "/admin/products",  label: "Sản phẩm",    icon: Package,         badge: null },
  { href: "/admin/accounts",  label: "Kho acc",     icon: Archive,         badge: null },
  { href: "/admin/orders",    label: "Đơn hàng",    icon: ShoppingBag,     badge: null },
  { href: "/admin/topup",     label: "Nạp tiền",    icon: Wallet,          badge: null },
  { href: "/admin/customers", label: "Khách hàng",  icon: Users,           badge: null },
  { href: "/admin/settings",  label: "Cài đặt",     icon: Settings,        badge: null },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-gray-950 min-h-[calc(100vh-4rem)]">
      {/* Logo */}
      <div className="px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-400 shadow-lg shadow-emerald-900/50">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-black text-white tracking-tight">WeChat Shop</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">Admin Panel</p>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-gray-900 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">Quản trị viên</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "text-gray-500 hover:bg-gray-900 hover:text-gray-300"
              }`}
            >
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                active
                  ? "bg-emerald-500 shadow-md shadow-emerald-900/50"
                  : "bg-gray-900 group-hover:bg-gray-800"
              }`}>
                <Icon className={`h-3.5 w-3.5 ${active ? "text-white" : "text-gray-500 group-hover:text-gray-300"}`} />
              </div>
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="h-3.5 w-3.5 text-emerald-500/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 space-y-2">
        <button
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 transition-all hover:bg-red-500/10 hover:text-red-400"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900 transition-all group-hover:bg-red-500/20">
            <LogOut className="h-3.5 w-3.5 group-hover:text-red-400" />
          </div>
          <span>Đăng xuất</span>
        </button>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3">
          <p className="text-xs font-semibold text-gray-400">WeChat Shop VN</p>
          <p className="mt-0.5 text-[10px] text-gray-600">v2.0 · {new Date().getFullYear()}</p>
        </div>
      </div>
    </aside>
  );
}
