"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { GlobalSearch } from "./GlobalSearch";
import { Button } from "@/components/ui/button";
import { RefreshCw, LayoutDashboard, Settings } from "lucide-react";
import { useRefreshTests } from "@/hooks/useTests";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Header() {
    const pathname = usePathname();
    const refresh = useRefreshTests();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refresh();
        setTimeout(() => setIsRefreshing(false), 600);
    };

    const navLink = (href: string) =>
        cn(
            "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2",
            pathname.startsWith(href) ? "text-foreground" : "text-muted-foreground"
        );

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="w-full px-6 flex h-16 items-center gap-4">
                {/* Left : logo + nav */}
                <div className="flex items-center gap-6 md:gap-8 shrink-0">
                    <Link href="/dashboard" className="flex items-center space-x-2">
                        <span className="inline-block font-bold text-xl tracking-tight text-[#e32638]">
                            Orch-Abtasty
                        </span>
                    </Link>
                    <nav className="hidden md:flex gap-6">
                        <Link href="/dashboard" className={navLink("/dashboard")}>
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </Link>
                        <Link href="/settings" className={navLink("/settings")}>
                            <Settings className="w-4 h-4" />
                            Settings
                        </Link>
                    </nav>
                </div>

                {/* Center : global search */}
                <div className="flex-1 flex justify-center px-4">
                    <GlobalSearch />
                </div>

                {/* Right : actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        className="hidden sm:flex"
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
                        {isRefreshing ? "Syncing..." : "Refresh"}
                    </Button>
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
