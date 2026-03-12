"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Bug, Link2 } from "lucide-react";

interface DebugIdea {
  id: string | number;
  name?: string;
  description?: string | null;
  status?: string | null;
  tags?: string[];
  [key: string]: unknown;
}

export default function IdeasDebugPage() {
  const [ideas, setIdeas] = useState<DebugIdea[]>([]);
  const [raw, setRaw] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/abt/ideas");
      const json = await res.json();
      const data = Array.isArray(json)
        ? json
        : Array.isArray(json.data)
        ? json.data
        : Array.isArray(json._data)
        ? json._data
        : [];

      setIdeas(data as DebugIdea[]);
      setRaw(json);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-amber-500" />
          <div>
            <h1 className="text-xl font-semibold">Debug backlog d&apos;idées AB Tasty</h1>
            <p className="text-sm text-muted-foreground">
              Page temporaire pour tester uniquement l&apos;endpoint `/api/abt/ideas` sans impacter le Kanban.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchIdeas} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Recharger
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-sm text-destructive flex items-center gap-2">
              Erreur lors de l&apos;appel /api/abt/ideas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-destructive whitespace-pre-wrap break-all">{error}</pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            Idées AB Tasty
            <Badge variant="outline">{ideas.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : ideas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune idée retournée par l&apos;API.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ideas.map((idea) => (
                  <TableRow key={String(idea.id)}>
                    <TableCell className="font-mono text-xs">{idea.id}</TableCell>
                    <TableCell className="text-sm">
                      {idea.name || <span className="text-muted-foreground">(sans nom)</span>}
                    </TableCell>
                    <TableCell className="text-xs">
                      {idea.status ? (
                        <Badge variant="outline" className="capitalize">
                          {String(idea.status)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {Array.isArray(idea.tags) && idea.tags.length > 0 ? idea.tags.join(", ") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            Réponse brute
            <Badge variant="outline" className="flex items-center gap-1">
              <Link2 className="h-3 w-3" />
              /api/abt/ideas
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-[11px] max-h-[320px] overflow-auto bg-muted/50 rounded-md p-3 whitespace-pre-wrap break-all">
            {JSON.stringify(raw, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

