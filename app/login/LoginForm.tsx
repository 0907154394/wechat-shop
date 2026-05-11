"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import { tr } from "@/lib/i18n";

type Tab = "login" | "register";

function validatePassword(p: string) {
  return {
    length: p.length >= 8,
    uppercase: /[A-Z]/.test(p),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
  };
}

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${ok ? "text-emerald-400" : "text-slate-500"}`}>
      <span className="font-bold">{ok ? "✓" : "○"}</span>
      {label}
    </div>
  );
}

export function LoginForm({ initialTab }: { initialTab: Tab }) {
  const { lang } = useLang();
  const T = tr(lang).loginPage;

  const [tab, setTab] = useState<Tab>(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  const pwdRules = validatePassword(regPassword);
  const usernameOk = regUsername.length >= 6 && /^[a-z0-9_]+$/.test(regUsername);
  const confirmOk = regPassword === regConfirm;


  async function getSupabase() {
    const { createClient } = await import("@/lib/supabase/client");
    return createClient();
  }

  async function handleLogin(e: React.SyntheticEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = await getSupabase();

    let email = loginEmail;

    if (!loginEmail.includes("@")) {
      // Fast path: tài khoản mới dùng username@noemail.local
      const { error: fastErr } = await supabase.auth.signInWithPassword({
        email: `${loginEmail.toLowerCase()}@noemail.local`,
        password: loginPassword,
      });
      if (!fastErr) {
        const res = await fetch("/api/check-admin");
        const { isAdmin } = await res.json();
        window.location.href = isAdmin ? "/admin" : "/";
        return;
      }
      // Fallback: tài khoản cũ có email thật
      const res = await fetch("/api/lookup-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginEmail }),
      });
      const data = await res.json();
      if (!data.email) {
        setError(T.errLoginFailed);
        setLoading(false);
        return;
      }
      email = data.email;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password: loginPassword });
    if (error) {
      setError(T.errLoginFailed);
      setLoading(false);
    } else {
      const res = await fetch("/api/check-admin");
      const { isAdmin } = await res.json();
      window.location.href = isAdmin ? "/admin" : "/";
    }
  }

  async function handleRegister(e: React.SyntheticEvent) {
    e.preventDefault();
    setError("");
    if (!usernameOk) return setError(T.errUsername);
    if (!pwdRules.length || !pwdRules.uppercase || !pwdRules.special)
      return setError(T.errPasswordReqs);
    if (!confirmOk) return setError(T.errPasswordMatch);

    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: regUsername, password: regPassword }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (data.error === "username_taken") return setError(T.errUsernameTaken);
      if (data.error === "invalid_username") return setError(T.errUsername);
      if (data.error === "weak_password") return setError(T.errPasswordReqs);
      return setError(data.error ?? "Error");
    }

    setSuccess(T.successRegister);
  }

  function switchTab(t: Tab) {
    setTab(t);
    setError("");
    setSuccess("");
  }

  const switchLink = tab === "login"
    ? <p className="mt-5 text-center text-sm text-slate-400">{T.noAccount}{" "}<button onClick={() => switchTab("register")} className="font-semibold text-emerald-400 hover:underline">{T.registerNow}</button></p>
    : <p className="mt-5 text-center text-sm text-slate-400">{T.haveAccount}{" "}<button onClick={() => switchTab("login")} className="font-semibold text-emerald-400 hover:underline">{T.loginNow}</button></p>;

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 px-4 py-12">
      <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-green-400/10 blur-3xl" />

      <Link href="/" className="group absolute left-6 top-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-medium text-slate-300 shadow-lg backdrop-blur-md transition-all duration-200 hover:border-emerald-500/50 hover:bg-emerald-500/15 hover:text-white hover:shadow-emerald-900/30">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 transition-all group-hover:bg-emerald-500/30">
          <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        </span>
        {T.backHome}
      </Link>

      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3 transition-opacity hover:opacity-80">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 shadow-lg shadow-emerald-900/50">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-black text-white">
              WeChat <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">Shop</span>
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Vietnam</span>
          </div>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-white">
              {tab === "login" ? T.loginTab : T.registerTab}
            </h2>
            {tab === "login" && <p className="mt-1 text-sm text-slate-400">{T.welcomeBack}</p>}
          </div>

          {error   && <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
          {success && <div className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{success}</div>}

          {/* ── LOGIN ── */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-300">{T.emailOrUsername}</label>
                <input
                  type="text" required autoComplete="username"
                  value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                  className="h-11 rounded-xl border border-white/20 bg-white/10 px-4 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-300">{T.password}</label>
                <input
                  type="password" required autoComplete="current-password"
                  value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                  className="h-11 rounded-xl border border-white/20 bg-white/10 px-4 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <Button type="submit" size="lg" className="w-full" loading={loading}>{T.loginBtn}</Button>
            </form>
          )}

          {/* ── REGISTER ── */}
          {tab === "register" && !success && (
            <form onSubmit={handleRegister} className="space-y-4" autoComplete="off">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-300">{T.username}</label>
                <input
                  required autoComplete="off"
                  value={regUsername}
                  onChange={e => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  className={`h-11 rounded-xl border bg-white/10 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${
                    regUsername && !usernameOk ? "border-red-400/50 focus:ring-red-500/20" : "border-white/20 focus:border-emerald-500 focus:ring-emerald-500/20"
                  }`}
                />
                <p className={`text-xs ${regUsername && !usernameOk ? "text-red-400" : "text-slate-500"}`}>{T.usernameHint}</p>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-300">{T.password}</label>
                <input
                  type="password" required autoComplete="new-password"
                  value={regPassword} onChange={e => setRegPassword(e.target.value)}
                  className="h-11 rounded-xl border border-white/20 bg-white/10 px-4 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                {regPassword && (
                  <div className="mt-1 space-y-1 rounded-lg bg-white/5 p-2.5">
                    <Rule ok={pwdRules.length}    label={T.pwdLength} />
                    <Rule ok={pwdRules.uppercase} label={T.pwdUppercase} />
                    <Rule ok={pwdRules.special}   label={T.pwdSpecial} />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-300">{T.confirmPassword}</label>
                <input
                  type="password" required autoComplete="new-password"
                  value={regConfirm} onChange={e => setRegConfirm(e.target.value)}
                  className={`h-11 rounded-xl border bg-white/10 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${
                    regConfirm && !confirmOk ? "border-red-400/50 focus:ring-red-500/20" : "border-white/20 focus:border-emerald-500 focus:ring-emerald-500/20"
                  }`}
                />
                {regConfirm && !confirmOk && <p className="text-xs text-red-400">{T.errPasswordMatch}</p>}
              </div>
              <Button type="submit" size="lg" className="w-full" loading={loading}>{T.registerBtn}</Button>
            </form>
          )}

          {switchLink}

          <p className="mt-4 text-center text-xs text-slate-500">
            {T.termsText}{" "}
            <span className="cursor-pointer text-emerald-400 hover:underline">{T.termsLink}</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
