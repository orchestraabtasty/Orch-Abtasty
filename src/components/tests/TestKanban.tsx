"use client";

import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import type { Test, InternalStatus } from "@/types/test";
import { ALL_STATUSES, getStatusLabel } from "@/lib/status-mapping";
import { TestCard } from "./TestCard";
import { useUpdateTestStatus } from "@/hooks/useTests";
import { cn } from "@/lib/utils";

interface TestKanbanProps {
    tests: Test[];
    onTestClick?: (test: Test) => void;
}

export function TestKanban({ tests, onTestClick }: TestKanbanProps) {
    const updateStatus = useUpdateTestStatus();

    // Group tests by status
    const columns = ALL_STATUSES.reduce((acc, status) => {
        acc[status] = tests.filter((t) => t.internal_status === status);
        return acc;
    }, {} as Record<InternalStatus, Test[]>);

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) return;

        const newStatus = destination.droppableId as InternalStatus;
        updateStatus.mutate({ id: draggableId, internal_status: newStatus });
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-full gap-4 overflow-x-auto pb-4 px-2 custom-scrollbar">
                {ALL_STATUSES.map((status) => (
                    <div key={status} className="flex flex-col min-w-[300px] w-[300px] gap-4">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-sm font-semibold flex items-center gap-2">
                                {getStatusLabel(status)}
                                <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded text-[10px] font-mono">
                                    {columns[status].length}
                                </span>
                            </h2>
                        </div>

                        <Droppable droppableId={status}>
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
                                        {columns[status].map((test, index) => (
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
                ))}
            </div>
        </DragDropContext>
    );
}
