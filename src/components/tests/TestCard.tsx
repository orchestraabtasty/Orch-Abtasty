"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./StatusBadge";
import type { Test } from "@/types/test";
import { Calendar, User, Tag, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TestCardProps {
    test: Test;
    onClick?: () => void;
    className?: string;
}

export function TestCard({ test, onClick, className }: TestCardProps) {
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "N/A";
        return format(new Date(dateStr), "dd MMM yyyy", { locale: fr });
    };

    return (
        <Card
            className={cn(
                "group cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200 border-border/50 bg-card/50 backdrop-blur-sm",
                className
            )}
            onClick={onClick}
        >
            <CardHeader className="p-4 space-y-2">
                <div className="flex justify-between items-start gap-2">
                    <StatusBadge status={test.internal_status} />
                    {test.abt_campaign_id && (
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider h-5 px-1.5 opacity-60">
                            ABT #{test.abt_campaign_id}
                        </Badge>
                    )}
                </div>
                <h3 className="font-semibold leading-tight text-sm group-hover:text-primary transition-colors">
                    {test.name}
                </h3>
            </CardHeader>

            <CardContent className="p-4 pt-0 space-y-3">
                {test.type && (
                    <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-tight">
                        {test.type}
                    </div>
                )}

                {test.hypothesis && (
                    <p className="text-xs text-muted-foreground line-clamp-2 italic">
                        "{test.hypothesis}"
                    </p>
                )}

                <div className="flex flex-col gap-1.5 pt-1">
                    <div className="flex items-center text-[11px] text-muted-foreground">
                        <Calendar className="mr-1.5 h-3 w-3" />
                        <span>Démarrage : {formatDate(test.target_start_date || test.start_date)}</span>
                    </div>
                    {test.assigned_to.length > 0 && (
                        <div className="flex items-center text-[11px] text-muted-foreground">
                            <User className="mr-1.5 h-3 w-3" />
                            <span>{test.assigned_to.join(", ")}</span>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0 flex flex-wrap gap-1">
                {test.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[9px] h-4 px-1">
                        {tag}
                    </Badge>
                ))}
                {test.tags.length > 3 && (
                    <span className="text-[9px] text-muted-foreground">+{test.tags.length - 3}</span>
                )}
            </CardFooter>
        </Card>
    );
}
