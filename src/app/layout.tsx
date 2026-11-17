import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { siteConfig } from "@/config/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: siteConfig.browserTitle,
  description: "Performance Dashboard for Meta Ads",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex bg-background text-foreground overflow-hidden">
        <ThemeProvider>
          <Sidebar />
          <div className="flex flex-col flex-1 h-screen overflow-hidden">
            <Suspense fallback={<div className="h-20 border-b border-card-border shrink-0" />}>
              <Topbar />
            </Suspense>
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
