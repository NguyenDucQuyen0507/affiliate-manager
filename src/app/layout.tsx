import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Affiliate Manager",
  description: "Quản lý deal affiliate và lịch đăng bài",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster theme="light" position="bottom-right" />
      </body>
    </html>
  );
}
