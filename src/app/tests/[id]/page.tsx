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
    Lock,
    Clock,
} from "lucide-react";
import { format, isValid, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useState, useEffect, useMemo, KeyboardEvent } from "react";
import { getAbtStatusLabel, isTestPeriodLocked } from "@/lib/status-mapping";
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
              created_at: data.meta?.created_at ?? data.campaign.created_at ?? null,
              url: data.campaign.url,
              labels: data.campaign.labels ?? [],
              visitors: data.campaign.visitors ?? 0,
              description: data.campaign.description ?? null,
              test_note: data.campaign.test_note ?? null,
              traffic_value: data.campaign.traffic_value ?? null,
              report_token: data.campaign.report_token ?? null,
              variations: data.campaign.variations ?? [],
              goals: data.campaign.goals ?? [],
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
                created_at: data.meta.created_at ?? null,
                url: data.meta.url ?? null,
                labels: data.meta.labels ?? [],
                visitors: data.meta.visitors ?? 0,
                description: null,
                test_note: null,
                traffic_value: null,
                report_token: null,
                variations: [],
                goals: [],
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

    if (isLoading) return <div className="w-full px-6 py-10 text-muted-foreground">Chargement...</div>;
    if (error || !test)
        return (
            <div className="w-full px-6 py-10 text-destructive">
                Erreur: {(error as Error)?.message || "Test introuvable"}
            </div>
        );

    const duration = getDuration();

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">

            {/* ── Sub-header compact ─────────────────────────────────────────── */}
            <div className="flex-none border-b bg-card/20 backdrop-blur-sm px-6 py-3">
                {/* Ligne 1 : retour | titre + badge | actions */}
                <div className="flex items-center gap-3 min-w-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-2 shrink-0 text-muted-foreground"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="mr-1.5 h-4 w-4" />
                        Retour
                    </Button>

                    <div className="h-5 w-px bg-border/50 shrink-0" />

                    <h1 className="text-xl font-bold tracking-tight truncate flex-1 min-w-0">
                        {test.name}
                    </h1>

                    <TypeBadge type={test.type} className="shrink-0" />

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                        {test.abt_campaign_id && (
                            <Button variant="outline" size="sm" asChild>
                                <a
                                    href={`https://app2.abtasty.com/edit/test/${test.abt_campaign_id}/main-information`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
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

                {/* Ligne 2 : meta compacte */}
                <div className="flex items-center gap-2 flex-wrap mt-1.5 text-sm text-muted-foreground">
                    {test.abt_campaign_id && (
                        <>
                            <span>
                                <span className="font-medium text-foreground/80">Statut ABT :</span>{" "}
                                {getAbtStatusLabel(test.abt_status)}
                            </span>
                            <span className="opacity-40">•</span>
                            <span className="font-mono font-semibold text-foreground/90 bg-muted px-1.5 py-0.5 rounded text-sm">
                                #{test.abt_campaign_id}
                            </span>
                        </>
                    )}
                    {duration !== null && (
                        <>
                            <span className="opacity-40">•</span>
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {duration}j
                            </span>
                        </>
                    )}
                    {test.visitors > 0 && (
                        <>
                            <span className="opacity-40">•</span>
                            <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {test.visitors.toLocaleString("fr-FR")} visiteurs
                            </span>
                        </>
                    )}
                    {test.url && (
                        <>
                            <span className="opacity-40">•</span>
                            <a
                                href={test.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary/60 hover:text-primary transition-colors truncate max-w-xs"
                            >
                                <Link className="h-3 w-3 shrink-0" />
                                {test.url}
                            </a>
                        </>
                    )}
                    {test.labels.map((l: string) => (
                        <Badge key={l} variant="secondary" className="text-xs h-4 px-1.5 bg-primary/10 text-primary/70">
                            {l}
                        </Badge>
                    ))}
                    {!test.abt_campaign_id && (
                        <span className="text-amber-500 dark:text-amber-400">
                            ⚠ Non lié à une campagne AB Tasty
                        </span>
                    )}
                </div>
            </div>

            {/* ── Content area ───────────────────────────────────────────────── */}
            <div className="flex-1 overflow-auto px-6 py-5">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">

                    {/* Colonne principale */}
                    <div className="lg:col-span-2 flex flex-col gap-5 min-h-0">

                        {/* ── Résultats ABT (EN PREMIER) ─────────────────────── */}
                        {test.abt_campaign_id && (
                            <Card className="flex-none border-primary/20 bg-primary/5 shadow-inner">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
                                            <Activity className="w-4 h-4" />
                                            Données AB Tasty
                                        </CardTitle>
                                        <a
                                            href={`https://app2.abtasty.com/reporting/test/${test.abt_campaign_id}/report`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary transition-colors border border-primary/20 rounded px-2 py-1 hover:bg-primary/10"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            Voir rapport complet
                                        </a>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Métriques clés */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                        <div className="space-y-0.5 bg-background/40 rounded-lg p-3">
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Visiteurs</p>
                                            <p className="text-2xl font-mono font-bold">
                                                {test.visitors > 0 ? test.visitors.toLocaleString("fr-FR") : "—"}
                                            </p>
                                        </div>
                                        <div className="space-y-0.5 bg-background/40 rounded-lg p-3">
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Durée</p>
                                            <p className="text-2xl font-mono font-bold">
                                                {duration !== null ? `${duration}j` : "—"}
                                            </p>
                                        </div>
                                        <div className="space-y-0.5 bg-background/40 rounded-lg p-3">
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Début réel</p>
                                            <p className="text-sm font-mono font-bold">{formatDate(test.start_date)}</p>
                                        </div>
                                        <div className="space-y-0.5 bg-background/40 rounded-lg p-3">
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Fin réelle</p>
                                            <p className="text-sm font-mono font-bold">{formatDate(test.end_date)}</p>
                                        </div>
                                    </div>

                                    {/* Variations */}
                                    {test.variations && test.variations.length > 0 && (
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                Variations ({test.variations.length})
                                                {test.traffic_value != null && (
                                                    <span className="ml-2 font-normal normal-case opacity-70">— {test.traffic_value}% du trafic exposé</span>
                                                )}
                                            </p>
                                            <div className="space-y-1.5">
                                                {test.variations.map((v) => (
                                                    <div key={v.id} className="flex items-center gap-3 bg-background/40 rounded-md px-3 py-2">
                                                        <span className="text-xs font-medium flex-1 truncate">{v.name}</span>
                                                        {v.is_redirection && (
                                                            <Badge variant="outline" className="text-[10px] h-4 px-1 opacity-60">redirect</Badge>
                                                        )}
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-primary/60 rounded-full"
                                                                    style={{ width: `${v.traffic}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-muted-foreground w-8 text-right font-mono">{v.traffic}%</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Goals */}
                                    {test.goals && test.goals.length > 0 && (
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                Objectifs ({test.goals.length})
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {test.goals.map((g) => (
                                                    <Badge key={g.id} variant="outline" className="text-xs h-6 px-2 border-primary/20 bg-primary/5">
                                                        {g.name}
                                                        {g.type && <span className="opacity-50 ml-1">· {g.type}</span>}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Description ABT (si renseignée) */}
                                    {test.description && (
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description ABT</p>
                                            <p className="text-sm text-muted-foreground italic">{test.description}</p>
                                        </div>
                                    )}

                                    <p className="text-[11px] text-muted-foreground italic opacity-60 pt-1">
                                        Conversions, uplift et confiance statistique disponibles dans le rapport ABT complet.
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* ── Hypothèse & Commentaire ────────────────────────── */}
                        <Card className="flex flex-col flex-1 min-h-0 border-border/40 shadow-sm bg-card/30 backdrop-blur-sm">
                            <CardHeader className="pb-3 flex-none">
                                <CardTitle className="text-base flex items-center gap-2 text-primary/80">
                                    <Lightbulb className="w-4 h-4" />
                                    Hypothèse & Objectif
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col flex-1 gap-4 min-h-0">
                                <Textarea
                                    placeholder="Décrivez l'hypothèse du test ici..."
                                    className="flex-1 min-h-[80px] bg-background/50 border-border/50 resize-none focus-visible:ring-primary/30"
                                    value={hypothesis}
                                    onChange={(e) => setHypothesis(e.target.value)}
                                />
                                <div className="flex flex-col flex-1 gap-2 min-h-0">
                                    <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground flex-none">
                                        <MessageSquare className="w-4 h-4" />
                                        Commentaires internes
                                    </label>
                                    <Textarea
                                        placeholder="Notes supplémentaires..."
                                        className="flex-1 min-h-[80px] bg-background/50 border-border/50 text-sm resize-none focus-visible:ring-primary/30"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="flex flex-col gap-5 min-h-0">
                        <Card className="flex-none border-border/40 shadow-sm bg-card/30 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wide opacity-70">
                                    Planification
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Date cible */}
                                <div className="space-y-1.5">
                                    <label className="text-xs text-muted-foreground flex items-center gap-2">
                                        <Calendar className="w-3 h-3" />
                                        Date de lancement souhaitée
                                    </label>
                                    <Input
                                        type="date"
                                        className="h-8 bg-background/50 border-border/50 text-sm"
                                        value={targetDate}
                                        onChange={(e) => setTargetDate(e.target.value)}
                                    />
                                </div>

                                <Separator className="bg-border/40" />

                                {/* Assignés */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        Assigné à
                                    </label>
                                    <div className="flex flex-wrap gap-2 min-h-[36px]">
                                        {assignedTo.map((person) => (
                                            <Badge
                                                key={person}
                                                variant="secondary"
                                                className="text-sm px-3 py-1.5 h-8 rounded-md flex items-center gap-2"
                                            >
                                                {person}
                                                <button
                                                    type="button"
                                                    onClick={() => removeAssigned(person)}
                                                    className="hover:text-destructive transition-colors rounded p-0.5"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            value={assignedInput}
                                            onChange={(e) => setAssignedInput(e.target.value)}
                                            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                                                if (e.key === "Enter") { e.preventDefault(); addAssigned(); }
                                            }}
                                            placeholder="Ajouter un membre..."
                                            className="h-9 text-sm bg-background/50 border-border/50"
                                        />
                                        <Button type="button" variant="ghost" size="sm" className="h-9 px-3" onClick={addAssigned}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <Separator className="bg-border/40" />

                                {/* Tags */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <TagIcon className="w-4 h-4" />
                                        Tags
                                    </label>
                                    <div className="flex flex-wrap gap-2 min-h-[36px]">
                                        {tags.map((tag) => (
                                            <Badge
                                                key={tag}
                                                variant="outline"
                                                className="text-sm px-3 py-1.5 h-8 border-border/50 flex items-center gap-2"
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => removeTag(tag)}
                                                    className="hover:text-destructive transition-colors rounded p-0.5"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                                                if (e.key === "Enter") { e.preventDefault(); addTag(); }
                                            }}
                                            placeholder="Ajouter un tag..."
                                            className="h-9 text-sm bg-background/50 border-border/50"
                                        />
                                        <Button type="button" variant="ghost" size="sm" className="h-9 px-3" onClick={addTag}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Temporalité */}
                        <Card className="flex-none border-border/40 shadow-sm bg-card/30 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wide opacity-70 flex items-center gap-2">
                                    <Clock className="w-3 h-3" />
                                    Temporalité
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Création */}
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">Création</span>
                                    <span className="text-xs font-medium text-right">
                                        {formatDate(test.created_at)}
                                    </span>
                                </div>

                                {/* Lancement souhaité */}
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">Souhaité</span>
                                    <span className="text-xs font-medium text-right text-amber-500 dark:text-amber-400">
                                        {formatDate(test.target_start_date || null)}
                                    </span>
                                </div>

                                <div className="h-px bg-border/30" />

                                {/* Début réel */}
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                                        {isTestPeriodLocked(test.abt_status) && (
                                            <Lock className="h-2.5 w-2.5 opacity-50" />
                                        )}
                                        Début réel
                                    </span>
                                    <span className="text-xs font-medium text-right text-green-500 dark:text-green-400">
                                        {formatDate(test.start_date)}
                                    </span>
                                </div>

                                {/* Fin réelle */}
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                                        {isTestPeriodLocked(test.abt_status) && (
                                            <Lock className="h-2.5 w-2.5 opacity-50" />
                                        )}
                                        Fin réelle
                                    </span>
                                    <span className="text-xs font-medium text-right">
                                        {test.abt_status === "play"
                                            ? <span className="text-primary/70 italic">En cours…</span>
                                            : formatDate(test.end_date)}
                                    </span>
                                </div>

                                {/* Indication verrouillage */}
                                {isTestPeriodLocked(test.abt_status) && (
                                    <p className="text-[11px] text-muted-foreground/60 italic flex items-center gap-1 pt-1">
                                        <Lock className="h-2.5 w-2.5 shrink-0" />
                                        Période figée — modifiable via la timeline uniquement avant le lancement.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Historique récent */}
                        <Card className="flex-none border-none bg-muted/20">
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
                                        <p className="text-xs font-medium leading-none">
                                            Statut ABT : {getAbtStatusLabel(test.abt_status)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Actuellement</p>
                                    </div>
                                    <div className="relative space-y-1">
                                        <div className="absolute -left-[19px] top-[4px] h-2 w-2 rounded-full bg-muted-foreground opacity-40 ring-1 ring-background" />
                                        <p className="text-xs font-medium leading-none opacity-60">
                                            Type : {test.type ?? "—"}
                                        </p>
<p className="text-xs text-muted-foreground opacity-60">
                                        {test.start_date ? formatDate(test.start_date) : "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
