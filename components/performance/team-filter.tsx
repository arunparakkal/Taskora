"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TeamFilter({
  teams,
  currentTeamId,
}: {
  teams: { id: string; name: string }[];
  currentTeamId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("team");
    } else {
      params.set("team", value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={currentTeamId ?? "all"} onValueChange={select}>
      <SelectTrigger className="h-9 w-[180px] bg-white">
        <SelectValue placeholder="All teams" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All teams</SelectItem>
        {teams.map((team) => (
          <SelectItem key={team.id} value={team.id}>
            {team.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
