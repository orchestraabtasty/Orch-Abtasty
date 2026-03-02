"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { TypeBadge } from "./TypeBadge";
import { getAbtStatusLabel, getTypeBorderLeftClass } from "@/lib/status-mapping";
import type { Test } from "@/types/test";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TestListProps {
    tests: Test[];
    onTestClick?: (test: Test) => void;
}

export function TestList({ tests, onTestClick }: TestListProps) {
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "-";
        return format(new Date(dateStr), "dd/MM/yyyy", { locale: fr });
    };

    return (
        <div className="rounded-md border bg-card/30 backdrop-blur-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[300px]">Nom du test</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Statut ABT</TableHead>
                        <TableHead>Démarrage</TableHead>
                        <TableHead>Assigné à</TableHead>
                        <TableHead className="text-right">ID ABT</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tests.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                Aucun test trouvé.
                            </TableCell>
                        </TableRow>
                    ) : (
                        tests.map((test) => (
                            <TableRow
                                key={test.id}
                                className={cn("cursor-pointer hover:bg-muted/50 transition-colors", getTypeBorderLeftClass(test.type))}
                                onClick={() => onTestClick?.(test)}
                            >
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span title={test.name}>
                                            {test.name.length > 50 ? `${test.name.slice(0, 50)}…` : test.name}
                                        </span>
                                        {test.hypothesis && (
                                            <span className="text-xs text-muted-foreground font-normal line-clamp-1 italic">
                                                {test.hypothesis}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <TypeBadge type={test.type} />
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {getAbtStatusLabel(test.abt_status)}
                                </TableCell>
                                <TableCell className="text-sm">
                                    {formatDate(test.target_start_date || test.start_date)}
                                </TableCell>
                                <TableCell className="text-sm">
                                    {test.assigned_to.length > 0 ? test.assigned_to.join(", ") : "-"}
                                </TableCell>
                                <TableCell className="text-right text-sm font-mono opacity-60">
                                    {test.abt_campaign_id || "-"}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
