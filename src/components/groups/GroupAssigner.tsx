"use client";

import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useGroups, useAssignGroup, useUnassignGroup } from "@/hooks/useGroups";
import { cn } from "@/lib/utils";
import { Tag, Check } from "lucide-react";
import type { TestGroup } from "@/types/test";

interface GroupAssignerProps {
    testId: string;
    assignedGroups: TestGroup[];
    /** Si fourni, affiche ce contenu comme trigger au lieu de l’icône compacte (ex: page détail). */
    trigger?: React.ReactNode;
}

export function GroupAssigner({ testId, assignedGroups, trigger }: GroupAssignerProps) {
    const { data: allGroups = [] } = useGroups();
    const assignGroup = useAssignGroup();
    const unassignGroup = useUnassignGroup();
    const [open, setOpen] = useState(false);

    const assignedIds = new Set(assignedGroups.map((g) => g.id));

    const toggle = (groupId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (assignedIds.has(groupId)) {
            unassignGroup.mutate({ group_id: groupId, test_id: testId });
        } else {
            assignGroup.mutate({ group_id: groupId, test_id: testId });
        }
    };

    if (allGroups.length === 0) return null;

    const defaultTrigger = (
        <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(true); }}
            className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
            title="Gérer les groupes"
        >
            <Tag className="h-2.5 w-2.5" />
        </button>
    );

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                {trigger ?? defaultTrigger}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Groupes
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allGroups.map((group) => {
                    const assigned = assignedIds.has(group.id);
                    return (
                        <button
                            key={group.id}
                            type="button"
                            className={cn(
                                "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-muted/50 transition-colors text-left",
                                assigned && "text-foreground"
                            )}
                            onClick={(e) => toggle(group.id, e)}
                        >
                            <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: group.color ?? "#6b7280" }}
                            />
                            <span className="flex-1 truncate">{group.name}</span>
                            {assigned && <Check className="h-3 w-3 shrink-0 text-primary" />}
                        </button>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
