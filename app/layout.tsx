import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { SessionSync } from "@/components/auth/session-sync";
import { ChatMount } from "@/components/chat/chat-mount";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('taskora-theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;if(d){r.classList.add('dark');r.style.colorScheme='dark';}else{r.style.colorScheme='light';}}catch(e){}})();`;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Taskora — Manage Projects. Track Tasks. Deliver Faster.",
  description:
    "Taskora is a modern team productivity platform for project management, task workflows, collaboration, notifications, and performance insights.",
  openGraph: {
    title: "Taskora — Team Productivity Platform",
    description:
      "Manage projects, track tasks, and deliver faster with role-based workflows, dashboards, and performance insights.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full font-sans`}
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans antialiased">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <ThemeProvider>
          <ToastProvider>
            <SessionSync />
            {children}
            <ChatMount />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
