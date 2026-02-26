"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { RefreshCw, LayoutDashboard, Settings } from "lucide-react";
import { useRefreshTests } from "@/hooks/useTests";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Header() {
    const refresh = useRefreshTests();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refresh();
        // Simulate a bit of duration for the animation feel
        setTimeout(() => setIsRefreshing(false), 600);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-6 md:gap-10">
                    <Link href="/dashboard" className="flex items-center space-x-2">
                        <span className="inline-block font-bold text-xl tracking-tight bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                            Orch-Abtasty
                        </span>
                    </Link>
                    <nav className="hidden md:flex gap-6">
                        <Link
                            href="/dashboard"
                            className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-2"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </Link>
                        <Link
                            href="/settings"
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary flex items-center gap-2"
                        >
                            <Settings className="w-4 h-4" />
                            Settings
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        className="hidden sm:flex"
                        disabled={isRefreshing}
                    >
                        <RefreshCw
                            className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")}
                        />
                        {isRefreshing ? "Syncing..." : "Refresh"}
                    </Button>
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
