"use client";

import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import type { Test } from "@/types/test";
import { getTypeColor, getTypeDotClass } from "@/lib/status-mapping";
import { TestCard } from "./TestCard";
import { cn } from "@/lib/utils";

interface TestKanbanProps {
    tests: Test[];
    onTestClick?: (test: Test) => void;
}

const NULL_TYPE_KEY = "__no_type__";

function getColumns(tests: Test[]): { key: string; label: string; tests: Test[] }[] {
    const typeMap = new Map<string, Test[]>();

    for (const test of tests) {
        const key = test.type ?? NULL_TYPE_KEY;
        if (!typeMap.has(key)) typeMap.set(key, []);
        typeMap.get(key)!.push(test);
    }

    const columns: { key: string; label: string; tests: Test[] }[] = [];

    // Types sorted alphabetically, "no type" at the end
    const sortedKeys = Array.from(typeMap.keys())
        .filter((k) => k !== NULL_TYPE_KEY)
        .sort();

    for (const key of sortedKeys) {
        columns.push({ key, label: key.toUpperCase(), tests: typeMap.get(key)! });
    }

    if (typeMap.has(NULL_TYPE_KEY)) {
        columns.push({ key: NULL_TYPE_KEY, label: "Sans type", tests: typeMap.get(NULL_TYPE_KEY)! });
    }

    return columns;
}

export function TestKanban({ tests, onTestClick }: TestKanbanProps) {
    const columns = getColumns(tests);

    // Drag-and-drop only reorders within the same column (read-only between types)
    const onDragEnd = (_result: DropResult) => {
        // Type is sourced from ABT and is read-only — no cross-column moves
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-full gap-4 overflow-x-auto pb-4 px-2 custom-scrollbar">
                {columns.length === 0 ? (
                    <div className="flex items-center justify-center w-full text-sm text-muted-foreground">
                        Aucun test à afficher.
                    </div>
                ) : (
                    columns.map(({ key, label, tests: colTests }) => {
                        const colorClasses = getTypeColor(key !== NULL_TYPE_KEY ? key : null);
                        const dotClass = getTypeDotClass(key !== NULL_TYPE_KEY ? key : null);

                        return (
                            <div key={key} className="flex flex-col min-w-[300px] w-[300px] gap-4">
                                <div className="flex items-center justify-between px-2">
                                    <h2 className="text-sm font-semibold flex items-center gap-2">
                                        <span
                                            className={cn(
                                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border",
                                                colorClasses
                                            )}
                                        >
                                            <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", dotClass)} />
                                            {label}
                                        </span>
                                        <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded text-[10px] font-mono">
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
                    })
                )}
            </div>
        </DragDropContext>
    );
}
