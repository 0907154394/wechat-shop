"use client";

import { usePathname } from "next/navigation";
import { MessageCircle, Phone, ShieldCheck, Zap, Clock } from "lucide-react";
import Link from "next/link";
import { tr } from "@/lib/i18n";
import { useLang } from "@/lib/LanguageContext";

interface FooterProps {
  shopName: string;
  zalo: string;
  facebookPage: string;
}

export function Footer({ shopName, zalo, facebookPage }: FooterProps) {
  const pathname = usePathname();
  const { lang } = useLang();
  const T = tr(lang);

  if (pathname === "/login") return null;

  const name = shopName || "WeChat Shop VN";

  return (
    <footer className="bg-gray-950 text-gray-400">
      {/* Main footer content */}
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-black text-white">
                  WeChat <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">Shop</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">Vietnam</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">{T.footer.desc}</p>
            <div className="mt-5 flex flex-col gap-2">
              {([
                { icon: Zap, text: T.footer.highlights[0] },
                { icon: ShieldCheck, text: T.footer.highlights[1] },
                { icon: Clock, text: T.footer.highlights[2] },
              ] as const).map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-xs text-gray-500">
                  <Icon className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">{T.footer.quickLinks}</h3>
            <ul className="space-y-2.5 text-sm">
              {T.footer.links.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="transition-colors hover:text-emerald-400">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">{T.footer.contact}</h3>
            <div className="space-y-3">
              {zalo && (
                <a
                  href={`https://zalo.me/${zalo.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm transition-colors hover:border-emerald-500/50 hover:text-emerald-400"
                >
                  <Phone className="h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="text-xs text-gray-500">{T.footer.zaloLabel}</p>
                    <p className="font-medium text-gray-300">{zalo}</p>
                  </div>
                </a>
              )}
              {facebookPage && (
                <a
                  href={facebookPage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm transition-colors hover:border-blue-500/50 hover:text-blue-400"
                >
                  <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500">Facebook</p>
                    <p className="font-medium text-gray-300">{T.footer.fbLabel}</p>
                  </div>
                </a>
              )}
              {!zalo && !facebookPage && (
                <p className="text-sm text-gray-600">{T.footer.noContact}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800 px-4 py-5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} {name}. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span>{T.footer.terms}</span>
            <span className="text-gray-800">·</span>
            <span>{T.footer.privacy}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
