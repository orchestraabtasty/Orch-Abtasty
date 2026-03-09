"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { GlobalSearch } from "./GlobalSearch";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { RefreshCw, LayoutDashboard, Settings, Layers, LogIn, LogOut, User, Shield } from "lucide-react";
import { useRefreshTests } from "@/hooks/useTests";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const refresh = useRefreshTests();
    const { user, profile, loading, signOut } = useAuth();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const isApproved = profile?.status === "approved";
    const isAdmin = profile?.role === "admin";

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refresh();
        setTimeout(() => setIsRefreshing(false), 600);
    };

    const handleSignOut = async () => {
        await signOut();
        router.push("/login");
        router.refresh();
    };

    const navLink = (href: string) =>
        cn(
            "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2",
            pathname.startsWith(href) ? "text-foreground" : "text-muted-foreground"
        );

    // Pages auth : afficher seulement le logo sans nav
    const isAuthPage = ["/login", "/signup", "/pending", "/reset-password", "/forgot-password"].some(
        (p) => pathname === p || pathname.startsWith(p + "/")
    );

    if (isAuthPage) {
        return (
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                <div className="w-full px-6 flex h-16 items-center">
                    <span className="font-bold text-xl tracking-tight text-[#e32638]">Orch-Abtasty</span>
                    <div className="ml-auto">
                        <ThemeToggle />
                    </div>
                </div>
            </header>
        );
    }

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
                    {!loading && isApproved && (
                        <nav className="hidden md:flex gap-6">
                            <Link href="/dashboard" className={navLink("/dashboard")}>
                                <LayoutDashboard className="w-4 h-4" />
                                Dashboard
                            </Link>
                            <Link href="/groups" className={navLink("/groups")}>
                                <Layers className="w-4 h-4" />
                                Groupes
                            </Link>
                            {isAdmin && (
                                <Link href="/settings" className={navLink("/settings")}>
                                    <Settings className="w-4 h-4" />
                                    Settings
                                </Link>
                            )}
                        </nav>
                    )}
                </div>

                {/* Center : global search */}
                {!loading && isApproved && (
                    <div className="flex-1 flex justify-center px-4">
                        <GlobalSearch />
                    </div>
                )}
                {(loading || !isApproved) && <div className="flex-1" />}

                {/* Right : actions */}
                <div className="flex items-center gap-2 shrink-0">
                    {!loading && isApproved && (
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
                    )}
                    <ThemeToggle />

                    {/* Utilisateur connecté */}
                    {!loading && user && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="flex items-center gap-2 rounded-full border border-border/50 px-2.5 py-1.5 text-sm hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary shrink-0">
                                        {isAdmin ? <Shield className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                                    </div>
                                    <span className="hidden sm:block text-xs font-medium max-w-[100px] truncate">
                                        {profile?.name ?? profile?.email ?? user.email ?? "Compte"}
                                    </span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                                    <p className="font-semibold text-foreground truncate">{profile?.name ?? "Utilisateur"}</p>
                                    <p className="truncate opacity-60 text-[11px]">{profile?.email ?? user.email}</p>
                                    <span className={cn(
                                        "inline-flex items-center gap-1 mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                                        isAdmin ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                                    )}>
                                        {isAdmin ? <Shield className="h-2.5 w-2.5" /> : <User className="h-2.5 w-2.5" />}
                                        {isAdmin ? "Admin" : "Membre"}
                                    </span>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-sm text-destructive cursor-pointer focus:text-destructive"
                                    onClick={handleSignOut}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Se déconnecter
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* Non connecté */}
                    {!loading && !user && (
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/login">
                                <LogIn className="mr-1.5 h-4 w-4" />
                                Se connecter
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
