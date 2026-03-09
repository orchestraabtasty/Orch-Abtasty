"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Test, TestGroup } from "@/types/test";

const GROUPS_KEY = ["groups"] as const;

export function useGroups() {
    return useQuery({
        queryKey: GROUPS_KEY,
        queryFn: async (): Promise<TestGroup[]> => {
            const res = await fetch("/api/groups");
            if (!res.ok) throw new Error("Failed to fetch groups");
            const json = await res.json();
            return json.data;
        },
    });
}

export function useCreateGroup() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { name: string; color?: string | null; description?: string | null }) => {
            const res = await fetch("/api/groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Failed to create group");
            return res.json() as Promise<TestGroup>;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GROUPS_KEY });
            toast.success("Groupe créé.");
        },
        onError: () => toast.error("Erreur lors de la création du groupe."),
    });
}

export function useUpdateGroup() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...payload }: { id: string; name?: string; color?: string | null; description?: string | null }) => {
            const res = await fetch(`/api/groups/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Failed to update group");
            return res.json() as Promise<TestGroup>;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GROUPS_KEY });
            toast.success("Groupe mis à jour.");
        },
        onError: () => toast.error("Erreur lors de la mise à jour du groupe."),
    });
}

export function useDeleteGroup() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete group");
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GROUPS_KEY });
            // Invalider aussi les tests car les groupes associés changent
            qc.invalidateQueries({ queryKey: ["tests"] });
            toast.success("Groupe supprimé.");
        },
        onError: () => toast.error("Erreur lors de la suppression du groupe."),
    });
}

export function useAssignGroup() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ group_id, test_id }: { group_id: string; test_id: string }) => {
            const res = await fetch("/api/groups/assign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ group_id, test_id }),
            });
            if (!res.ok) throw new Error("Failed to assign group");
        },
        onMutate: async ({ group_id, test_id }) => {
            await qc.cancelQueries({ queryKey: ["tests"] });
            const previous = qc.getQueryData<Test[]>(["tests"]);
            qc.setQueryData<Test[]>(["tests"], (old) =>
                old?.map((t) =>
                    t.id === test_id
                        ? {
                              ...t,
                              groups: t.groups.some((g) => g.id === group_id)
                                  ? t.groups
                                  : [...t.groups, { id: group_id, name: "", color: null }],
                          }
                        : t
                ) ?? old
            );
            return { previous };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.previous) qc.setQueryData(["tests"], ctx.previous);
            toast.error("Erreur lors de l'assignation du groupe.");
        },
        onSuccess: (_data, { test_id }) => {
            qc.invalidateQueries({ queryKey: ["tests"] });
            qc.invalidateQueries({ queryKey: ["test", test_id] });
        },
    });
}

export function useUnassignGroup() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ group_id, test_id }: { group_id: string; test_id: string }) => {
            const res = await fetch("/api/groups/assign", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ group_id, test_id }),
            });
            if (!res.ok) throw new Error("Failed to unassign group");
        },
        onMutate: async ({ group_id, test_id }) => {
            await qc.cancelQueries({ queryKey: ["tests"] });
            const previous = qc.getQueryData<Test[]>(["tests"]);
            qc.setQueryData<Test[]>(["tests"], (old) =>
                old?.map((t) =>
                    t.id === test_id
                        ? {
                              ...t,
                              groups: t.groups.filter((g) => g.id !== group_id),
                          }
                        : t
                ) ?? old
            );
            return { previous };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.previous) qc.setQueryData(["tests"], ctx.previous);
            toast.error("Erreur lors du retrait du groupe.");
        },
        onSuccess: (_data, { test_id }) => {
            qc.invalidateQueries({ queryKey: ["tests"] });
            qc.invalidateQueries({ queryKey: ["test", test_id] });
        },
    });
}
