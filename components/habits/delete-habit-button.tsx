"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

export function DeleteHabitButton({
  habitId,
  habitTitle,
}: {
  habitId: string;
  habitTitle: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/member/habits/${habitId}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast({
          title: "Could not delete habit",
          description: json.error ?? "Try again",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Habit deleted", variant: "success" });
      setOpen(false);
      router.refresh();
    } catch {
      toast({
        title: "Could not delete habit",
        description: "Try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="h-8 w-8 shrink-0 text-slate-400 hover:bg-red-50 hover:text-red-600"
        aria-label={`Delete ${habitTitle}`}
        title="Delete habit"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-red-100 sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 sm:mx-0">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle className="text-slate-900">Delete habit?</DialogTitle>
            <DialogDescription className="text-slate-600">
              This permanently removes{" "}
              <span className="font-medium text-slate-900">{habitTitle}</span>{" "}
              and all of its completion history and streak data. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="border-slate-200"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete habit"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
