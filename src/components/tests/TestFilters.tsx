"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Search, X, ArrowUpDown, ChevronDown } from "lucide-react";
import { getTypeColor } from "@/lib/status-mapping";
import type { Test } from "@/types/test";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

// ── Sort ────────────────────────────────────────────────────────────────────
export type SortKey =
    | "default"
    | "name_asc"
    | "start_asc"
    | "start_desc"
    | "end_asc"
    | "end_desc"
    | "status";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: "default",    label: "Par défaut" },
    { value: "name_asc",   label: "Nom A → Z" },
    { value: "start_asc",  label: "Création ↑ (plus ancien)" },
    { value: "start_desc", label: "Création ↓ (plus récent)" },
    { value: "end_asc",    label: "Fin ↑ (se termine bientôt)" },
    { value: "end_desc",   label: "Fin ↓ (se termine le plus tard)" },
    { value: "status",     label: "Statut ABT" },
];

function parseDateMs(v: string | null | undefined): number {
    if (!v) return Infinity;
    const t = new Date(v).getTime();
    return isNaN(t) ? Infinity : t;
}

// ── Filter state ────────────────────────────────────────────────────────────
export interface FilterState {
    search: string;
    types: string[];
    sort: SortKey;
}

export const EMPTY_FILTERS: FilterState = {
    search: "",
    types: [],
    sort: "default",
};

const FILTERS_STORAGE_KEY = "orch-abtasty-filters";
const VALID_SORT_KEYS: SortKey[] = [
    "default", "name_asc", "start_asc", "start_desc", "end_asc", "end_desc", "status",
];

function isValidSortKey(v: unknown): v is SortKey {
    return typeof v === "string" && VALID_SORT_KEYS.includes(v as SortKey);
}

/** Charge les filtres depuis le localStorage (côté client uniquement). */
export function loadFiltersFromStorage(): FilterState | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem(FILTERS_STORAGE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw) as unknown;
        if (!data || typeof data !== "object") return null;
        const o = data as Record<string, unknown>;
        const search = typeof o.search === "string" ? o.search : "";
        const types = Array.isArray(o.types) ? o.types.filter((t): t is string => typeof t === "string") : [];
        const sort = isValidSortKey(o.sort) ? o.sort : "default";
        return { search, types, sort };
    } catch {
        return null;
    }
}

/** Enregistre les filtres dans le localStorage. */
export function saveFiltersToStorage(filters: FilterState): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    } catch {
        // quota or disabled
    }
}

interface TestFiltersProps {
    filters: FilterState;
    onChange: (filters: FilterState) => void;
    tests: Test[];
}

export function applyFilters(tests: Test[], filters: FilterState): Test[] {
    let result = tests.filter((t) => {
        if (filters.search) {
            const q = filters.search.toLowerCase();
            const match =
                t.name.toLowerCase().includes(q) ||
                (t.hypothesis ?? "").toLowerCase().includes(q) ||
                (t.abt_campaign_id ?? "").toLowerCase().includes(q) ||
                t.tags.some((tag) => tag.toLowerCase().includes(q));
            if (!match) return false;
        }
        if (filters.types.length > 0 && !filters.types.includes(t.type ?? "")) {
            return false;
        }
        return true;
    });

    // Sorting
    switch (filters.sort) {
        case "name_asc":
            result = [...result].sort((a, b) => a.name.localeCompare(b.name, "fr"));
            break;
        case "start_asc":
            // Plus ancien en premier : tri uniquement sur created_at
            result = [...result].sort(
                (a, b) => parseDateMs(a.created_at) - parseDateMs(b.created_at)
            );
            break;
        case "start_desc":
            // Plus récent en premier : tri uniquement sur created_at
            result = [...result].sort(
                (a, b) => parseDateMs(b.created_at) - parseDateMs(a.created_at)
            );
            break;
        case "end_asc":
            result = [...result].sort((a, b) => parseDateMs(a.end_date) - parseDateMs(b.end_date));
            break;
        case "end_desc":
            result = [...result].sort((a, b) => parseDateMs(b.end_date) - parseDateMs(a.end_date));
            break;
        case "status":
            result = [...result].sort((a, b) =>
                (a.abt_status ?? "zzz").localeCompare(b.abt_status ?? "zzz", "fr")
            );
            break;
        default:
            break;
    }

    return result;
}

export function TestFilters({ filters, onChange, tests }: TestFiltersProps) {
    const availableTypes = useMemo(() => {
        const types = new Set(tests.map((t) => t.type).filter(Boolean) as string[]);
        return Array.from(types).sort();
    }, [tests]);

    const hasActiveFilters =
        filters.search !== "" || filters.types.length > 0 || filters.sort !== "default";

    const toggleType = (type: string) => {
        const next = filters.types.includes(type)
            ? filters.types.filter((t) => t !== type)
            : [...filters.types, type];
        onChange({ ...filters, types: next });
    };

    return (
        <div className="flex flex-wrap items-center gap-3 py-2">
            {/* Search */}
            <div className="relative min-w-[200px] max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                    value={filters.search}
                    onChange={(e) => onChange({ ...filters, search: e.target.value })}
                    placeholder="Rechercher..."
                    className="pl-8 h-8 text-sm bg-background/50 border-border/50"
                />
                {filters.search && (
                    <button
                        type="button"
                        onClick={() => onChange({ ...filters, search: "" })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>

            {/* Filtres par type */}
            {availableTypes.length > 0 && (
                <>
                    <div className="h-5 w-px bg-border/50" />
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {availableTypes.map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => toggleType(type)}
                                className={cn(
                                    "text-xs font-medium px-2 py-0.5 rounded-full border uppercase tracking-wide transition-all",
                                    filters.types.includes(type)
                                        ? getTypeColor(type)
                                        : "bg-transparent text-muted-foreground border-border/30 hover:border-border/60"
                                )}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* Sort — poussé à droite */}
            <div className="ml-auto flex items-center gap-2">
                <div className="h-5 w-px bg-border/50" />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className={cn(
                                "h-8 flex items-center gap-1.5 pl-2.5 pr-2 rounded-md border text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-ring",
                                filters.sort !== "default"
                                    ? "border-primary/50 text-primary bg-primary/5 hover:bg-primary/10"
                                    : "border-border/50 text-muted-foreground bg-background/50 hover:border-border/80 hover:text-foreground"
                            )}
                        >
                            <ArrowUpDown className="h-3.5 w-3.5 shrink-0" />
                            <span className="max-w-[150px] truncate">
                                {SORT_OPTIONS.find((o) => o.value === filters.sort)?.label ?? "Trier"}
                            </span>
                            <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1">
                            Trier par
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup
                            value={filters.sort}
                            onValueChange={(v) => onChange({ ...filters, sort: v as SortKey })}
                        >
                            {SORT_OPTIONS.map((o) => (
                                <DropdownMenuRadioItem key={o.value} value={o.value} className="text-xs cursor-pointer">
                                    {o.label}
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Reset */}
                {hasActiveFilters && (
                    <>
                        <div className="h-5 w-px bg-border/50" />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-muted-foreground"
                            onClick={() => onChange(EMPTY_FILTERS)}
                        >
                            <X className="mr-1 h-3 w-3" />
                            Réinitialiser
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
