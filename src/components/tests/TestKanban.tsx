"use client";

import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import type { Test } from "@/types/test";
import { TestCard } from "./TestCard";
import { cn } from "@/lib/utils";
import { startOfDay, isBefore } from "date-fns";

interface TestKanbanProps {
    tests: Test[];
    onTestClick?: (test: Test) => void;
}

// ─── Lifecycle stages ────────────────────────────────────────────────────────

const LIFECYCLE_STAGES = [
    { key: "idea",     label: "Idée",       color: "bg-gray-500/15 text-gray-300 border-gray-500/30",   dot: "bg-gray-400" },
    { key: "creating", label: "Création",   color: "bg-blue-500/15 text-blue-300 border-blue-500/30",   dot: "bg-blue-400" },
    { key: "paused",   label: "En pause",   color: "bg-orange-500/15 text-orange-300 border-orange-500/30", dot: "bg-orange-400" },
    { key: "staging",  label: "Recette",    color: "bg-amber-500/15 text-amber-300 border-amber-500/30", dot: "bg-amber-400" },
    { key: "live",     label: "Live",       color: "bg-green-500/15 text-green-300 border-green-500/30",  dot: "bg-green-400" },
    { key: "done",     label: "Terminé",    color: "bg-purple-500/15 text-purple-300 border-purple-500/30", dot: "bg-purple-400" },
] as const;

type LifecycleKey = (typeof LIFECYCLE_STAGES)[number]["key"];

function isEnded(test: Test): boolean {
    if (!test.end_date) return false;
    const d = new Date(test.end_date);
    if (isNaN(d.getTime())) return false;
    const today = startOfDay(new Date());
    return isBefore(startOfDay(d), today);
}

function getLifecycleStage(test: Test): LifecycleKey {
    const abt = test.abt_status?.toLowerCase() ?? "";

    // ABT status takes priority when the test is linked to ABT
    if (test.abt_campaign_id) {
        // 1) Terminé : soit l'API indique clairement un statut d'arrêt,
        // soit on a une end_date dans le passé pour un test qui n'est plus live/QA.
        if (
            ["stopped", "archived", "archive"].includes(abt) ||
            (isEnded(test) && !["play", "active", "in_qa"].includes(abt))
        ) {
            return "done";
        }

        // 2) Recette / QA explicite
        if (abt === "in_qa") return "staging";

        // 3) Live
        if (["play", "active"].includes(abt)) return "live";

        // 4) En pause
        if (["pause", "paused", "interrupted"].includes(abt)) return "paused";

        // 5) Planifié / En création
        if (abt === "scheduled") return "creating";
    }

    // Fall back to internal_status for Orch-managed tests or unmapped ABT statuses
    switch (test.internal_status) {
        case "idea":     return "idea";
        case "creating": return "creating";
        case "staging":  return "staging";
        case "live":     return "live";
        case "done":     return "done";
        default:         return "idea";
    }
}

export function TestKanban({ tests, onTestClick }: TestKanbanProps) {
    // Group tests by lifecycle stage
    const columns: Record<LifecycleKey, Test[]> = {
        idea: [], creating: [], paused: [], staging: [], live: [], done: [],
    };
    for (const test of tests) {
        columns[getLifecycleStage(test)].push(test);
    }

    // Drag-and-drop only reorders within the same column
    const onDragEnd = (_result: DropResult) => {
        // Lifecycle stage is derived from live data — no cross-column moves
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-full gap-4 overflow-x-auto pb-4 px-2 custom-scrollbar">
                {LIFECYCLE_STAGES.map(({ key, label, color, dot }) => {
                    const colTests = columns[key];

                    return (
                        <div key={key} className="flex flex-col min-w-[300px] w-[300px] gap-4">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="text-sm font-semibold flex items-center gap-2">
                                    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border", color)}>
                                        <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", dot)} />
                                        {label}
                                    </span>
                                    <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded text-xs font-mono">
                                        {colTests.length}
                                    </span>
                                </h2>
                            </div>

                            <Droppable droppableId={key}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={cn(
                                            "flex-1 rounded-xl p-2 bg-muted/30 border border-transparent transition-colors min-h-[500px]",
                                            snapshot.isDraggingOver && "bg-muted/50 border-primary/20"
                                        )}
                                    >
                                        <div className="flex flex-col gap-3">
                                            {colTests.map((test, index) => (
                                                <Draggable key={test.id} draggableId={test.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={cn(
                                                                "transition-transform",
                                                                snapshot.isDragging && "z-50"
                                                            )}
                                                        >
                                                            <TestCard
                                                                test={test}
                                                                onClick={() => onTestClick?.(test)}
                                                                className={cn(snapshot.isDragging && "scale-[1.02] shadow-xl border-primary/40")}
                                                            />
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    );
                })}
            </div>
        </DragDropContext>
    );
}
