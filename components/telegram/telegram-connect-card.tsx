"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, ExternalLink, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/utils";

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
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="flex items-center gap-2 p-6 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading Telegram settings…
        </CardContent>
      </Card>
    );
  }

  if (!status?.botConfigured) {
    return (
      <Card className="border-dashed border-slate-200 bg-slate-50/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-slate-700">
            <Send className="h-4 w-4 text-sky-500" />
            Telegram alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-500">
          Telegram bot is not configured yet. Ask your administrator to set{" "}
          <code className="text-xs">TELEGRAM_BOT_TOKEN</code> on the server.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-slate-900">
          <Send className="h-4 w-4 text-sky-500" />
          Telegram alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          Get notified on Telegram when new projects are created on your team,
          when tasks are assigned to you, when a project is paused or archived,
          and when a project due date is tomorrow (team leads).
        </p>

        {status.linked ? (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <p className="text-sm font-semibold text-emerald-900">Connected</p>
            <p className="mt-1 text-sm text-emerald-800">
              {status.username ? `@${status.username}` : "Telegram account linked"}
              {status.linkedAt && (
                <span className="text-emerald-700/80">
                  {" "}
                  · since {formatDateTime(status.linkedAt)}
                </span>
              )}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-200"
                onClick={handleToggleNotify}
                disabled={togglingNotify}
              >
                {status.notifyEnabled ? (
                  <>
                    <Bell className="mr-1.5 h-3.5 w-3.5" />
                    Notifications on
                  </>
                ) : (
                  <>
                    <BellOff className="mr-1.5 h-3.5 w-3.5" />
                    Notifications paused
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 text-red-700 hover:bg-red-50"
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
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleConnect}
              disabled={linking}
              className="bg-sky-600 hover:bg-sky-700"
            >
              {linking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              Connect Telegram
            </Button>
            {status.botUsername && (
              <p className="text-xs text-slate-400">
                Bot: @{status.botUsername}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
