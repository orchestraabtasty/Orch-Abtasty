"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { getTypeColor } from "@/lib/status-mapping";
import type { Test } from "@/types/test";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export interface FilterState {
    search: string;
    types: string[];
}

export const EMPTY_FILTERS: FilterState = {
    search: "",
    types: [],
};

interface TestFiltersProps {
    filters: FilterState;
    onChange: (filters: FilterState) => void;
    tests: Test[];
}

export function applyFilters(tests: Test[], filters: FilterState): Test[] {
    return tests.filter((t) => {
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
}

export function TestFilters({ filters, onChange, tests }: TestFiltersProps) {
    const availableTypes = useMemo(() => {
        const types = new Set(tests.map((t) => t.type).filter(Boolean) as string[]);
        return Array.from(types).sort();
    }, [tests]);

    const hasActiveFilters = filters.search !== "" || filters.types.length > 0;

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
                                    "text-[10px] font-medium px-2 py-0.5 rounded-full border uppercase tracking-wide transition-all",
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
    );
}
