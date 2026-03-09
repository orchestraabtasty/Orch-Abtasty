"use client";

import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const { error: resetError } = await supabaseBrowser.auth.resetPasswordForEmail(email, {
            redirectTo: `${siteUrl}/reset-password`,
        });

        setLoading(false);

        if (resetError) {
            setError("Une erreur est survenue. Veuillez réessayer.");
            return;
        }

        setSent(true);
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
                            Mot de passe oublié
                        </CardTitle>
                        <CardDescription>
                            Entrez votre email et nous vous enverrons un lien de réinitialisation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {sent ? (
                            <div className="flex flex-col items-center gap-3 text-center py-2">
                                <CheckCircle className="h-10 w-10 text-green-500" />
                                <p className="text-sm text-muted-foreground">
                                    Si un compte existe pour <strong>{email}</strong>, un email de réinitialisation a été envoyé.
                                </p>
                                <Link href="/login">
                                    <Button variant="outline" size="sm" className="mt-2">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Retour à la connexion
                                    </Button>
                                </Link>
                            </div>
                        ) : (
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

                                {error && (
                                    <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md border border-destructive/20">
                                        {error}
                                    </p>
                                )}

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Envoi..." : "Envoyer le lien"}
                                </Button>

                                <div className="text-center">
                                    <Link href="/login" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1">
                                        <ArrowLeft className="h-3 w-3" />
                                        Retour à la connexion
                                    </Link>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
