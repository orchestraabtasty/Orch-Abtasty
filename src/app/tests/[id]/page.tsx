"use client";

import { useTest, useUpdateTestMeta } from "@/hooks/useTests";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TypeBadge } from "@/components/tests/TypeBadge";
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
    Users,
    Link,
    X,
    Plus,
} from "lucide-react";
import { format, isValid, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useState, useEffect, useMemo, KeyboardEvent } from "react";
import { getAbtStatusLabel } from "@/lib/status-mapping";
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
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [assignedTo, setAssignedTo] = useState<string[]>([]);
    const [assignedInput, setAssignedInput] = useState("");

    const test = data?.campaign
        ? {
              id: data.meta?.id || String(data.campaign.id),
              abt_campaign_id: String(data.campaign.id),
              name: data.campaign.name,
              type: data.campaign.type,
              abt_status: data.campaign.status,
              internal_status: (data.meta?.internal_status || "idea") as InternalStatus,
              hypothesis: data.meta?.hypothesis || "",
              comment: data.meta?.comment || "",
              target_start_date: data.meta?.target_start_date || "",
              tags: data.meta?.tags || [],
              assigned_to: data.meta?.assigned_to || [],
              start_date: data.campaign.start_date,
              end_date: data.campaign.end_date,
              url: data.campaign.url,
              labels: data.campaign.labels ?? [],
              visitors: data.campaign.visitors ?? 0,
          }
        : data?.meta
          ? {
                id: data.meta.id,
                abt_campaign_id: null,
                name: data.meta.name ?? "",
                type: data.meta.type ?? null,
                abt_status: data.meta.abt_status ?? null,
                internal_status: (data.meta.internal_status || "idea") as InternalStatus,
                hypothesis: data.meta.hypothesis ?? "",
                comment: data.meta.comment ?? "",
                target_start_date: data.meta.target_start_date ?? "",
                tags: data.meta.tags ?? [],
                assigned_to: data.meta.assigned_to ?? [],
                start_date: data.meta.start_date ?? null,
                end_date: data.meta.end_date ?? null,
                url: data.meta.url ?? null,
                labels: data.meta.labels ?? [],
                visitors: data.meta.visitors ?? 0,
            }
          : null;

    useEffect(() => {
        if (test) {
            setHypothesis(test.hypothesis || "");
            setComment(test.comment || "");
            setTargetDate(test.target_start_date || "");
            setTags(test.tags || []);
            setAssignedTo(test.assigned_to || []);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    const hasChanges = useMemo(() => {
        if (!test) return false;
        return (
            hypothesis !== (test.hypothesis || "") ||
            comment !== (test.comment || "") ||
            targetDate !== (test.target_start_date || "") ||
            JSON.stringify(tags) !== JSON.stringify(test.tags || []) ||
            JSON.stringify(assignedTo) !== JSON.stringify(test.assigned_to || [])
        );
    }, [test, hypothesis, comment, targetDate, tags, assignedTo]);

    const handleSave = () => {
        updateMeta.mutate({
            id,
            data: {
                hypothesis,
                comment,
                target_start_date: targetDate || null,
                tags,
                assigned_to: assignedTo,
            },
        });
    };

    const addTag = () => {
        const v = tagInput.trim();
        if (v && !tags.includes(v)) setTags([...tags, v]);
        setTagInput("");
    };

    const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

    const addAssigned = () => {
        const v = assignedInput.trim();
        if (v && !assignedTo.includes(v)) setAssignedTo([...assignedTo, v]);
        setAssignedInput("");
    };

    const removeAssigned = (person: string) =>
        setAssignedTo(assignedTo.filter((p) => p !== person));

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        return isValid(d) ? format(d, "dd MMM yyyy", { locale: fr }) : "N/A";
    };

    const getDuration = () => {
        if (!test?.start_date) return null;
        const start = new Date(test.start_date);
        const end = test.end_date ? new Date(test.end_date) : new Date();
        if (!isValid(start)) return null;
        return differenceInDays(end, start);
    };

    if (isLoading) return <div className="container py-10 text-muted-foreground">Chargement...</div>;
    if (error || !test)
        return (
            <div className="container py-10 text-destructive">
                Erreur: {(error as Error)?.message || "Test introuvable"}
            </div>
        );

    const duration = getDuration();

    return (
        <div className="container max-w-5xl py-8 space-y-8">
            {/* Header */}
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
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-3xl font-bold tracking-tight">{test.name}</h1>
                            <TypeBadge type={test.type} className="text-sm px-3 py-1" />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                            {test.abt_campaign_id && (
                                <>
                                    <span><span className="font-medium text-foreground/80">Statut ABT :</span> {getAbtStatusLabel(test.abt_status)}</span>
                                    <span>•</span>
                                    <span className="font-mono opacity-70">ID ABT: {test.abt_campaign_id}</span>
                                </>
                            )}
                            {duration !== null && (
                                <>
                                    {test.abt_campaign_id && <span>•</span>}
                                    <span className="font-medium">
                                        Durée : {duration}j
                                    </span>
                                </>
                            )}
                            {test.visitors > 0 && (
                                <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Users className="h-3.5 w-3.5" />
                                        {test.visitors.toLocaleString("fr-FR")} visiteurs
                                    </span>
                                </>
                            )}
                        </div>
                        {!test.abt_campaign_id && (
                            <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2 mt-2">
                                Ce test n&apos;est pas encore lié à une campagne AB Tasty. Complétez l&apos;hypothèse et les métadonnées ; vous pourrez le lier plus tard (saisie manuelle de l&apos;ID ou sync).
                            </p>
                        )}
                        {/* URL du test ABT */}
                        {test.url && (
                            <a
                                href={test.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary/70 hover:text-primary flex items-center gap-1 truncate max-w-lg"
                            >
                                <Link className="h-3 w-3 shrink-0" />
                                {test.url}
                            </a>
                        )}
                        {/* Labels ABT */}
                        {test.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {test.labels.map((l) => (
                                    <Badge key={l} variant="secondary" className="text-[10px] h-5 bg-primary/10 text-primary/70">
                                        {l}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {test.abt_campaign_id && (
                            <Button variant="outline" size="sm" asChild>
                                <a
                                    href={`https://app2.abtasty.com/edit/test/${test.abt_campaign_id}/main-information`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Ouvrir dans AB Tasty
                                </a>
                            </Button>
                        )}
                        <Button
                            size="sm"
                            disabled={!hasChanges || updateMeta.isPending}
                            onClick={handleSave}
                        >
                            {updateMeta.isPending ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Colonne principale */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Hypothèse & Commentaire */}
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
                                    Commentaires internes
                                </label>
                                <Textarea
                                    placeholder="Notes supplémentaires..."
                                    className="min-h-[120px] bg-background/50 border-border/50 text-sm focus-visible:ring-primary/30"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats ABT — affiché uniquement si le test est lié à AB Tasty */}
                    {test.abt_campaign_id && (
                        <Card className="border-primary/20 bg-primary/5 shadow-inner">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary">
                                    <Activity className="w-4 h-4" />
                                    Résultats (Données AB Tasty)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-2 text-center">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Visiteurs</p>
                                        <p className="text-2xl font-mono font-bold">
                                            {test.visitors > 0 ? test.visitors.toLocaleString("fr-FR") : "—"}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Début réel</p>
                                        <p className="text-lg font-mono font-bold">{formatDate(test.start_date)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Fin réelle</p>
                                        <p className="text-lg font-mono font-bold">{formatDate(test.end_date)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Durée</p>
                                        <p className="text-2xl font-mono font-bold">
                                            {duration !== null ? `${duration}j` : "—"}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-4 italic opacity-70">
                                    * Les statistiques complètes (uplift, confiance, conversions) sont disponibles dans AB Tasty.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card className="border-border/40 shadow-sm bg-card/30 backdrop-blur-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-semibold uppercase tracking-wide opacity-70">
                                Planification
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {/* Date cible */}
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

                            {/* Assignés */}
                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground flex items-center gap-2">
                                    <User className="w-3 h-3" />
                                    Assigné à
                                </label>
                                <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                                    {assignedTo.map((person) => (
                                        <Badge
                                            key={person}
                                            variant="secondary"
                                            className="px-2 py-0.5 rounded-md flex items-center gap-1"
                                        >
                                            {person}
                                            <button
                                                type="button"
                                                onClick={() => removeAssigned(person)}
                                                className="hover:text-destructive transition-colors"
                                            >
                                                <X className="h-2.5 w-2.5" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex gap-1.5">
                                    <Input
                                        value={assignedInput}
                                        onChange={(e) => setAssignedInput(e.target.value)}
                                        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                                            if (e.key === "Enter") { e.preventDefault(); addAssigned(); }
                                        }}
                                        placeholder="Ajouter un membre..."
                                        className="h-7 text-xs bg-background/50 border-border/50"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2"
                                        onClick={addAssigned}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>

                            <Separator className="bg-border/40" />

                            {/* Tags */}
                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground flex items-center gap-2">
                                    <TagIcon className="w-3 h-3" />
                                    Tags
                                </label>
                                <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                                    {tags.map((tag) => (
                                        <Badge
                                            key={tag}
                                            variant="outline"
                                            className="text-[10px] px-2 py-0 h-5 border-border/50 flex items-center gap-1"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="hover:text-destructive transition-colors"
                                            >
                                                <X className="h-2 w-2" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex gap-1.5">
                                    <Input
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                                            if (e.key === "Enter") { e.preventDefault(); addTag(); }
                                        }}
                                        placeholder="Ajouter un tag..."
                                        className="h-7 text-xs bg-background/50 border-border/50"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2"
                                        onClick={addTag}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Historique récent */}
                    <Card className="border-none bg-muted/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-xs font-semibold flex items-center gap-2 uppercase tracking-wide opacity-50">
                                <History className="w-3 h-3" />
                                Historique récent
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div
                                className={cn(
                                    "relative pl-4 space-y-4",
                                    "before:absolute before:left-px before:top-[4px] before:bottom-[4px] before:w-px before:bg-border/60"
                                )}
                            >
                                <div className="relative space-y-1">
                                    <div className="absolute -left-[19px] top-[4px] h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background ring-offset-2 ring-offset-muted/20" />
                                    <p className="text-[11px] font-medium leading-none">
                                        Statut ABT : {getAbtStatusLabel(test.abt_status)}
                                    </p>
                                    <p className="text-[9px] text-muted-foreground">Actuellement</p>
                                </div>
                                <div className="relative space-y-1">
                                    <div className="absolute -left-[19px] top-[4px] h-2 w-2 rounded-full bg-muted-foreground opacity-40 ring-1 ring-background" />
                                    <p className="text-[11px] font-medium leading-none opacity-60">
                                        Type : {test.type ?? "—"}
                                    </p>
                                    <p className="text-[9px] text-muted-foreground opacity-60">
                                        {test.start_date ? formatDate(test.start_date) : "N/A"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
