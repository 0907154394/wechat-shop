"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "./ui/button";
import {
  ChevronDown, LogOut, MessageCircle, KeyRound,
  User, ShoppingBag, LayoutDashboard, Menu, X, Globe,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { tr } from "@/lib/i18n";
import { useLang } from "@/lib/LanguageContext";
import { NotificationBell } from "./NotificationBell";
import { createClient } from "@/lib/supabase/client";

export function Navbar({ isAdmin }: { isAdmin?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { lang, setLang } = useLang();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const supabaseRef = useRef<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const T = tr(lang);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabaseRef.current = supabase;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    if (!supabaseRef.current) return;
    await supabaseRef.current.auth.signOut();
    setMenuOpen(false);
    setMobileOpen(false);
    router.push("/");
    router.refresh();
  }

  if (pathname === "/login") return null;

  const isTransparent = !scrolled && pathname === "/";
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.username || user?.email || "";
  const initials = displayName
    ? displayName.trim().split(" ").slice(-2).map((w: string) => w[0]).join("").toUpperCase()
    : "?";

  const navLinks = isAdmin
    ? []
    : [
        { href: "/", label: T.nav.home },
        { href: "/products", label: T.nav.products },
        ...(user ? [
          { href: "/orders", label: T.nav.orders },
          { href: "/account/topup", label: T.nav.topup },
        ] : []),
      ];

  return (
    <>
      {/* Announcement bar — scrolls away with page */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 px-4 py-2.5">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-6 text-xs font-medium text-slate-300">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-white">{T.announce.a1}</span>
          </span>
          <span className="hidden text-slate-600 sm:block">·</span>
          <span className="hidden items-center gap-2 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-white">{T.announce.a2}</span>
          </span>
          <span className="hidden text-slate-600 sm:block">·</span>
          <span className="hidden items-center gap-2 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-white">{T.announce.a3}</span>
          </span>
        </div>
      </div>

      {/* Sticky navbar only */}
      <div className="sticky top-0 z-50">
      {/* Main navbar */}
      <nav className={`relative transition-all duration-500 ${
        isTransparent
          ? "bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-950"
          : "bg-white/95 backdrop-blur-md shadow-lg shadow-gray-200/60"
      }`}>
        {/* Gradient bottom border — only when scrolled */}
        <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent transition-opacity duration-500 ${isTransparent ? "opacity-0" : "opacity-100"}`} />

        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3" onClick={() => setMobileOpen(false)}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-md shadow-emerald-900/40 transition-shadow group-hover:shadow-lg">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className={`text-xl font-black tracking-tight transition-colors duration-300 ${isTransparent ? "text-white" : "text-gray-900"}`}>
                WeChat <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">Shop</span>
              </span>
              <span className={`text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${isTransparent ? "text-slate-400" : "text-gray-400"}`}>Vietnam</span>
            </div>
          </Link>

          {/* Desktop nav links */}
          {navLinks.length > 0 && (
            <div className="hidden items-center gap-1 md:flex">
              {navLinks.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                      isTransparent
                        ? active
                          ? "bg-white/15 text-white font-semibold ring-1 ring-white/30"
                          : "text-slate-300 hover:text-white hover:bg-white/8"
                        : active
                          ? "bg-emerald-50 text-emerald-700 font-semibold ring-1 ring-emerald-100"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
              {isAdmin && (
                <Link href="/admin" className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  pathname.startsWith("/admin")
                    ? isTransparent ? "text-white" : "text-emerald-600"
                    : isTransparent ? "text-slate-300 hover:text-white" : "text-gray-600 hover:text-gray-900"
                }`}>
                  {T.nav.admin}
                  {pathname.startsWith("/admin") && (
                    <span className={`absolute bottom-0 left-3 right-3 h-0.5 rounded-full ${isTransparent ? "bg-emerald-400" : "bg-emerald-500"}`} />
                  )}
                </Link>
              )}
            </div>
          )}

          {/* Right: auth */}
          <div className="flex items-center gap-2">
            {/* Language dropdown */}
            <div className="relative hidden sm:block" ref={langRef}>
              <button
                onClick={() => setLangOpen(v => !v)}
                className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                  isTransparent
                    ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                {lang === "VI" ? "Tiếng Việt" : lang === "EN" ? "English" : "中文"}
                <ChevronDown className={`h-3 w-3 transition-transform ${langOpen ? "rotate-180" : ""}`} />
              </button>

              {langOpen && (
                <div className="absolute right-0 top-full z-50 mt-1.5 w-36 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                  {([
                    { code: "VI", label: "Tiếng Việt", flag: "🇻🇳" },
                    { code: "EN", label: "English",    flag: "🇺🇸" },
                    { code: "ZH", label: "中文",        flag: "🇨🇳" },
                  ] as const).map(({ code, label, flag }) => (
                    <button
                      key={code}
                      onClick={() => { setLang(code); setLangOpen(false); }}
                      className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-semibold transition-colors hover:bg-emerald-50 hover:text-emerald-700 ${
                        lang === code ? "bg-emerald-50 text-emerald-700" : "text-gray-700"
                      }`}
                    >
                      <span className="text-base">{flag}</span>
                      {label}
                      {lang === code && <span className="ml-auto text-emerald-500">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <NotificationBell isTransparent={isTransparent} />
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                    isTransparent
                      ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-xs font-bold text-white">
                    {initials}
                  </div>
                  <span className={`hidden max-w-[120px] truncate font-medium sm:block transition-colors duration-300 ${isTransparent ? "text-white" : "text-gray-700"}`}>
                    {user?.user_metadata?.username || user?.user_metadata?.full_name?.split(" ").pop() || user?.email?.split("@")[0]}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl shadow-gray-200/50">
                    <div className="border-b border-gray-100 px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">
                        {user?.user_metadata?.full_name || "Tài khoản"}
                      </p>
                      <p className="truncate text-xs text-gray-400">{user?.email}</p>
                    </div>
                    {!isAdmin && (
                      <>
                        <Link href="/account" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                          <User className="h-4 w-4 text-gray-400" /> {T.auth.account}
                        </Link>
                        <Link href="/orders" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                          <ShoppingBag className="h-4 w-4 text-gray-400" /> {T.auth.myOrders}
                        </Link>
                      </>
                    )}
                    {isAdmin && (
                      <>
                        <Link href="/admin" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                          <LayoutDashboard className="h-4 w-4 text-gray-400" /> {T.nav.admin}
                        </Link>
                        <Link href="/account/password" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                          <KeyRound className="h-4 w-4 text-gray-400" /> {T.auth.changePassword}
                        </Link>
                      </>
                    )}
                    <div className="border-t border-gray-100" />
                    <button onClick={handleSignOut} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50">
                      <LogOut className="h-4 w-4" /> {T.auth.signout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block">
                  <Button size="sm" variant="outline" className={`rounded-xl transition-colors duration-300 ${isTransparent ? "border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white" : ""}`}>{T.auth.login}</Button>
                </Link>
                <Link href="/login?tab=register">
                  <Button size="sm" className="rounded-xl shadow-sm shadow-emerald-900/40">{T.auth.register}</Button>
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              className="ml-1 rounded-xl p-2 text-gray-500 hover:bg-gray-100 md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-gray-100 bg-white px-4 pb-4 pt-3 md:hidden">
            <div className="space-y-1">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    pathname === href ? "bg-emerald-50 text-emerald-700 font-semibold" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </Link>
              ))}
              {isAdmin && (
                <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <LayoutDashboard className="h-4 w-4" /> {T.nav.admin}
                </Link>
              )}
              {!user && (
                <Link href="/login" onClick={() => setMobileOpen(false)} className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  {T.auth.login}
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
      </div>
    </>
  );
}
