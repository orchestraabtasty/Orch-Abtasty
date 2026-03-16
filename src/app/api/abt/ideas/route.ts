import { NextResponse } from "next/server";
import { getIdeas, createIdea } from "@/lib/abtasty";
import { requireApproved, requireModifier } from "@/lib/auth-server";
import type { CreateIdeaPayload } from "@/types/abtasty";

/**
 * GET /api/abt/ideas — Liste toutes les idées du backlog AB Tasty.
 */
export async function GET(req: Request) {
    const authError = await requireApproved(req);
    if (authError) return authError;
    try {
        // Utilise ABT_IDEAS_TOKEN depuis .env.local (voir lib/abtasty.ts)
        const ideas = await getIdeas();
        return NextResponse.json({ data: ideas });
    } catch (err) {
        console.error("[ideas] GET error:", err);
        const msg = String(err);
        // Si l'API renvoie 403 Forbidden (droits insuffisants sur les idées),
        // on renvoie simplement une liste vide avec un indicateur "disabled"
        // au lieu d'une 500 bloquante.
        if (msg.includes("403") || msg.toLowerCase().includes("forbidden")) {
            return NextResponse.json({ data: [], disabled: true });
        }
        return NextResponse.json(
            { error: "Failed to fetch ideas", details: msg },
            { status: 500 }
        );
    }
}

/**
 * POST /api/abt/ideas — Crée une nouvelle idée dans AB Tasty.
 * Body: { name: string, description?: string, status?: string, tags?: string[] }
 */
export async function POST(req: Request) {
    const authError2 = await requireModifier(req);
    if (authError2) return authError2;
    try {
        const body = await req.json() as CreateIdeaPayload;
        const title = typeof body.title === "string" ? body.title.trim() : "";
        const name = typeof body.name === "string" ? body.name.trim() : "";
        if (!title && !name) {
            return NextResponse.json({ error: "title (or name) is required" }, { status: 400 });
        }
        const idea = await createIdea({ ...body, title: title || undefined, name: name || undefined });
        return NextResponse.json(idea, { status: 201 });
    } catch (err) {
        console.error("[ideas] POST error:", err);
        return NextResponse.json(
            { error: "Failed to create idea", details: String(err) },
            { status: 500 }
        );
    }
}
