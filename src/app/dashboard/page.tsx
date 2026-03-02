"use client";

import { useState, useEffect, useMemo } from "react";
import { useTests, useRefreshTests } from "@/hooks/useTests";
import { useQueryClient } from "@tanstack/react-query";
import { TestKanban } from "@/components/tests/TestKanban";
import { TestList } from "@/components/tests/TestList";
import { TestTimeline } from "@/components/tests/TestTimeline";
import { TestFilters, EMPTY_FILTERS, applyFilters } from "@/components/tests/TestFilters";
import type { FilterState } from "@/components/tests/TestFilters";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LayoutGrid, List, CalendarRange, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Test } from "@/types/test";

type ViewMode = "kanban" | "list" | "timeline";

export default function DashboardPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: tests, isLoading, error } = useTests();
    const refresh = useRefreshTests();
    const [view, setView] = useState<ViewMode>("kanban");
    const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [newTestOpen, setNewTestOpen] = useState(false);
    const [newTestName, setNewTestName] = useState("");
    const [newTestHypothesis, setNewTestHypothesis] = useState("");
    const [newTestTargetDate, setNewTestTargetDate] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const savedView = localStorage.getItem("orch-abtasty-view") as ViewMode | null;
        if (savedView && ["kanban", "list", "timeline"].includes(savedView)) setView(savedView);
    }, []);

    const handleViewChange = (v: string) => {
        const newView = v as ViewMode;
        setView(newView);
        localStorage.setItem("orch-abtasty-view", newView);
    };

    const handleTestClick = (test: Test) => {
        router.push(`/tests/${test.abt_campaign_id || test.id}`);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refresh();
        setIsRefreshing(false);
    };

    const handleNewTestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = newTestName.trim();
        if (!name) {
            toast.error("Le nom du test est obligatoire.");
            return;
        }
        setIsCreating(true);
        try {
            const res = await fetch("/api/tests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    hypothesis: newTestHypothesis.trim() || undefined,
                    target_start_date: newTestTargetDate || undefined,
                }),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.error || "Échec de la création");
            }
            const created: Test = await res.json();
            await queryClient.invalidateQueries({ queryKey: ["tests"] });
            setNewTestOpen(false);
            setNewTestName("");
            setNewTestHypothesis("");
            setNewTestTargetDate("");
            toast.success("Test créé.");
            router.push(`/tests/${created.id}`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erreur lors de la création du test.");
        } finally {
            setIsCreating(false);
        }
    };

    const filteredTests = useMemo(
        () => applyFilters(tests ?? [], filters),
        [tests, filters]
    );

    if (error) {
        return (
            <div className="container py-10">
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center text-destructive">
                    <h2 className="font-bold text-lg mb-2">Erreur lors du chargement</h2>
                    <p className="text-sm opacity-90">{String(error)}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)]">
            {/* Dashboard Sub-header */}
            <div className="border-b bg-card/20 backdrop-blur-sm px-6 py-3 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-sm text-muted-foreground">
                            {tests
                                ? filteredTests.length < tests.length
                                    ? `${filteredTests.length} / ${tests.length} tests`
                                    : `${tests.length} tests`
                                : "Chargement..."}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Tabs value={view} onValueChange={handleViewChange} className="w-auto">
                            <TabsList className="grid w-full grid-cols-3 h-9 p-1">
                                <TabsTrigger value="kanban" className="px-3">
                                    <LayoutGrid className="w-4 h-4 mr-2" />
                                    <span className="hidden sm:inline">Kanban</span>
                                </TabsTrigger>
                                <TabsTrigger value="list" className="px-3">
                                    <List className="w-4 h-4 mr-2" />
                                    <span className="hidden sm:inline">Liste</span>
                                </TabsTrigger>
                                <TabsTrigger value="timeline" className="px-3">
                                    <CalendarRange className="w-4 h-4 mr-2" />
                                    <span className="hidden sm:inline">Timeline</span>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                            <span className="hidden sm:inline">Rafraîchir</span>
                        </Button>

                        <Button
                            size="sm"
                            className="shadow-lg shadow-primary/20"
                            onClick={() => setNewTestOpen(true)}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Nouveau test</span>
                        </Button>
                    </div>
                </div>

                {/* Filtres */}
                {!isLoading && (
                    <TestFilters
                        filters={filters}
                        onChange={setFilters}
                        tests={tests ?? []}
                    />
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden p-6">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-[200px] rounded-xl" />
                        ))}
                    </div>
                ) : (
                    <div className="h-full">
                        {view === "kanban" && (
                            <TestKanban tests={filteredTests} onTestClick={handleTestClick} />
                        )}
                        {view === "list" && (
                            <div className="overflow-auto h-full px-1">
                                <TestList tests={filteredTests} onTestClick={handleTestClick} />
                            </div>
                        )}
                        {view === "timeline" && (
                            <TestTimeline tests={filteredTests} onTestClick={handleTestClick} />
                        )}
                    </div>
                )}
            </div>

            <Dialog open={newTestOpen} onOpenChange={setNewTestOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Nouveau test</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleNewTestSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="new-test-name" className="text-sm font-medium">Nom du test *</label>
                            <Input
                                id="new-test-name"
                                value={newTestName}
                                onChange={(e) => setNewTestName(e.target.value)}
                                placeholder="Ex. Test bandeau promo"
                                required
                                className="bg-background/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="new-test-hypothesis" className="text-sm font-medium">Hypothèse (optionnel)</label>
                            <Textarea
                                id="new-test-hypothesis"
                                value={newTestHypothesis}
                                onChange={(e) => setNewTestHypothesis(e.target.value)}
                                placeholder="Décrivez l'objectif du test..."
                                rows={2}
                                className="bg-background/50 resize-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="new-test-date" className="text-sm font-medium">Date de lancement souhaitée (optionnel)</label>
                            <Input
                                id="new-test-date"
                                type="date"
                                value={newTestTargetDate}
                                onChange={(e) => setNewTestTargetDate(e.target.value)}
                                className="bg-background/50"
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setNewTestOpen(false)}
                                disabled={isCreating}
                            >
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isCreating}>
                                {isCreating ? "Création..." : "Créer et ouvrir"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
