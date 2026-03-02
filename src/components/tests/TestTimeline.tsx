"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { format, differenceInDays, addDays, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getAbtStatusColor, getAbtStatusLabel, isTestPeriodLocked } from "@/lib/status-mapping";
import { useUpdateTestDates } from "@/hooks/useTests";
import type { Test } from "@/types/test";
import { ChevronLeft, ChevronRight, Calendar, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TestTimelineProps {
    tests: Test[];
    onTestClick?: (test: Test) => void;
}

type WindowPreset = 30 | 60 | 90 | 180;

const PRESETS: { label: string; value: WindowPreset }[] = [
    { label: "1 mois", value: 30 },
    { label: "2 mois", value: 60 },
    { label: "3 mois", value: 90 },
    { label: "6 mois", value: 180 },
];

function toISODate(d: Date): string {
    return format(d, "yyyy-MM-dd");
}

function getTestStart(test: Test): Date | null {
    // For live/stopped tests, the real ABT start date is the reference.
    // For editable tests (not yet launched), prefer the user-defined target date.
    const raw = isTestPeriodLocked(test.abt_status)
        ? (test.start_date || test.created_at)
        : (test.target_start_date || test.start_date || test.created_at);
    if (!raw) return null;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : startOfDay(d);
}

function getTestEnd(test: Test, today: Date): Date {
    // Live tests are open-ended: the bar always stretches to today
    if (test.abt_status === "play") return startOfDay(today);
    if (test.end_date) {
        const d = new Date(test.end_date);
        if (!isNaN(d.getTime())) return startOfDay(d);
    }
    // For editable tests with a target start but no end, show a 14-day preview window
    if (!isTestPeriodLocked(test.abt_status) && test.target_start_date) {
        const target = new Date(test.target_start_date);
        if (!isNaN(target.getTime())) return startOfDay(addDays(target, 14));
    }
    return startOfDay(today);
}

const STATUS_LEGEND: { status: string; label: string }[] = [
    { status: "pause", label: "Pause" },
    { status: "in_qa", label: "QA" },
    { status: "play", label: "En cours" },
    { status: "stopped", label: "Arrêté" },
];

export function TestTimeline({ tests, onTestClick }: TestTimelineProps) {
    const today = startOfDay(new Date());
    const [halfWindow, setHalfWindow] = useState<WindowPreset>(30);
    const [offset, setOffset] = useState(0); // days to shift the window
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const updateDates = useUpdateTestDates();
    const containerRef = useRef<HTMLDivElement>(null);

    // ── Filter by status (legend click) ─────────────────────────────────────
    const filteredTests = useMemo(() => {
        if (!statusFilter) return tests;
        return tests.filter((t) => (t.abt_status ?? null) === statusFilter);
    }, [tests, statusFilter]);

    // ── Window calculation ──────────────────────────────────────────────────
    const minDate = startOfDay(addDays(today, -halfWindow + offset));
    const maxDate = startOfDay(addDays(today, halfWindow + offset));
    const totalDays = differenceInDays(maxDate, minDate) + 1;

    // ── Filter and map tests that intersect the window ─────────────────────
    const bars = useMemo(() => {
        return filteredTests
            .map((test) => {
                const start = getTestStart(test);
                if (!start) return null;
                const end = getTestEnd(test, today);
                const effStart = start < minDate ? minDate : start;
                const effEnd = end > maxDate ? maxDate : end;
                if (effStart > maxDate || effEnd < minDate) return null;
                const startOffset = differenceInDays(effStart, minDate);
                const durationDays = differenceInDays(effEnd, effStart) + 1;
                const left = (startOffset / totalDays) * 100;
                const width = Math.max((durationDays / totalDays) * 100, 0.8);
                return { test, left, width, start, end };
            })
            .filter(Boolean) as { test: Test; left: number; width: number; start: Date; end: Date }[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredTests, minDate.getTime(), maxDate.getTime(), totalDays]);

    // ── Month labels ────────────────────────────────────────────────────────
    const monthLabels = useMemo(() => {
        const labels: { label: string; left: number }[] = [];
        const cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
        while (cur <= maxDate) {
            const dayOffset = differenceInDays(cur, minDate);
            const left = (dayOffset / totalDays) * 100;
            if (left >= 0 && left <= 100) {
                labels.push({ label: format(cur, "MMM yyyy", { locale: fr }), left });
            }
            cur.setMonth(cur.getMonth() + 1);
        }
        return labels;
    }, [minDate, maxDate, totalDays]);

    // ── Today marker position ────────────────────────────────────────────────
    const todayLeft = (differenceInDays(today, minDate) / totalDays) * 100;

    // ── Drag to move segment ─────────────────────────────────────────────────
    const dragState = useRef<{
        testId: string;
        startX: number;
        origStart: Date;
        origEnd: Date;
        containerWidth: number;
    } | null>(null);

    const handleBarMouseDown = useCallback(
        (e: React.MouseEvent, test: Test, start: Date, end: Date) => {
            e.preventDefault();
            e.stopPropagation();
            const containerWidth = containerRef.current?.getBoundingClientRect().width ?? 800;
            dragState.current = {
                testId: test.id,
                startX: e.clientX,
                origStart: start,
                origEnd: end,
                containerWidth,
            };

            const onMouseMove = (ev: MouseEvent) => {
                if (!dragState.current) return;
                const dx = ev.clientX - dragState.current.startX;
                const daysShifted = Math.round((dx / dragState.current.containerWidth) * totalDays);
                const newStart = addDays(dragState.current.origStart, daysShifted);
                const duration = differenceInDays(dragState.current.origEnd, dragState.current.origStart);
                const newEnd = addDays(newStart, duration);
                // Optimistic visual: update query cache directly
                // (full optimistic is done on mouseup via mutation)
                const el = document.getElementById(`bar-${dragState.current.testId}`);
                if (el) {
                    const newLeft = (differenceInDays(newStart < minDate ? minDate : newStart, minDate) / totalDays) * 100;
                    el.style.left = `${newLeft}%`;
                }
            };

            const onMouseUp = (ev: MouseEvent) => {
                if (!dragState.current) return;
                const dx = ev.clientX - dragState.current.startX;
                const daysShifted = Math.round((dx / dragState.current.containerWidth) * totalDays);
                if (daysShifted !== 0) {
                    const newStart = addDays(dragState.current.origStart, daysShifted);
                    const duration = differenceInDays(dragState.current.origEnd, dragState.current.origStart);
                    const newEnd = addDays(newStart, duration);
                    // Non-live tests: update planning date (target_start_date), not the real start
                    updateDates.mutate({
                        id: dragState.current.testId,
                        target_start_date: toISODate(newStart),
                        end_date: toISODate(newEnd),
                    });
                }
                dragState.current = null;
                window.removeEventListener("mousemove", onMouseMove);
                window.removeEventListener("mouseup", onMouseUp);
            };

            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
        },
        [totalDays, minDate, updateDates]
    );

    // ── Resize handles ───────────────────────────────────────────────────────
    const resizeState = useRef<{
        testId: string;
        side: "left" | "right";
        startX: number;
        origStart: Date;
        origEnd: Date;
        containerWidth: number;
    } | null>(null);

    const handleResizeMouseDown = useCallback(
        (e: React.MouseEvent, test: Test, side: "left" | "right", start: Date, end: Date) => {
            e.preventDefault();
            e.stopPropagation();
            const containerWidth = containerRef.current?.getBoundingClientRect().width ?? 800;
            resizeState.current = {
                testId: test.id,
                side,
                startX: e.clientX,
                origStart: start,
                origEnd: end,
                containerWidth,
            };

            const onMouseMove = (_ev: MouseEvent) => {
                // Visual feedback could be added here
            };

            const onMouseUp = (ev: MouseEvent) => {
                if (!resizeState.current) return;
                const dx = ev.clientX - resizeState.current.startX;
                const daysShifted = Math.round((dx / resizeState.current.containerWidth) * totalDays);
                if (daysShifted !== 0) {
                    let newStart = resizeState.current.origStart;
                    let newEnd = resizeState.current.origEnd;
                    if (resizeState.current.side === "left") {
                        newStart = addDays(resizeState.current.origStart, daysShifted);
                        if (newStart >= newEnd) newStart = addDays(newEnd, -1);
                    } else {
                        newEnd = addDays(resizeState.current.origEnd, daysShifted);
                        if (newEnd <= newStart) newEnd = addDays(newStart, 1);
                    }
                    // Non-live tests: resize updates target_start_date + end_date
                    updateDates.mutate({
                        id: resizeState.current.testId,
                        target_start_date: toISODate(newStart),
                        end_date: toISODate(newEnd),
                    });
                }
                resizeState.current = null;
                window.removeEventListener("mousemove", onMouseMove);
                window.removeEventListener("mouseup", onMouseUp);
            };

            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
        },
        [totalDays, updateDates]
    );

    return (
        <div className="h-full flex flex-col rounded-xl border bg-card/30 backdrop-blur-sm overflow-hidden">
            {/* Controls bar */}
            <div className="flex-none border-b px-4 py-2 bg-muted/20 flex flex-wrap items-center gap-3">
                {/* Preset buttons */}
                <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                    {PRESETS.map((p) => (
                        <button
                            key={p.value}
                            type="button"
                            onClick={() => { setHalfWindow(p.value); setOffset(0); }}
                            className={cn(
                                        "text-xs font-medium px-2 py-0.5 rounded-full border transition-all",
                                halfWindow === p.value
                                    ? "bg-primary/15 text-primary border-primary/40"
                                    : "bg-transparent text-muted-foreground border-border/30 hover:border-border/60"
                            )}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                <div className="h-4 w-px bg-border/50" />

                {/* Navigation prev/next */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setOffset((o) => o - halfWindow)}
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-xs text-muted-foreground min-w-[160px] text-center">
                        {format(minDate, "d MMM", { locale: fr })} → {format(maxDate, "d MMM yyyy", { locale: fr })}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setOffset((o) => o + halfWindow)}
                    >
                        <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                    {offset !== 0 && (
                        <button
                            type="button"
                            onClick={() => setOffset(0)}
                            className="text-xs text-primary/70 hover:text-primary underline ml-1"
                        >
                            Aujourd&apos;hui
                        </button>
                    )}
                </div>

                <div className="h-4 w-px bg-border/50" />

                {/* ABT status legend (clic = filtre) */}
                <div className="flex items-center gap-2 flex-wrap">
                    {STATUS_LEGEND.map(({ status, label }) => {
                        const isActive = statusFilter === status;
                        return (
                            <button
                                key={status}
                                type="button"
                                onClick={() => setStatusFilter((prev) => (prev === status ? null : status))}
                                title={isActive ? `Afficher tous les statuts` : `Filtrer : ${label}`}
                                className={cn(
                                    "inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border transition-all cursor-pointer",
                                    getAbtStatusColor(status),
                                    isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                )}
                            >
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                {label}
                            </button>
                        );
                    })}
                    {statusFilter && (
                        <button
                            type="button"
                            onClick={() => setStatusFilter(null)}
                            className="text-xs text-muted-foreground hover:text-foreground underline"
                        >
                            Tous
                        </button>
                    )}
                </div>
            </div>

            {/* Time axis */}
            <div className="flex-none border-b px-4 py-1.5 bg-muted/10">
                <div className="relative h-5 ml-72">
                    {monthLabels.map(({ label, left }) => (
                        <span
                            key={label}
                            className="absolute text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                            style={{ left: `${left}%`, transform: "translateX(-50%)" }}
                        >
                            {label}
                        </span>
                    ))}
                </div>
            </div>

            {/* Bar zone */}
            <div className="flex-1 overflow-auto px-4 pt-6 pb-4 min-h-[200px]" ref={containerRef}>
                <div className="relative" style={{ minHeight: `${Math.max(bars.length * 44, 120)}px` }}>
                    {/* Today marker */}
                    {todayLeft >= 0 && todayLeft <= 100 && (
                        <div
                            className="absolute top-0 bottom-0 w-px bg-primary/40 z-10 pointer-events-none"
                            style={{ left: `calc(288px + ${todayLeft}% * (100% - 288px) / 100)` }}
                        >
                            <span
                                className="absolute -top-5 text-xs text-primary/70 font-semibold whitespace-nowrap bg-background/80 rounded"
                            >
                                Aujourd&apos;hui
                            </span>
                        </div>
                    )}

                    {bars.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                            {statusFilter
                                ? `Aucun test "${STATUS_LEGEND.find((s) => s.status === statusFilter)?.label ?? statusFilter}" avec des dates dans cette période.`
                                : "Aucun test avec des dates dans cette période."}
                        </div>
                    ) : (
                        bars.map(({ test, left, width, start, end }, index) => {
                            const colorClasses = getAbtStatusColor(test.abt_status);
                            const locked = isTestPeriodLocked(test.abt_status);
                            const lockedTitle = locked
                                ? `Période figée — ${getAbtStatusLabel(test.abt_status)} (lecture seule)`
                                : `${test.name} — ${format(start, "dd/MM/yyyy", { locale: fr })} → ${format(end, "dd/MM/yyyy", { locale: fr })}\n${getAbtStatusLabel(test.abt_status)}`;

                            return (
                                <div
                                    key={test.id}
                                    className="absolute h-9 flex items-center"
                                    style={{ left: 0, right: 0, top: index * 44 }}
                                >
                                    {/* Test name label */}
                                    <div
                                        className="flex-none w-72 shrink-0 truncate text-sm text-muted-foreground pl-3 pr-3 cursor-pointer hover:text-foreground transition-colors"
                                        onClick={() => onTestClick?.(test)}
                                        title={test.name}
                                    >
                                        {test.name}
                                    </div>

                                    {/* Track */}
                                    <div className="flex-1 relative h-7 rounded-md overflow-visible bg-muted/20">
                                        {/* Segment */}
                                        <div
                                            id={`bar-${test.id}`}
                                            className={cn(
                                                "absolute inset-y-0 rounded-md border select-none group/bar text-foreground",
                                                colorClasses,
                                                locked && "opacity-90"
                                            )}
                                            style={{
                                                left: `${left}%`,
                                                width: `${width}%`,
                                            }}
                                        >
                                            {/* Left resize handle — éditable uniquement */}
                                            {!locked && (
                                                <div
                                                    className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover/bar:opacity-100 transition-opacity flex items-center justify-center z-20"
                                                    onMouseDown={(e) => handleResizeMouseDown(e, test, "left", start, end)}
                                                    title="Déplacer le début"
                                                >
                                                    <div className="w-0.5 h-3 bg-current rounded-full" />
                                                </div>
                                            )}

                                            {/* Middle — drag si éditable, lecture seule sinon */}
                                            <div
                                                className={cn(
                                                    "absolute inset-0 mx-2 flex items-center justify-center overflow-hidden",
                                                    locked ? "cursor-default" : "cursor-grab active:cursor-grabbing"
                                                )}
                                                onMouseDown={
                                                    !locked
                                                        ? (e) => handleBarMouseDown(e, test, start, end)
                                                        : undefined
                                                }
                                                title={lockedTitle}
                                            >
                                                {locked && (
                                                    <Lock className="h-2.5 w-2.5 shrink-0 mr-1 opacity-60 pointer-events-none" />
                                                )}
                                                <span className="text-xs font-medium truncate px-1 pointer-events-none">
                                                    {test.abt_campaign_id ? `#${test.abt_campaign_id}` : test.name}
                                                </span>
                                            </div>

                                            {/* Right resize handle — éditable uniquement */}
                                            {!locked && (
                                                <div
                                                    className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover/bar:opacity-100 transition-opacity flex items-center justify-center z-20"
                                                    onMouseDown={(e) => handleResizeMouseDown(e, test, "right", start, end)}
                                                    title="Déplacer la fin"
                                                >
                                                    <div className="w-0.5 h-3 bg-current rounded-full" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Date labels */}
                                    <div className="flex-none w-[90px] text-xs text-muted-foreground shrink-0 pl-2">
                                        {format(start, "dd/MM")} → {format(end, "dd/MM")}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
