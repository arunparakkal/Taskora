import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionSync } from "@/components/auth/session-sync";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('taskora-theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;if(d){r.classList.add('dark');r.style.colorScheme='dark';}else{r.style.colorScheme='light';}}catch(e){}})();`;

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
    <html
      lang="en"
      className={`${inter.variable} h-full font-sans`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full font-sans antialiased">
        <ThemeProvider>
          <ToastProvider>
            <SessionSync />
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
