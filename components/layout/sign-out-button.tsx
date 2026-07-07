"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  broadcastAuthChange,
  clearTabBinding,
} from "@/lib/auth/tab-session";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    clearTabBinding();
    broadcastAuthChange(null, "SIGN_OUT");
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="group flex w-full cursor-pointer items-center gap-3 rounded-[14px] border border-transparent bg-transparent px-3.5 py-3 text-left transition-all duration-[180ms] ease-out hover:-translate-y-px hover:border-[#FECACA] hover:bg-[#FEF2F2] dark:hover:border-red-500/30 dark:hover:bg-red-500/10"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FEF2F2] text-[#DC2626] transition-colors group-hover:bg-white dark:bg-red-500/15 dark:text-red-400">
        <LogOut className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[#DC2626] dark:text-red-400">
          Sign out
        </span>
        <span className="block text-xs text-[#DC2626]/70 dark:text-red-400/70">
          Log out of your account
        </span>
      </span>
    </button>
  );
}
