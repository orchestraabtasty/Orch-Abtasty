"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTests } from "@/hooks/useTests";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Test } from "@/types/test";

function highlight(text: string, query: string): React.ReactNode {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
        <>
            {text.slice(0, idx)}
            <mark className="bg-primary/30 text-foreground rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
            {text.slice(idx + query.length)}
        </>
    );
}

export function GlobalSearch() {
    const router = useRouter();
    const { data: tests } = useTests();
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    // ── Filter tests ────────────────────────────────────────────────────────
    const results: Test[] = query.trim().length > 0
        ? (tests ?? [])
              .filter((t) => {
                  const q = query.toLowerCase();
                  return (
                      t.name.toLowerCase().includes(q) ||
                      (t.type ?? "").toLowerCase().includes(q) ||
                      (t.abt_campaign_id ?? "").toLowerCase().includes(q) ||
                      (t.abt_idea_id ?? "").toLowerCase().includes(q) ||
                      (t.hypothesis ?? "").toLowerCase().includes(q) ||
                      (t.description ?? "").toLowerCase().includes(q) ||
                      t.tags.some((tag) => tag.toLowerCase().includes(q))
                  );
              })
              .slice(0, 8)
        : [];

    // ── Keyboard shortcut Shift+S ────────────────────────────────────────────
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.shiftKey && e.key === "S" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === "Escape") {
                setOpen(false);
                setQuery("");
                inputRef.current?.blur();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    // ── Close on outside click ───────────────────────────────────────────────
    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                !inputRef.current?.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    const navigate = useCallback((test: Test) => {
        const slug = test.abt_campaign_id ?? test.id;
        router.push(`/tests/${slug}`);
        setOpen(false);
        setQuery("");
    }, [router]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!open || results.length === 0) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => (i + 1) % results.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => (i - 1 + results.length) % results.length);
        } else if (e.key === "Enter" && activeIndex >= 0) {
            e.preventDefault();
            navigate(results[activeIndex]);
        }
    };

    return (
        <div className="relative flex-1 max-w-sm">
            {/* Input */}
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                        setActiveIndex(-1);
                    }}
                    onFocus={() => { if (query) setOpen(true); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Rechercher un test…"
                    className="w-full h-8 pl-8 pr-16 rounded-md border border-border/50 bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {query ? (
                        <button
                            type="button"
                            onClick={() => { setQuery(""); setOpen(false); }}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    ) : (
                        <span className="text-xs text-muted-foreground font-mono bg-muted px-1 py-0.5 rounded border border-border/50 hidden sm:inline">
                            ⇧S
                        </span>
                    )}
                </div>
            </div>

            {/* Dropdown */}
            {open && results.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-md border border-border bg-background shadow-lg overflow-hidden"
                >
                    {results.map((test, i) => (
                        <button
                            key={test.id}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); navigate(test); }}
                            onMouseEnter={() => setActiveIndex(i)}
                            className={cn(
                                "w-full text-left px-3 py-2 flex items-start gap-3 transition-colors border-b border-border/30 last:border-0",
                                i === activeIndex ? "bg-muted" : "hover:bg-muted/50"
                            )}
                        >
                            {/* Type badge */}
                            <span className={cn(
                                "mt-0.5 shrink-0 text-xs font-bold uppercase px-1.5 py-0.5 rounded border font-mono min-w-[36px] text-center",
                                test.kind === "idea"
                                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                    : "border-border/50 bg-muted text-muted-foreground"
                            )}>
                                {test.kind === "idea" ? "IDÉE" : (test.type ?? "—")}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">
                                    {highlight(test.name, query)}
                                </p>
                                {test.abt_campaign_id && (
                                    <p className="text-xs text-muted-foreground font-mono">
                                        #{test.abt_campaign_id}
                                    </p>
                                )}
                                {test.abt_idea_id && !test.abt_campaign_id && (
                                    <p className="text-xs text-muted-foreground font-mono">
                                        idée #{test.abt_idea_id}
                                    </p>
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                                {test.abt_status ?? "—"}
                            </span>
                        </button>
                    ))}
                    <div className="px-3 py-1.5 bg-muted/30 border-t border-border/30 flex items-center gap-3 text-xs text-muted-foreground">
                        <span><kbd className="font-mono">↑↓</kbd> naviguer</span>
                        <span><kbd className="font-mono">↵</kbd> ouvrir</span>
                        <span><kbd className="font-mono">Esc</kbd> fermer</span>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {open && query.trim().length > 0 && results.length === 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-md border border-border bg-background shadow-lg px-3 py-4 text-center text-xs text-muted-foreground"
                >
                    Aucun test trouvé pour « {query} »
                </div>
            )}
        </div>
    );
}
