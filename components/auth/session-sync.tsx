"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import {
  AUTH_BROADCAST_CHANNEL,
  bindTabToUser,
  broadcastAuthChange,
  clearTabBinding,
  getTabBoundUserId,
  getTabId,
  isTabSessionMismatch,
  type AuthBroadcastMessage,
} from "@/lib/auth/tab-session";

/**
 * Syncs JWT cookie auth across tabs. Each tab tracks its own user in sessionStorage;
 * when another tab signs in, mismatched tabs redirect instead of silently showing the wrong account.
 *
 * Note: one browser profile still shares one JWT cookie — two accounts cannot stay
 * logged in simultaneously. Use separate Chrome profiles or incognito to test two roles.
 */
export function SessionSync() {
  const router = useRouter();
  const { toast } = useToast();
  const handlingRef = useRef(false);

  const handleSessionReplaced = useCallback(async () => {
    if (handlingRef.current) return;
    handlingRef.current = true;

    clearTabBinding();
    // Clear shared JWT cookie so middleware allows /login (otherwise it redirects to /)
    await fetch("/api/auth/logout", { method: "POST" });

    toast({
      title: "Signed in on another tab",
      description:
        "This browser uses one login session. Another account signed in and replaced this tab's session.",
      variant: "destructive",
    });
    router.push("/login?reason=session_replaced");
    router.refresh();
  }, [router, toast]);

  const verifyTabSession = useCallback(
    async (options?: { bindIfMissing?: boolean }) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const currentUserId = user?.id ?? null;

      if (isTabSessionMismatch(currentUserId)) {
        handleSessionReplaced();
        return;
      }

      if (options?.bindIfMissing && currentUserId && !getTabBoundUserId()) {
        bindTabToUser(currentUserId);
      }
    },
    [handleSessionReplaced]
  );

  useEffect(() => {
    const supabase = createClient();

    void verifyTabSession({ bindIfMissing: true });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUserId = session?.user?.id ?? null;

      if (event === "SIGNED_OUT") {
        clearTabBinding();
        router.push("/login");
        router.refresh();
        return;
      }

      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        if (isTabSessionMismatch(nextUserId)) {
          handleSessionReplaced();
          return;
        }

        if (event === "SIGNED_IN" && nextUserId) {
          bindTabToUser(nextUserId);
        }
      }
    });

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void verifyTabSession();
      }
    };

    const onFocus = () => {
      void verifyTabSession();
    };

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
      channel.onmessage = (event: MessageEvent<AuthBroadcastMessage>) => {
        const { type, userId, tabId } = event.data;
        if (tabId === getTabId()) return;

        if (type === "SIGN_OUT") {
          clearTabBinding();
          router.push("/login");
          router.refresh();
          return;
        }

        if (type === "AUTH_CHANGED" && isTabSessionMismatch(userId)) {
          handleSessionReplaced();
        }
      };
    }

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      channel?.close();
    };
  }, [handleSessionReplaced, router, verifyTabSession]);

  return null;
}
