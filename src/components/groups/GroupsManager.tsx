"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useGroups, useCreateGroup, useUpdateGroup, useDeleteGroup } from "@/hooks/useGroups";
import { cn } from "@/lib/utils";
import { Layers, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import type { TestGroup } from "@/types/test";

const GROUP_COLORS = [
    { label: "Bleu",    value: "#3b82f6" },
    { label: "Violet",  value: "#8b5cf6" },
    { label: "Vert",    value: "#22c55e" },
    { label: "Orange",  value: "#f97316" },
    { label: "Rose",    value: "#ec4899" },
    { label: "Cyan",    value: "#06b6d4" },
    { label: "Jaune",   value: "#eab308" },
    { label: "Rouge",   value: "#ef4444" },
    { label: "Gris",    value: "#6b7280" },
];

function ColorPicker({ value, onChange }: { value: string | null; onChange: (c: string) => void }) {
    return (
        <div className="flex flex-wrap gap-1.5 mt-1">
            {GROUP_COLORS.map((c) => (
                <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => onChange(c.value)}
                    className={cn(
                        "w-5 h-5 rounded-full border-2 transition-transform hover:scale-110",
                        value === c.value ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: c.value }}
                />
            ))}
        </div>
    );
}

function GroupRow({ group }: { group: TestGroup }) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(group.name);
    const [color, setColor] = useState<string | null>(group.color);
    const updateGroup = useUpdateGroup();
    const deleteGroup = useDeleteGroup();

    const handleSave = () => {
        if (!name.trim()) return;
        updateGroup.mutate({ id: group.id, name: name.trim(), color });
        setEditing(false);
    };

    const handleCancel = () => {
        setName(group.name);
        setColor(group.color);
        setEditing(false);
    };

    if (editing) {
        return (
            <div className="flex flex-col gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleSave();
                        if (e.key === "Escape") handleCancel();
                    }}
                />
                <ColorPicker value={color} onChange={setColor} />
                <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={handleCancel}>
                        <X className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={!name.trim()}>
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Sauvegarder
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/30 group">
            <div className="flex items-center gap-2 min-w-0">
                <span
                    className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                    style={{ backgroundColor: group.color ?? "#6b7280" }}
                />
                <span className="text-sm truncate">{group.name}</span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => setEditing(true)}
                >
                    <Pencil className="h-3 w-3" />
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={() => deleteGroup.mutate(group.id)}
                >
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );
}

function CreateGroupForm({ onDone }: { onDone: () => void }) {
    const [name, setName] = useState("");
    const [color, setColor] = useState<string | null>(GROUP_COLORS[0].value);
    const createGroup = useCreateGroup();

    const handleSubmit = () => {
        if (!name.trim()) return;
        createGroup.mutate({ name: name.trim(), color }, {
            onSuccess: () => {
                setName("");
                setColor(GROUP_COLORS[0].value);
                onDone();
            },
        });
    };

    return (
        <div className="flex flex-col gap-2 p-3 rounded-lg border border-dashed border-border/50 bg-muted/10">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nouveau groupe</p>
            <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom du groupe..."
                className="h-8 text-sm"
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            />
            <ColorPicker value={color} onChange={setColor} />
            <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!name.trim() || createGroup.isPending}
                className="self-end"
            >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Créer
            </Button>
        </div>
    );
}

export function GroupsManagerButton() {
    const [open, setOpen] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const { data: groups = [], isLoading } = useGroups();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                    <Layers className="h-3.5 w-3.5" />
                    Groupes
                    {groups.length > 0 && (
                        <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                            {groups.length}
                        </Badge>
                    )}
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <Layers className="h-4 w-4" />
                        Gérer les groupes
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-3 py-2">
                    {isLoading && (
                        <p className="text-sm text-muted-foreground text-center py-4">Chargement…</p>
                    )}

                    {!isLoading && groups.length === 0 && !showCreate && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Aucun groupe créé. Créez votre premier groupe pour organiser vos tests.
                        </p>
                    )}

                    {!isLoading && groups.length > 0 && (
                        <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                            {groups.map((g) => (
                                <GroupRow key={g.id} group={g} />
                            ))}
                        </div>
                    )}

                    {showCreate ? (
                        <CreateGroupForm onDone={() => setShowCreate(false)} />
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-1.5"
                            onClick={() => setShowCreate(true)}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Nouveau groupe
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
