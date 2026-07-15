"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/types/database";
import {
  suggestedPromptsForGuest,
  suggestedPromptsForRole,
} from "@/lib/ai/chatbot-knowledge";

type ChatRole = "user" | "assistant";

type UiMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export function ChatWidget({
  variant,
  role,
  name,
}: {
  variant: "guest" | "assistant";
  role?: AppRole;
  name?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      content:
        variant === "guest"
          ? "Hi! I'm the Taskora guide. Ask me about features, roles, or how to get access."
          : `Hi${name ? ` ${name.split(" ")[0]}` : ""}! I'm your Taskora assistant. Ask about your work, deadlines, or how something works.`,
    },
  ]);

  const listRef = useRef<HTMLDivElement>(null);
  const prompts =
    variant === "guest"
      ? suggestedPromptsForGuest()
      : suggestedPromptsForRole(role ?? "member");

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, loading]);

  async function sendMessage(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    setError(null);
    setInput("");

    const userMsg: UiMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
    };

    // Welcome stays on screen; API only gets real conversation turns.
    const apiMessages = [...messages, userMsg]
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }))
      .slice(-20);

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Chat failed.");
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: json.reply ?? "Sorry, I couldn't generate a reply.",
        },
      ]);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendMessage(input);
  }

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {open && (
        <div
          className={cn(
            "pointer-events-auto flex w-[min(100vw-2rem,380px)] flex-col overflow-hidden rounded-2xl border shadow-2xl",
            "border-slate-200 bg-white text-slate-900",
            "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          )}
          style={{ height: "min(70vh, 520px)" }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-white dark:border-slate-700">
            <div className="flex min-w-0 items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {variant === "guest" ? "Taskora Guide" : "Taskora Assistant"}
                </p>
                <p className="truncate text-[11px] text-white/80">
                  {variant === "guest"
                    ? "Ask about the product"
                    : "Ask about your work (read-only)"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-white/90 hover:bg-white/15"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            ref={listRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex",
                  m.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                    m.role === "user"
                      ? "bg-violet-600 text-white"
                      : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Thinking…
              </div>
            )}
            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                {error}
              </p>
            )}
          </div>

          {messages.length <= 2 && !loading && (
            <div className="flex flex-wrap gap-1.5 border-t border-slate-100 px-3 py-2 dark:border-slate-800">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-800 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200 dark:hover:bg-violet-900/50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 border-t border-slate-100 px-3 py-3 dark:border-slate-800"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={1}
              maxLength={2000}
              placeholder="Ask anything…"
              className={cn(
                "max-h-28 min-h-[40px] flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none",
                "border-slate-200 bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-200",
                "dark:border-slate-700 dark:bg-slate-950 dark:focus:border-violet-500 dark:focus:ring-violet-900/50"
              )}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage(input);
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !input.trim()}
              className="h-10 w-10 shrink-0 bg-violet-600 text-white hover:bg-violet-700"
              aria-label="Send message"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      )}

      <Button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "pointer-events-auto h-14 w-14 rounded-full bg-violet-600 text-white shadow-lg hover:bg-violet-700",
          open && "bg-slate-700 hover:bg-slate-800"
        )}
        aria-label={open ? "Close assistant" : "Open assistant"}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
