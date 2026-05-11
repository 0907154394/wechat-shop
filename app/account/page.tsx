"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { User, ShoppingBag, KeyRound, LogOut, ChevronRight, Shield, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/LanguageContext";
import { tr } from "@/lib/i18n";

export default function AccountPage() {
  const router = useRouter();
  const { lang } = useLang();
  const T = tr(lang).accountPage;

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    async function loadUser() {
      const { createClient } = await import("@/lib/supabase/client");
      const sb = createClient();
      setSupabase(sb);
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        setEmail(user.email ?? "");
        setFullName(user.user_metadata?.full_name ?? "");
        setUsername(user.user_metadata?.username ?? "");
      }
    }
    loadUser();
  }, []);

  async function handleSave(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName, username: username.toLowerCase() },
    });
    if (error) setError(error.message);
    else setSuccess(T.saveSuccess);
    setLoading(false);
  }

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const initials = fullName
    ? fullName.trim().split(" ").slice(-2).map((w: string) => w[0]).join("").toUpperCase()
    : email ? email[0].toUpperCase() : "?";

  const quickLinks = [
    { href: "/account/topup",    icon: Wallet,      label: T.linkTopup,    sub: T.linkTopupSub,    from: "from-emerald-500", to: "to-green-400",  shadow: "shadow-emerald-200" },
    { href: "/orders",           icon: ShoppingBag, label: T.linkOrders,   sub: T.linkOrdersSub,   from: "from-violet-500",  to: "to-purple-400", shadow: "shadow-violet-200"  },
    { href: "/account/password", icon: KeyRound,    label: T.linkPassword, sub: T.linkPasswordSub, from: "from-blue-500",    to: "to-indigo-400", shadow: "shadow-blue-200"    },
    { href: "/account/security", icon: Shield,      label: T.linkSecurity, sub: T.linkSecuritySub, from: "from-rose-500",    to: "to-pink-400",   shadow: "shadow-rose-200"    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dark header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 px-6 py-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white">{T.title}</h1>
            <p className="mt-1 text-sm text-slate-400">{T.subtitle}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-400 shadow-lg shadow-emerald-900/50">
            <User className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="space-y-5">

          {/* Profile card */}
          <div className="flex items-center gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-400 shadow-md shadow-emerald-200">
              <span className="text-xl font-black text-white">{initials}</span>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{fullName || username || "—"}</p>
              {username && <p className="mt-0.5 font-mono text-sm text-gray-400">@{username}</p>}
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map(({ href, icon: Icon, label, sub, from, to, shadow }) => (
              <Link key={href} href={href}>
                <div className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${from} ${to} shadow-sm ${shadow}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{label}</p>
                    <p className="text-xs text-gray-400">{sub}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-emerald-500" />
                </div>
              </Link>
            ))}
          </div>

          {/* Edit form */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{T.sectionInfo}</p>
            </div>
            <div className="p-5">
              {error   && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
              {success && <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

              <form onSubmit={handleSave} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">{T.usernameLabel}</label>
                  <input
                    required value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className="h-11 rounded-xl border border-gray-200 px-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                  <p className="text-xs text-gray-400">{T.usernameHint}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">{T.fullNameLabel}</label>
                  <input
                    required value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="h-11 rounded-xl border border-gray-200 px-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <Button type="submit" className="w-full" loading={loading}>{T.saveBtn}</Button>
              </form>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-medium text-red-500 shadow-sm transition-all hover:border-red-200 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            {T.signOut}
          </button>
        </div>
      </div>
    </div>
  );
}
