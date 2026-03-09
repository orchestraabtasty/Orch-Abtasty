"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionReady, setSessionReady] = useState(false);

    // Supabase Auth échange le token du lien email en session active via onAuthStateChange
    useEffect(() => {
        const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") {
                setSessionReady(true);
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }
        if (password.length < 8) {
            setError("Le mot de passe doit contenir au moins 8 caractères.");
            return;
        }

        setLoading(true);

        const { error: updateError } = await supabaseBrowser.auth.updateUser({ password });

        setLoading(false);

        if (updateError) {
            setError("Erreur lors de la mise à jour. Le lien est peut-être expiré.");
            return;
        }

        setDone(true);
        setTimeout(() => router.push("/login"), 3000);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center">
                    <span className="text-3xl font-bold tracking-tight text-[#e32638]">
                        Orch-Abtasty
                    </span>
                    <p className="text-sm text-muted-foreground mt-1">Orchestration de tests AB Tasty</p>
                </div>

                <Card className="border-border/40 shadow-sm bg-card/30 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <KeyRound className="w-5 h-5" />
                            Réinitialiser le mot de passe
                        </CardTitle>
                        <CardDescription>
                            Choisissez votre nouveau mot de passe.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {done ? (
                            <div className="flex flex-col items-center gap-3 text-center py-2">
                                <CheckCircle className="h-10 w-10 text-green-500" />
                                <p className="text-sm text-muted-foreground">
                                    Mot de passe mis à jour avec succès. Redirection vers la connexion…
                                </p>
                            </div>
                        ) : !sessionReady ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Vérification du lien de réinitialisation…
                            </p>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="password" className="text-sm font-medium">
                                        Nouveau mot de passe
                                    </label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="8 caractères minimum"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            autoComplete="new-password"
                                            className="bg-background/50 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="confirmPassword" className="text-sm font-medium">
                                        Confirmer le nouveau mot de passe
                                    </label>
                                    <Input
                                        id="confirmPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        autoComplete="new-password"
                                        className="bg-background/50"
                                    />
                                </div>

                                {error && (
                                    <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md border border-destructive/20">
                                        {error}
                                    </p>
                                )}

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
