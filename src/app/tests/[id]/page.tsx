"use client";

import { useTest, useUpdateTestMeta } from "@/hooks/useTests";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/tests/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    ExternalLink,
    Calendar,
    User,
    Tag as TagIcon,
    MessageSquare,
    Lightbulb,
    History,
    Activity,
    ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState, useEffect, useMemo } from "react";
import { ALL_STATUSES, getStatusLabel } from "@/lib/status-mapping";
import type { InternalStatus } from "@/types/test";
import { cn } from "@/lib/utils";

export default function TestDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { data, isLoading, error } = useTest(id);
    const updateMeta = useUpdateTestMeta();

    const [hypothesis, setHypothesis] = useState("");
    const [comment, setComment] = useState("");
    const [targetDate, setTargetDate] = useState("");

    const test = data?.campaign ? {
        id: data.meta?.id || data.campaign.id,
        abt_campaign_id: String(data.campaign.id),
        name: data.campaign.name,
        type: data.campaign.type,
        abt_status: data.campaign.status,
        internal_status: data.meta?.internal_status || "idea",
        hypothesis: data.meta?.hypothesis || "",
        comment: data.meta?.comment || "",
        target_start_date: data.meta?.target_start_date || "",
        tags: data.meta?.tags || [],
        assigned_to: data.meta?.assigned_to || [],
        start_date: data.campaign.start_date,
        end_date: data.campaign.end_date,
    } : null;

    useEffect(() => {
        if (test) {
            setHypothesis(test.hypothesis || "");
            setComment(test.comment || "");
            setTargetDate(test.target_start_date || "");
        }
    }, [data]);

    const hasChanges = useMemo(() => {
        if (!test) return false;
        return (
            hypothesis !== (test.hypothesis || "") ||
            comment !== (test.comment || "") ||
            targetDate !== (test.target_start_date || "")
        );
    }, [test, hypothesis, comment, targetDate]);

    const handleSave = () => {
        updateMeta.mutate({
            id,
            data: {
                hypothesis,
                comment,
                target_start_date: targetDate || null,
            },
        });
    };

    if (isLoading) return <div className="container py-10">Chargement...</div>;
    if (error || !test) return <div className="container py-10 text-destructive">Erreur: {(error as any)?.message || "Test introuvable"}</div>;

    return (
        <div className="container max-w-5xl py-8 space-y-8">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit -ml-2 text-muted-foreground"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour au dashboard
                </Button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">{test.name}</h1>
                            <StatusBadge status={test.internal_status as InternalStatus} className="text-sm px-3 py-1" />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary" className="uppercase text-[10px] font-bold">
                                {test.type}
                            </Badge>
                            <span>•</span>
                            <span className="font-mono opacity-70">ID ABT: {test.abt_campaign_id}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" asChild>
                            <a
                                href={`https://app2.abtasty.com/campaign/${test.abt_campaign_id}/report`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Ouvrir dans AB Tasty
                            </a>
                        </Button>
                        <Button
                            size="sm"
                            disabled={!hasChanges || updateMeta.isPending}
                            onClick={handleSave}
                        >
                            {updateMeta.isPending ? "Enregistrement..." : "Enregistrer les modifs"}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Hypothesis & Description */}
                    <Card className="border-border/40 shadow-sm bg-card/30 backdrop-blur-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2 text-primary/80">
                                <Lightbulb className="w-5 h-5" />
                                Hypothèse & Objectif
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder="Décrivez l'hypothèse du test ici..."
                                className="min-h-[100px] bg-background/50 border-border/50 resize-none focus-visible:ring-primary/30"
                                value={hypothesis}
                                onChange={(e) => setHypothesis(e.target.value)}
                            />
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                                    <MessageSquare className="w-4 h-4" />
                                    Commentaires internes (CRO, Prospection, Dev...)
                                </label>
                                <Textarea
                                    placeholder="Notes supplémentaires..."
                                    className="min-h-[150px] bg-background/50 border-border/50 text-sm focus-visible:ring-primary/30"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Statistics Summary Block (Placeholder for high-end UI) */}
                    <Card className="border-primary/20 bg-primary/5 shadow-inner">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary">
                                <Activity className="w-4 h-4" />
                                Derniers résultats (Données AB Tasty)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-2 text-center md:text-left">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Visiteurs</p>
                                    <p className="text-2xl font-mono font-bold">—</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Conversions</p>
                                    <p className="text-2xl font-mono font-bold">—</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider text-green-500">Uplift</p>
                                    <p className="text-2xl font-mono font-bold text-green-500">+ --%</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider text-green-600">Confiance</p>
                                    <p className="text-2xl font-mono font-bold text-green-600">--%</p>
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-4 italic opacity-70">
                                * Les statistiques détaillées sont disponibles dans le rapport AB Tasty complet.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info Column */}
                <div className="space-y-6">
                    <Card className="border-border/40 shadow-sm bg-card/30 backdrop-blur-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wide opacity-70">
                                Planification
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground flex items-center gap-2">
                                    <Calendar className="w-3 h-3" />
                                    Date de lancement souhaitée
                                </label>
                                <Input
                                    type="date"
                                    className="h-9 bg-background/50 border-border/50 text-sm"
                                    value={targetDate}
                                    onChange={(e) => setTargetDate(e.target.value)}
                                />
                            </div>

                            <Separator className="bg-border/40" />

                            <div className="space-y-3">
                                <label className="text-xs text-muted-foreground flex items-center gap-2">
                                    <User className="w-3 h-3" />
                                    Personnes assignées
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {test.assigned_to.length > 0 ? (
                                        test.assigned_to.map((person: string) => (
                                            <Badge key={person} variant="secondary" className="px-2 py-0.5 rounded-md">
                                                {person}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">Aucune assignation</span>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-primary/20 text-primary">
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <label className="text-xs text-muted-foreground flex items-center gap-2">
                                    <TagIcon className="w-3 h-3" />
                                    Tags
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {test.tags.length > 0 ? (
                                        test.tags.map((tag: string) => (
                                            <Badge key={tag} variant="outline" className="text-[10px] px-2 py-0 h-5 border-border/50">
                                                {tag}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">Aucun tag</span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timeline / History Mini Block */}
                    <Card className="border-none bg-muted/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-xs font-semibold flex items-center gap-2 uppercase tracking-wide opacity-50">
                                <History className="w-3 h-3" />
                                Historique récent
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative pl-4 space-y-4 before:absolute before:left-[1px] before:top-[4px] before:bottom-[4px] before:w-[1px] before:bg-border/60">
                                <div className="relative space-y-1">
                                    <div className="absolute -left-[19px] top-[4px] h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background ring-offset-2 ring-offset-muted/20" />
                                    <p className="text-[11px] font-medium leading-none">Statut changé en {getStatusLabel(test.internal_status as InternalStatus)}</p>
                                    <p className="text-[9px] text-muted-foreground">Il y a quelques instants</p>
                                </div>
                                <div className="relative space-y-1">
                                    <div className="absolute -left-[19px] top-[4px] h-2 w-2 rounded-full bg-muted-foreground opacity-40 ring-1 ring-background" />
                                    <p className="text-[11px] font-medium leading-none opacity-60">Création initiale</p>
                                    <p className="text-[9px] text-muted-foreground opacity-60">{test.start_date ? format(new Date(test.start_date), "dd MMM HH:mm") : "N/A"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function Plus({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    );
}
