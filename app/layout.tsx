import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WeChat Shop VN",
  description: "Mua tài khoản WeChat chính hãng, giao ngay sau thanh toán",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${geist.className} bg-gray-50 text-gray-900 antialiased`}>
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        <footer className="border-t border-gray-200 bg-white py-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} WeChat Shop VN — Mua bán tài khoản WeChat
        </footer>
      </body>
    </html>
  );
}
