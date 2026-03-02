"use client";

import { useState, useEffect, useMemo } from "react";
import { useTests } from "@/hooks/useTests";
import { TestKanban } from "@/components/tests/TestKanban";
import { TestList } from "@/components/tests/TestList";
import { TestTimeline } from "@/components/tests/TestTimeline";
import {
    TestFilters,
    EMPTY_FILTERS,
    applyFilters,
    loadFiltersFromStorage,
    saveFiltersToStorage,
} from "@/components/tests/TestFilters";
import type { FilterState } from "@/components/tests/TestFilters";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutGrid, List, CalendarRange } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Test } from "@/types/test";

type ViewMode = "kanban" | "list" | "timeline";

export default function DashboardPage() {
    const router = useRouter();
    const { data: tests, isLoading, error } = useTests();
    const [view, setView] = useState<ViewMode>("kanban");
    const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

    // Restaurer vue + filtres depuis le localStorage au montage
    useEffect(() => {
        const savedView = localStorage.getItem("orch-abtasty-view") as ViewMode | null;
        if (savedView && ["kanban", "list", "timeline"].includes(savedView)) setView(savedView);

        const savedFilters = loadFiltersFromStorage();
        if (savedFilters) setFilters(savedFilters);
    }, []);

    const handleViewChange = (v: string) => {
        const newView = v as ViewMode;
        setView(newView);
        localStorage.setItem("orch-abtasty-view", newView);
    };

    const handleFiltersChange = (next: FilterState) => {
        setFilters(next);
        saveFiltersToStorage(next);
    };

    const handleTestClick = (test: Test) => {
        router.push(`/tests/${test.abt_campaign_id || test.id}`);
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
                    </div>
                </div>

                {/* Filtres */}
                {!isLoading && (
                    <TestFilters
                        filters={filters}
                        onChange={handleFiltersChange}
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
        </div>
    );
}
