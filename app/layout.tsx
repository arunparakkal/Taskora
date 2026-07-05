import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionSync } from "@/components/auth/session-sync";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Taskora — Project Management",
  description: "Jira-like project management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full font-sans`}>
      <body className="min-h-full font-sans antialiased">
        <ToastProvider>
          <SessionSync />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
