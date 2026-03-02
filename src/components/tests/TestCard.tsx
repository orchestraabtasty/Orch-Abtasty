"use client";

import { Card, CardContent } from "@/components/ui/card";
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
            <CardContent className="p-3 space-y-2">
                {/* Ligne 1 : type + ID + durée */}
                <div className="flex items-center justify-between gap-2">
                    <TypeBadge type={test.type} />
                    <div className="flex items-center gap-1.5 shrink-0">
                        {durationBadge && (
                            <Badge
                                variant="outline"
                                className={cn("text-xs h-4 px-1 font-medium flex items-center gap-0.5", durationBadge.className)}
                            >
                                <Clock className="h-2 w-2" />
                                {durationBadge.label}
                            </Badge>
                        )}
                        {test.abt_campaign_id && (
                            <span className="text-[11px] font-mono opacity-50">
                                #{test.abt_campaign_id}
                            </span>
                        )}
                    </div>
                </div>

                {/* Ligne 2 : titre */}
                <h3 className="font-semibold leading-tight text-sm group-hover:text-primary transition-colors line-clamp-2">
                    {test.name}
                </h3>

                {/* Ligne 3 : statut ABT + date sur une seule ligne */}
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/70">
                        {getAbtStatusLabel(test.abt_status)}
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                        <Calendar className="h-2.5 w-2.5" />
                        {formatDate(test.target_start_date || test.start_date)}
                    </span>
                </div>

                {/* Ligne 4 : assignés + visiteurs (si présents) */}
                {(test.assigned_to.length > 0 || test.visitors > 0) && (
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        {test.assigned_to.length > 0 && (
                            <span className="flex items-center gap-1 truncate">
                                <User className="h-2.5 w-2.5 shrink-0" />
                                <span className="truncate">{test.assigned_to.join(", ")}</span>
                            </span>
                        )}
                        {test.visitors > 0 && (
                            <span className="flex items-center gap-1 shrink-0">
                                <Users className="h-2.5 w-2.5" />
                                {test.visitors.toLocaleString("fr-FR")}
                            </span>
                        )}
                    </div>
                )}

                {/* Ligne 5 : tags + labels (si présents) */}
                {(test.tags.length > 0 || test.labels.length > 0) && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                        {test.labels.slice(0, 2).map((label) => (
                            <Badge key={label} variant="secondary" className="text-[10px] h-4 px-1 bg-primary/10 text-primary/70">
                                {label}
                            </Badge>
                        ))}
                        {test.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] h-4 px-1">
                                {tag}
                            </Badge>
                        ))}
                        {test.tags.length + test.labels.length > 4 && (
                            <span className="text-[10px] text-muted-foreground">+{test.tags.length + test.labels.length - 4}</span>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
