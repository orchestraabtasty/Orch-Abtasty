"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TypeBadge } from "./TypeBadge";
import { getAbtStatusLabel, getTypeBorderLeftClass } from "@/lib/status-mapping";
import type { Test } from "@/types/test";
import { Calendar, User, Clock, Users } from "lucide-react";
import { format, differenceInDays, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TestCardProps {
    test: Test;
    onClick?: () => void;
    className?: string;
}

/** Badge de durée basé sur le statut ABT (play = en live, stopped = terminé) */
function getDurationBadge(test: Test): { label: string; className: string } | null {
    const now = new Date();
    const abt = test.abt_status?.toLowerCase();

    if ((abt === "play" || abt === "active") && test.start_date) {
        const start = new Date(test.start_date);
        if (isValid(start)) {
            const days = differenceInDays(now, start);
            return {
                label: `${days}j en live`,
                className: "bg-green-500/15 text-green-400 border-green-500/30",
            };
        }
    }

    if ((abt === "stopped" || abt === "paused" || abt === "pause") && test.start_date && test.end_date) {
        const start = new Date(test.start_date);
        const end = new Date(test.end_date);
        if (isValid(start) && isValid(end)) {
            const days = differenceInDays(end, start);
            return {
                label: `${days}j de durée`,
                className: "bg-gray-500/15 text-gray-400 border-gray-500/30",
            };
        }
    }

    return null;
}

export function TestCard({ test, onClick, className }: TestCardProps) {
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        if (!isValid(d)) return "N/A";
        return format(d, "dd MMM yyyy", { locale: fr });
    };

    const durationBadge = getDurationBadge(test);

    return (
        <Card
            className={cn(
                "group cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200 border-border/50 bg-card/50 backdrop-blur-sm",
                getTypeBorderLeftClass(test.type),
                className
            )}
            onClick={onClick}
        >
            <CardHeader className="p-4 space-y-2">
                <div className="flex justify-between items-start gap-2">
                    <TypeBadge type={test.type} />
                    <div className="flex items-center gap-1.5">
                        {durationBadge && (
                            <Badge
                                variant="outline"
                                className={cn("text-[9px] h-5 px-1.5 font-medium flex items-center gap-1", durationBadge.className)}
                            >
                                <Clock className="h-2.5 w-2.5" />
                                {durationBadge.label}
                            </Badge>
                        )}
                        {test.abt_campaign_id && (
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider h-5 px-1.5 opacity-60">
                                #{test.abt_campaign_id}
                            </Badge>
                        )}
                    </div>
                </div>
                <h3 className="font-semibold leading-tight text-sm group-hover:text-primary transition-colors line-clamp-2">
                    {test.name}
                </h3>
            </CardHeader>

            <CardContent className="p-4 pt-0 space-y-3">
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                    <span><span className="font-medium text-foreground/80">AB Tasty :</span> {getAbtStatusLabel(test.abt_status)}</span>
                </div>

                {test.hypothesis && (
                    <p className="text-xs text-muted-foreground line-clamp-2 italic">
                        &quot;{test.hypothesis}&quot;
                    </p>
                )}

                <div className="flex flex-col gap-1.5 pt-1">
                    <div className="flex items-center text-[11px] text-muted-foreground">
                        <Calendar className="mr-1.5 h-3 w-3 shrink-0" />
                        <span>Démarrage : {formatDate(test.target_start_date || test.start_date)}</span>
                    </div>
                    {test.visitors > 0 && (
                        <div className="flex items-center text-[11px] text-muted-foreground">
                            <Users className="mr-1.5 h-3 w-3 shrink-0" />
                            <span>{test.visitors.toLocaleString("fr-FR")} visiteurs</span>
                        </div>
                    )}
                    {test.assigned_to.length > 0 && (
                        <div className="flex items-center text-[11px] text-muted-foreground">
                            <User className="mr-1.5 h-3 w-3 shrink-0" />
                            <span className="truncate">{test.assigned_to.join(", ")}</span>
                        </div>
                    )}
                </div>
            </CardContent>

            {(test.tags.length > 0 || test.labels.length > 0) && (
                <CardFooter className="p-4 pt-0 flex flex-wrap gap-1">
                    {test.labels.slice(0, 2).map((label) => (
                        <Badge key={label} variant="secondary" className="text-[9px] h-4 px-1 bg-primary/10 text-primary/70">
                            {label}
                        </Badge>
                    ))}
                    {test.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[9px] h-4 px-1">
                            {tag}
                        </Badge>
                    ))}
                    {test.tags.length + test.labels.length > 5 && (
                        <span className="text-[9px] text-muted-foreground">+{test.tags.length + test.labels.length - 5}</span>
                    )}
                </CardFooter>
            )}
        </Card>
    );
}
