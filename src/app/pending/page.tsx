"use client";

import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Clock, LogOut, Mail } from "lucide-react";

export default function PendingPage() {
    const router = useRouter();

    const handleSignOut = async () => {
        await supabaseBrowser.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-md space-y-6 text-center">
                <span className="text-3xl font-bold tracking-tight text-[#e32638]">
                    Orch-Abtasty
                </span>

                <div className="flex flex-col items-center gap-4 bg-card/30 border border-border/40 rounded-xl p-8 shadow-sm backdrop-blur-sm">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 border border-amber-500/30">
                        <Clock className="h-8 w-8 text-amber-500" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-xl font-bold tracking-tight">Compte en attente de validation</h1>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                            Votre compte a bien été créé. Un administrateur va examiner votre demande et activer votre accès très prochainement.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-4 py-3 w-full justify-center">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        Vous recevrez une confirmation une fois votre compte approuvé.
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSignOut}
                        className="mt-2 text-muted-foreground"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Se déconnecter
                    </Button>
                </div>
            </div>
        </div>
    );
}
