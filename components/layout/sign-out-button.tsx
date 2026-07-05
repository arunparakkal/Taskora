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
      className="flex w-full cursor-pointer items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  );
}
