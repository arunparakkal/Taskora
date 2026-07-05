"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  FolderKanban,
  Loader2,
  Search,
  Users,
  UsersRound,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminSearchResult, AdminSearchType } from "@/lib/search-utils";

const SEARCH_TYPES: {
  value: AdminSearchType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "users", label: "Users", icon: Users },
  { value: "teams", label: "Teams", icon: UsersRound },
  { value: "projects", label: "Projects", icon: FolderKanban },
];

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function GlobalSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [type, setType] = useState<AdminSearchType>("users");
  const [query, setQuery] = useState("");
  const [resultsOpen, setResultsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AdminSearchResult[]>([]);

  const debouncedQuery = useDebouncedValue(query, 280);
  const activeType = SEARCH_TYPES.find((t) => t.value === type)!;

  const runSearch = useCallback(async (searchType: AdminSearchType, q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: searchType,
        q: trimmed,
      });
      const res = await fetch(`/api/admin/search?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setResults(json.results ?? []);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      runSearch(type, debouncedQuery);
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [debouncedQuery, type, runSearch]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setResultsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleTypeChange(newType: AdminSearchType) {
    setType(newType);
    setResults([]);
    if (query.trim().length >= 2) {
      setResultsOpen(true);
      runSearch(newType, query);
    }
  }

  function handleSelectResult(result: AdminSearchResult) {
    setResultsOpen(false);
    setQuery("");
    setResults([]);
    router.push(result.href);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setResultsOpen(false);
    const base = {
      users: "/admin/users",
      teams: "/admin/teams",
      projects: "/admin/projects",
    }[type];
    router.push(`${base}?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl overflow-visible">
      <form
        onSubmit={handleSubmit}
        className="flex h-10 rounded-lg border border-slate-200 bg-slate-50 shadow-sm"
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-l-lg border-r border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Select search category"
            >
              <activeType.icon className="h-4 w-4 text-blue-600" />
              <span className="hidden sm:inline">{activeType.label}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="z-[100] w-44">
            <DropdownMenuLabel>Search in</DropdownMenuLabel>
            {SEARCH_TYPES.map((item) => (
              <DropdownMenuItem
                key={item.value}
                onSelect={() => handleTypeChange(item.value)}
                className="cursor-pointer gap-2"
              >
                <item.icon className="h-4 w-4 text-blue-600" />
                <span className="flex-1">{item.label}</span>
                {type === item.value && <Check className="h-4 w-4 text-blue-600" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setResultsOpen(true);
            }}
            onFocus={() => setResultsOpen(true)}
            placeholder={`Search ${activeType.label.toLowerCase()}...`}
            className="h-10 rounded-none rounded-r-lg border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0"
          />
        </div>
      </form>

      {resultsOpen && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {query.trim().length < 2 ? (
            <p className="px-4 py-3 text-sm text-slate-500">
              Type at least 2 characters to search {activeType.label.toLowerCase()}
            </p>
          ) : loading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              Searching {activeType.label.toLowerCase()}...
            </div>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">
              No {activeType.label.toLowerCase()} found for &quot;{query.trim()}&quot;
            </p>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {results.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectResult(result)}
                    className="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
                  >
                    <span className="text-sm font-medium text-slate-900">
                      {result.title}
                    </span>
                    <span className="text-xs text-slate-500">{result.subtitle}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
