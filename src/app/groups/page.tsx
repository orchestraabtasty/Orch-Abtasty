"use client";

import { useEffect, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useTests } from "@/hooks/useTests";
import {
    useGroups,
    useAssignGroup,
    useUnassignGroup,
    useCreateGroup,
    useUpdateGroup,
    useDeleteGroup,
} from "@/hooks/useGroups";
import type { Test, TestGroup } from "@/types/test";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers, Plus, AlertCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

function GroupColumnHeader({ group, count }: { group: TestGroup; count: number }) {
    return (
        <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
                <span
                    className="w-3 h-3 rounded-full shrink-0 border border-white/40"
                    style={{ backgroundColor: group.color ?? "#6b7280" }}
                />
                <span className="font-medium text-sm truncate">{group.name}</span>
            </div>
            <Badge variant="secondary" className="text-[11px] px-1.5">
                {count}
            </Badge>
        </div>
    );
}

export default function GroupsPage() {
    const { data: tests = [], isLoading: isLoadingTests, error: testsError } = useTests();
    const { data: groups = [], isLoading: isLoadingGroups, error: groupsError } = useGroups();
    const assignGroup = useAssignGroup();
    const unassignGroup = useUnassignGroup();
    const createGroup = useCreateGroup();
    const updateGroup = useUpdateGroup();
    const deleteGroup = useDeleteGroup();

    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupColor, setNewGroupColor] = useState("#6366f1");

    useEffect(() => {
        if (!selectedGroupId && groups.length > 0) {
            setSelectedGroupId(groups[0].id);
        }
    }, [groups, selectedGroupId]);

    const activeGroup = groups.find((g) => g.id === selectedGroupId) ?? null;

    const { inGroup, outOfGroup } = useMemo(() => {
        if (!activeGroup) return { inGroup: [] as Test[], outOfGroup: [] as Test[] };
        const inG: Test[] = [];
        const outG: Test[] = [];
        const q = search.trim().toLowerCase();

        for (const t of tests) {
            const isIn = t.groups.some((g) => g.id === activeGroup.id);
            const matches =
                !q ||
                t.name.toLowerCase().includes(q) ||
                (t.hypothesis ?? "").toLowerCase().includes(q) ||
                (t.abt_campaign_id ?? "").toLowerCase().includes(q);
            if (!matches) continue;
            if (isIn) inG.push(t);
            else outG.push(t);
        }
        return { inGroup: inG, outOfGroup: outG };
    }, [tests, activeGroup, search]);

    const onDragEnd = (result: DropResult) => {
        if (!activeGroup) return;
        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId) return;

        if (destination.droppableId === "in-group") {
            assignGroup.mutate({ group_id: activeGroup.id, test_id: draggableId });
        } else if (destination.droppableId === "out-of-group") {
            unassignGroup.mutate({ group_id: activeGroup.id, test_id: draggableId });
        }
    };

    const isLoading = isLoadingTests || isLoadingGroups;
    const hasError = testsError || groupsError;

    return (
        <div className="flex flex-col h-[calc(100vh-64px)]">
            <div className="border-b bg-card/20 backdrop-blur-sm px-6 py-3 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-primary" />
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Groupes</h1>
                            <p className="text-sm text-muted-foreground">
                                Organisez vos tests et idées par groupes, via glisser-déposer.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Filtrer par nom, hypothèse ou ID ABT…"
                                className="h-8 w-64 bg-background/50 border-border/60 text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden px-6 py-5 gap-5">
                {/* Liste des groupes */}
                <Card className="w-64 shrink-0 h-full flex flex-col">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold">Groupes</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden">
                        {/* Création rapide de groupe */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <Input
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    placeholder="Nouveau groupe..."
                                    className="h-8 text-xs"
                                />
                                <input
                                    type="color"
                                    value={newGroupColor}
                                    onChange={(e) => setNewGroupColor(e.target.value)}
                                    className="h-8 w-8 rounded border border-border/50 cursor-pointer shrink-0 bg-transparent"
                                    title="Couleur du groupe"
                                />
                                <Button
                                    size="sm"
                                    className="h-8 px-2 text-xs"
                                    disabled={!newGroupName.trim() || createGroup.isPending}
                                    onClick={() => {
                                        const name = newGroupName.trim();
                                        if (!name) return;
                                        createGroup.mutate(
                                            { name, color: newGroupColor },
                                            { onSuccess: () => { setNewGroupName(""); setNewGroupColor("#6366f1"); } }
                                        );
                                    }}
                                >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Créer
                                </Button>
                            </div>
                        </div>

                        {isLoading && (
                            <div className="space-y-2">
                                <Skeleton className="h-7 rounded-md" />
                                <Skeleton className="h-7 rounded-md" />
                                <Skeleton className="h-7 rounded-md" />
                            </div>
                        )}
                        {!isLoading && groups.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                                Aucun groupe créé. Utilise le champ ci-dessus pour créer votre premier groupe.
                            </p>
                        )}
                        {!isLoading && groups.length > 0 && (
                            <div className="flex-1 overflow-auto space-y-1">
                                {groups.map((g) => (
                                    <div
                                        key={g.id}
                                        className={cn(
                                            "group/row w-full flex items-center gap-1 px-2 py-1.5 rounded-md text-sm transition-colors",
                                            g.id === activeGroup?.id
                                                ? "bg-primary/10 text-primary border border-primary/40"
                                                : "hover:bg-muted/60"
                                        )}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setSelectedGroupId(g.id)}
                                            className="flex-1 flex items-center gap-2 min-w-0 text-left"
                                        >
                                            <span
                                                className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/40"
                                                style={{ backgroundColor: g.color ?? "#6b7280" }}
                                            />
                                            <span className="truncate">{g.name}</span>
                                        </button>
                                        <input
                                            type="color"
                                            value={g.color ?? "#6b7280"}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                updateGroup.mutate({ id: g.id, color: e.target.value });
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-5 w-5 min-w-5 rounded border border-border/50 cursor-pointer shrink-0 bg-transparent"
                                            title="Changer la couleur"
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!confirm(`Supprimer le groupe "${g.name}" ? Les tests associés ne seront pas supprimés.`)) return;
                                                // Si on supprime le groupe actif, sélectionner le suivant disponible
                                                if (g.id === selectedGroupId) {
                                                    const next = groups.find((x) => x.id !== g.id);
                                                    setSelectedGroupId(next?.id ?? null);
                                                }
                                                deleteGroup.mutate(g.id);
                                            }}
                                            disabled={deleteGroup.isPending}
                                            className="h-5 w-5 min-w-5 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                                            title="Supprimer ce groupe"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Zone de glisser-déposer */}
                <div className="flex-1 flex flex-col gap-4">
                    {hasError && (
                        <div className="mb-2 flex items-center gap-2 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            <span>Erreur lors du chargement des tests ou des groupes.</span>
                        </div>
                    )}
                    {!activeGroup ? (
                        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                            Crée ou sélectionne un groupe pour commencer.
                        </div>
                    ) : (
                        <DragDropContext onDragEnd={onDragEnd}>
                            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[300px]">
                                {/* Colonne : dans le groupe */}
                                <Card className="flex flex-col h-full">
                                    <CardHeader className="pb-2">
                                        <GroupColumnHeader group={activeGroup} count={inGroup.length} />
                                    </CardHeader>
                                    <CardContent className="flex-1 overflow-hidden">
                                        <Droppable droppableId="in-group">
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    className={cn(
                                                        "h-full rounded-md border border-dashed border-border/40 bg-muted/20 p-2 overflow-auto space-y-1",
                                                        snapshot.isDraggingOver && "border-primary/50 bg-primary/5"
                                                    )}
                                                >
                                                    {inGroup.length === 0 && (
                                                        <p className="text-xs text-muted-foreground px-1 py-2">
                                                            Glisse des tests/idéess ici pour les lier à ce groupe.
                                                        </p>
                                                    )}
                                                    {inGroup.map((t, index) => (
                                                        <Draggable
                                                            key={t.id}
                                                            draggableId={t.id}
                                                            index={index}
                                                        >
                                                            {(dragProvided, dragSnapshot) => (
                                                                <div
                                                                    ref={dragProvided.innerRef}
                                                                    {...dragProvided.draggableProps}
                                                                    {...dragProvided.dragHandleProps}
                                                                    className={cn(
                                                                        "px-2 py-1.5 rounded-md bg-card/60 border border-border/50 text-xs flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing",
                                                                        dragSnapshot.isDragging && "shadow-md border-primary/50"
                                                                    )}
                                                                >
                                                                    <span className="truncate">
                                                                        {t.name}
                                                                    </span>
                                                                    {t.abt_campaign_id && (
                                                                        <span className="text-[10px] font-mono opacity-60">
                                                                            #{t.abt_campaign_id}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </CardContent>
                                </Card>

                                {/* Colonne : hors du groupe */}
                                <Card className="flex flex-col h-full">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm">
                                                    Autres tests & idées
                                                </span>
                                            </div>
                                            <Badge variant="outline" className="text-[11px] px-1.5">
                                                {outOfGroup.length}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1 overflow-hidden">
                                        <Droppable droppableId="out-of-group">
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    className={cn(
                                                        "h-full rounded-md border border-dashed border-border/40 bg-muted/10 p-2 overflow-auto space-y-1",
                                                        snapshot.isDraggingOver && "border-primary/50 bg-primary/5"
                                                    )}
                                                >
                                                    {outOfGroup.length === 0 && (
                                                        <p className="text-xs text-muted-foreground px-1 py-2">
                                                            Tous les éléments correspondant au filtre sont déjà dans ce groupe.
                                                        </p>
                                                    )}
                                                    {outOfGroup.map((t, index) => (
                                                        <Draggable
                                                            key={t.id}
                                                            draggableId={t.id}
                                                            index={index}
                                                        >
                                                            {(dragProvided, dragSnapshot) => (
                                                                <div
                                                                    ref={dragProvided.innerRef}
                                                                    {...dragProvided.draggableProps}
                                                                    {...dragProvided.dragHandleProps}
                                                                    className={cn(
                                                                        "px-2 py-1.5 rounded-md bg-card/40 border border-border/40 text-xs flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing",
                                                                        dragSnapshot.isDragging && "shadow-md border-primary/50"
                                                                    )}
                                                                >
                                                                    <span className="truncate">
                                                                        {t.name}
                                                                    </span>
                                                                    {t.abt_campaign_id && (
                                                                        <span className="text-[10px] font-mono opacity-60">
                                                                            #{t.abt_campaign_id}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </CardContent>
                                </Card>
                            </div>
                        </DragDropContext>
                    )}
                </div>
            </div>
        </div>
    );
}

