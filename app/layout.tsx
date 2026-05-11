import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatSupport } from "@/components/FloatSupport";
import { getSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import { LanguageProvider } from "@/lib/LanguageContext";
import { Suspense } from "react";
import { ReferralTracker } from "@/components/ReferralTracker";
import { headers } from "next/headers";

const font = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WeChat Shop VN",
  description: "Mua tài khoản WeChat chính hãng, giao ngay sau thanh toán",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isAdminRoute = pathname.startsWith("/admin");

  const [settings, supabase] = await Promise.all([getSettings(), createClient()]);
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean);
  const isAdmin = !!user && adminEmails.includes(user.email ?? "");

  return (
    <html lang="vi">
      <body className={`${font.className} bg-gray-50 text-gray-900 antialiased`}>
        <LanguageProvider>
          {!isAdminRoute && <Navbar isAdmin={isAdmin} />}
          <main className={isAdminRoute ? "min-h-screen" : "min-h-[calc(100vh-4rem)]"}>
            {children}
          </main>
          {!isAdminRoute && (
            <>
              <Footer
                shopName={settings.shop_name}
                zalo={settings.zalo}
                facebookPage={settings.facebook_page}
              />
              <FloatSupport wechatId={settings.wechat_id} telegram={settings.telegram} />
              <Suspense fallback={null}><ReferralTracker /></Suspense>
            </>
          )}
        </LanguageProvider>
      </body>
    </html>
  );
}
