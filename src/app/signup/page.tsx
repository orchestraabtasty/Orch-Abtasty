"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, UserPlus } from "lucide-react";

export default function SignupPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

        const { error: authError } = await supabaseBrowser.auth.signUp({
            email,
            password,
            options: {
                data: { name },
            },
        });

        if (authError) {
            setError(authError.message === "User already registered"
                ? "Un compte existe déjà avec cet email."
                : authError.message);
            setLoading(false);
            return;
        }

        // Rediriger vers /pending : le compte est créé mais doit être validé
        router.push("/pending");
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
                            <UserPlus className="w-5 h-5" />
                            Créer un compte
                        </CardTitle>
                        <CardDescription>
                            Votre compte sera activé après validation par un administrateur.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label htmlFor="name" className="text-sm font-medium">
                                    Nom complet
                                </label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Jean Dupont"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    autoComplete="name"
                                    className="bg-background/50"
                                />
                            </div>

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
                                    Confirmer le mot de passe
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
                                {loading ? "Création..." : "Créer mon compte"}
                            </Button>
                        </form>

                        <div className="mt-4 text-center text-sm text-muted-foreground">
                            Déjà un compte ?{" "}
                            <Link href="/login" className="text-primary hover:underline font-medium">
                                Se connecter
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
