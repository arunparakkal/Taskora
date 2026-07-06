"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  LEAVE_STATUS_LABELS,
  type MemberLeaveStatus,
} from "@/lib/member/profile-display";

export function TeamLeadMemberMetaEditor({
  memberId,
  initialSkills,
  initialLeaveStatus,
}: {
  memberId: string;
  initialSkills: string[];
  initialLeaveStatus: MemberLeaveStatus;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [skillsText, setSkillsText] = useState(initialSkills.join(", "));
  const [leaveStatus, setLeaveStatus] =
    useState<MemberLeaveStatus>(initialLeaveStatus);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const skills = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await fetch(`/api/team-lead/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skills, leave_status: leaveStatus }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast({
        title: "Could not update member",
        description: data.error ?? "Something went wrong.",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Member profile updated" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="member-skills">Skills</Label>
        <Input
          id="member-skills"
          value={skillsText}
          onChange={(e) => setSkillsText(e.target.value)}
          placeholder="React, TypeScript, UI design (comma-separated)"
          className="border-slate-200"
        />
        <p className="text-xs text-slate-500">Separate skills with commas.</p>
      </div>
      <div className="space-y-2">
        <Label>Leave status</Label>
        <Select
          value={leaveStatus}
          onValueChange={(v) => setLeaveStatus(v as MemberLeaveStatus)}
        >
          <SelectTrigger className="border-slate-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(LEAVE_STATUS_LABELS) as MemberLeaveStatus[]).map(
              (status) => (
                <SelectItem key={status} value={status}>
                  {LEAVE_STATUS_LABELS[status]}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>
      <Button type="button" onClick={handleSave} disabled={saving} size="sm">
        {saving ? "Saving…" : "Save skills & leave status"}
      </Button>
    </div>
  );
}
