"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, LogIn } from "lucide-react";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error: authError } = await supabaseBrowser.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError("Email ou mot de passe incorrect.");
            setLoading(false);
            return;
        }

        // Vérifier le profil (status) avant de rediriger
        const { data: { user } } = await supabaseBrowser.auth.getUser();
        if (user) {
            const { data: profile } = await supabaseBrowser
                .from("profiles")
                .select("status")
                .eq("id", user.id)
                .single();

            if (profile?.status !== "approved") {
                router.push("/pending");
                return;
            }
        }

        router.push(redirectTo);
        router.refresh();
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
                            <LogIn className="w-5 h-5" />
                            Connexion
                        </CardTitle>
                        <CardDescription>Connectez-vous à votre compte pour accéder à l&apos;application.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label htmlFor="email" className="text-sm font-medium">
                                    Email
                                </label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="vous@exemple.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    className="bg-background/50"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="password" className="text-sm font-medium">
                                    Mot de passe
                                </label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
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
                                <div className="text-right">
                                    <Link
                                        href="/forgot-password"
                                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        Mot de passe oublié ?
                                    </Link>
                                </div>
                            </div>

                            {error && (
                                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md border border-destructive/20">
                                    {error}
                                </p>
                            )}

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Connexion..." : "Se connecter"}
                            </Button>
                        </form>

                        <div className="mt-4 text-center text-sm text-muted-foreground">
                            Pas encore de compte ?{" "}
                            <Link href="/signup" className="text-primary hover:underline font-medium">
                                Créer un compte
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginForm />
        </Suspense>
    );
}
