"use client";

import { useState, useEffect } from "react";
import { useTests } from "@/hooks/useTests";
import { TestKanban } from "@/components/tests/TestKanban";
import { TestList } from "@/components/tests/TestList";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutGrid, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import type { Test } from "@/types/test";

export default function DashboardPage() {
    const router = useRouter();
    const { data: tests, isLoading, error } = useTests();
    const [view, setView] = useState<"kanban" | "list">("kanban");

    // Load view preference from localStorage if available
    useEffect(() => {
        const savedView = localStorage.getItem("orch-abtasty-view") as "kanban" | "list";
        if (savedView) setView(savedView);
    }, []);

    const handleViewChange = (v: string) => {
        const newView = v as "kanban" | "list";
        setView(newView);
        localStorage.setItem("orch-abtasty-view", newView);
    };

    const handleTestClick = (test: Test) => {
        router.push(`/tests/${test.abt_campaign_id || test.id}`);
    };

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
            <div className="border-b bg-card/20 backdrop-blur-sm px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">
                        {tests ? `${tests.length} tests identifiés` : "Chargement..."}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Tabs value={view} onValueChange={handleViewChange} className="w-auto">
                        <TabsList className="grid w-full grid-cols-2 h-9 p-1">
                            <TabsTrigger value="kanban" className="px-3">
                                <LayoutGrid className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">Kanban</span>
                            </TabsTrigger>
                            <TabsTrigger value="list" className="px-3">
                                <List className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">Liste</span>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <Button size="sm" className="shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4 mr-2" />
                        Nouveau test
                    </Button>
                </div>
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
                        {view === "kanban" ? (
                            <TestKanban tests={tests || []} onTestClick={handleTestClick} />
                        ) : (
                            <div className="overflow-auto h-full px-1">
                                <TestList tests={tests || []} onTestClick={handleTestClick} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
