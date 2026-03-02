"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Test, InternalStatus } from "@/types/test";

const TESTS_KEY = ["tests"] as const;

export function useTests() {
    return useQuery({
        queryKey: TESTS_KEY,
        queryFn: async (): Promise<Test[]> => {
            const res = await fetch("/api/abt/campaigns");
            if (!res.ok) throw new Error("Failed to fetch tests");
            const json = await res.json();
            return json.data;
        },
    });
}

export function useTest(id: string) {
    return useQuery({
        queryKey: ["test", id],
        queryFn: async () => {
            const res = await fetch(`/api/abt/campaigns/${id}`);
            if (!res.ok) throw new Error("Failed to fetch test");
            return res.json();
        },
        enabled: !!id,
    });
}

export function useRefreshTests() {
    const qc = useQueryClient();
    return () => qc.invalidateQueries({ queryKey: TESTS_KEY });
}

// ——————————————————————————————————————
// Optimistic status update
// ——————————————————————————————————————
export function useUpdateTestStatus() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            internal_status,
        }: {
            id: string;
            internal_status: InternalStatus;
        }) => {
            const res = await fetch(`/api/abt/campaigns/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ internal_status }),
            });
            if (!res.ok) throw new Error("Failed to update status");
            return res.json();
        },

        onMutate: async ({ id, internal_status }) => {
            await qc.cancelQueries({ queryKey: TESTS_KEY });
            const previous = qc.getQueryData<Test[]>(TESTS_KEY);

            qc.setQueryData<Test[]>(TESTS_KEY, (old) =>
                old?.map((t) => (t.id === id ? { ...t, internal_status } : t))
            );

            return { previous };
        },

        onError: (_err, _vars, context) => {
            if (context?.previous) {
                qc.setQueryData(TESTS_KEY, context.previous);
            }
            toast.error("Échec de la mise à jour du statut — rollback effectué.");
        },

        onSuccess: () => {
            qc.invalidateQueries({ queryKey: TESTS_KEY });
            toast.success("Statut mis à jour avec succès.");
        },
    });
}

// ——————————————————————————————————————
// Optimistic metadata update (hypothesis, comment, tags…)
// ——————————————————————————————————————
export function useUpdateTestMeta() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: string;
            data: Partial<Test>;
        }) => {
            const res = await fetch(`/api/abt/campaigns/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update test");
            return res.json();
        },

        onSuccess: (_data, { id }) => {
            qc.invalidateQueries({ queryKey: TESTS_KEY });
            qc.invalidateQueries({ queryKey: ["test", id] });
            toast.success("Test mis à jour.");
        },

        onError: () => {
            toast.error("Erreur lors de la mise à jour.");
        },
    });
}

// ——————————————————————————————————————
// Optimistic dates update (timeline drag / resize)
// ——————————————————————————————————————
export function useUpdateTestDates() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            start_date,
            end_date,
            target_start_date,
        }: {
            id: string;
            start_date?: string;
            end_date?: string;
            target_start_date?: string;
        }) => {
            const payload: Record<string, string> = {};
            if (start_date)         payload.start_date = start_date;
            if (end_date)           payload.end_date = end_date;
            if (target_start_date)  payload.target_start_date = target_start_date;

            const res = await fetch(`/api/abt/campaigns/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Failed to update dates");
            return res.json();
        },

        onMutate: async ({ id, start_date, end_date, target_start_date }) => {
            await qc.cancelQueries({ queryKey: TESTS_KEY });
            const previous = qc.getQueryData<Test[]>(TESTS_KEY);
            qc.setQueryData<Test[]>(TESTS_KEY, (old) =>
                old?.map((t) =>
                    t.id === id
                        ? {
                              ...t,
                              ...(start_date        && { start_date }),
                              ...(end_date          && { end_date }),
                              ...(target_start_date && { target_start_date }),
                          }
                        : t
                )
            );
            return { previous };
        },

        onError: (_err, _vars, context) => {
            if (context?.previous) qc.setQueryData(TESTS_KEY, context.previous);
            toast.error("Échec de la mise à jour des dates.");
        },

        onSuccess: () => {
            qc.invalidateQueries({ queryKey: TESTS_KEY });
        },
    });
}
