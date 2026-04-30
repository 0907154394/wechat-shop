"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // Lazy init supabase only in browser
  const supabaseRef = useRef<ReturnType<typeof import("@/lib/supabase/client").createClient> | null>(null);

  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      supabaseRef.current = supabase;

      supabase.auth.getUser().then(({ data }) => setUser(data.user));
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
        setUser(session?.user ?? null);
      });
      return () => subscription.unsubscribe();
    });
  }, []);

  async function handleSignOut() {
    if (!supabaseRef.current) return;
    await supabaseRef.current.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-green-600 text-lg">
          <span className="text-2xl">💬</span>
          WeChat Shop VN
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/products" className="hidden text-sm text-gray-600 hover:text-gray-900 sm:block">
            Sản phẩm
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
              >
                <span className="h-6 w-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center">
                  {user.email?.[0].toUpperCase()}
                </span>
                <span className="hidden sm:block max-w-[120px] truncate">{user.email}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  <Link
                    href="/orders"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    Đơn hàng của tôi
                  </Link>
                  <button
                    onClick={() => { setMenuOpen(false); handleSignOut(); }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm">Đăng nhập</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
