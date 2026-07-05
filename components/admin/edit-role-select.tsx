"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import type { AppRole } from "@/types/database";

export function EditRoleSelect({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: AppRole;
}) {
  const router = useRouter();
  const { toast } = useToast();

  async function handleChange(role: AppRole) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const json = await res.json();

    if (!res.ok) {
      toast({ title: "Error", description: json.error, variant: "destructive" });
      return;
    }

    toast({ title: "Role updated" });
    router.refresh();
  }

  return (
    <Select defaultValue={currentRole} onValueChange={(v) => handleChange(v as AppRole)}>
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="team_lead">Team Lead</SelectItem>
        <SelectItem value="member">Member</SelectItem>
      </SelectContent>
    </Select>
  );
}
