"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./StatusBadge";
import type { Test } from "@/types/test";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

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
                        <TableHead>Statut</TableHead>
                        <TableHead>Type</TableHead>
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
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => onTestClick?.(test)}
                            >
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{test.name}</span>
                                        {test.hypothesis && (
                                            <span className="text-[10px] text-muted-foreground font-normal line-clamp-1 italic">
                                                {test.hypothesis}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={test.internal_status} />
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-[10px] uppercase font-normal">
                                        {test.type || "N/A"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm border-muted-foreground/20">
                                    {formatDate(test.target_start_date || test.start_date)}
                                </TableCell>
                                <TableCell className="text-sm">
                                    {test.assigned_to.length > 0 ? test.assigned_to.join(", ") : "-"}
                                </TableCell>
                                <TableCell className="text-right text-xs font-mono opacity-60">
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
