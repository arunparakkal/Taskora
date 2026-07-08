"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, ExternalLink, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn, formatDate } from "@/lib/utils";

interface TelegramStatus {
  botConfigured: boolean;
  botUsername: string | null;
  linked: boolean;
  username: string | null;
  linkedAt: string | null;
  notifyEnabled: boolean;
}

export function TelegramConnectCard() {
  const { toast } = useToast();
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [togglingNotify, setTogglingNotify] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/telegram/link");
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  async function handleConnect() {
    setLinking(true);
    try {
      const res = await fetch("/api/telegram/link", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        toast({
          title: "Cannot connect Telegram",
          description: json.error ?? "Try again later.",
          variant: "destructive",
        });
        return;
      }

      window.open(json.linkUrl, "_blank", "noopener,noreferrer");
      toast({
        title: "Open Telegram",
        description: "Tap Start in the bot chat to finish linking.",
        variant: "success",
      });

      const poll = setInterval(async () => {
        const check = await fetch("/api/telegram/link");
        if (check.ok) {
          const next = (await check.json()) as TelegramStatus;
          if (next.linked) {
            setStatus(next);
            clearInterval(poll);
            toast({
              title: "Telegram connected",
              description: "You will receive Taskora alerts here.",
              variant: "success",
            });
          }
        }
      }, 3000);

      setTimeout(() => clearInterval(poll), 5 * 60 * 1000);
    } finally {
      setLinking(false);
    }
  }

  async function handleDisconnect() {
    setUnlinking(true);
    try {
      const res = await fetch("/api/telegram/link", { method: "DELETE" });
      if (!res.ok) {
        toast({ title: "Could not disconnect", variant: "destructive" });
        return;
      }
      await loadStatus();
      toast({ title: "Telegram disconnected", variant: "success" });
    } finally {
      setUnlinking(false);
    }
  }

  async function handleToggleNotify() {
    if (!status) return;
    setTogglingNotify(true);
    try {
      const res = await fetch("/api/telegram/link", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifyEnabled: !status.notifyEnabled }),
      });
      if (!res.ok) {
        toast({ title: "Could not update setting", variant: "destructive" });
        return;
      }
      setStatus((s) =>
        s ? { ...s, notifyEnabled: !s.notifyEnabled } : s
      );
    } finally {
      setTogglingNotify(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
        Loading Telegram settings…
      </div>
    );
  }

  const linked = !!status?.linked;
  const botConfigured = !!status?.botConfigured;

  return (
    <div
      className={cn(
        "group relative flex flex-wrap items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3 shadow-sm transition-colors",
        linked
          ? "border-emerald-200/80 bg-gradient-to-r from-emerald-50/80 via-white to-white dark:border-emerald-500/25 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900"
          : "border-sky-200/80 bg-gradient-to-r from-sky-50/80 via-white to-white dark:border-sky-500/25 dark:from-sky-950/40 dark:via-slate-900 dark:to-slate-900"
      )}
    >
      <span
        className={cn(
          "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner",
          linked
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-sky-500/10 text-sky-600 dark:text-sky-400"
        )}
      >
        <Send className="h-5 w-5" />
        {linked && (
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Telegram alerts
          </p>
          {linked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              Connected
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
          {!botConfigured
            ? "Not configured — ask your admin to set the bot token."
            : linked
              ? `${
                  status?.username ? `@${status.username}` : "Account linked"
                }${status?.linkedAt ? ` · since ${formatDate(status.linkedAt)}` : ""}`
              : "Get task and project alerts straight to Telegram."}
        </p>
      </div>

      {botConfigured && linked ? (
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-slate-200 px-2.5 dark:border-slate-700"
            onClick={handleToggleNotify}
            disabled={togglingNotify}
            title={status?.notifyEnabled ? "Mute alerts" : "Unmute alerts"}
          >
            {togglingNotify ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : status?.notifyEnabled ? (
              <Bell className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <BellOff className="h-3.5 w-3.5 text-slate-400" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-red-200 px-2.5 text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
            onClick={handleDisconnect}
            disabled={unlinking}
          >
            {unlinking ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Disconnect"
            )}
          </Button>
        </div>
      ) : botConfigured ? (
        <Button
          onClick={handleConnect}
          disabled={linking}
          size="sm"
          className="h-8 shrink-0 bg-sky-600 hover:bg-sky-700"
        >
          {linking ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
          )}
          Connect
        </Button>
      ) : null}
    </div>
  );
}
