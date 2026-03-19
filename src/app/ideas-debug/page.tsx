"use client";

import { useCallback, useEffect, useState } from "react";

type RawIdeasResponse = {
    data?: unknown;
    _data?: unknown;
    [key: string]: unknown;
};

function getCount(raw: RawIdeasResponse | unknown): number {
    if (!raw || typeof raw !== "object") return 0;
    const obj = raw as RawIdeasResponse;
    if (Array.isArray(obj.data)) return obj.data.length;
    if (Array.isArray(obj._data)) return obj._data.length;
    if (Array.isArray(raw)) return raw.length;
    return 0;
}

export default function IdeasDebugPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<number | null>(null);
    const [raw, setRaw] = useState<unknown>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/abt/ideas", { cache: "no-store" });
            setStatus(res.status);
            const json = (await res.json()) as RawIdeasResponse;
            setRaw(json);
            if (!res.ok) {
                setError(`HTTP ${res.status}`);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
            setRaw(null);
            setStatus(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const count = getCount(raw);

    return (
        <main className="container max-w-6xl py-8 space-y-6">
            <header className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">Ideas Debug</h1>
                    <p className="text-sm text-muted-foreground">
                        Endpoint test: <code>/api/abt/ideas</code>
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => void load()}
                    disabled={loading}
                    className="h-9 px-3 rounded-md border text-sm hover:bg-muted disabled:opacity-50"
                >
                    {loading ? "Chargement..." : "Recharger"}
                </button>
            </header>

            <section className="rounded-lg border p-4 bg-card/40">
                <div className="grid gap-2 text-sm">
                    <p>
                        <strong>HTTP:</strong> {status ?? "-"}
                    </p>
                    <p>
                        <strong>Idées détectées:</strong> {count}
                    </p>
                    {error && (
                        <p className="text-red-500">
                            <strong>Erreur:</strong> {error}
                        </p>
                    )}
                </div>
            </section>

            <section className="rounded-lg border p-4 bg-card/40">
                <h2 className="text-sm font-medium mb-2">Réponse brute</h2>
                <pre className="text-xs overflow-auto rounded bg-muted p-3">
                    {raw ? JSON.stringify(raw, null, 2) : "Aucune réponse"}
                </pre>
            </section>
        </main>
    );
}

