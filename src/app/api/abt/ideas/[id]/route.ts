import { NextResponse } from "next/server";
import { getIdea, updateIdea, deleteIdea } from "@/lib/abtasty";
import type { UpdateIdeaPayload } from "@/types/abtasty";

interface Params {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/abt/ideas/:id — Détails d'une idée spécifique.
 */
export async function GET(_req: Request, { params }: Params) {
    const { id } = await params;
    try {
        const idea = await getIdea(id);
        return NextResponse.json(idea);
    } catch (err) {
        console.error(`[ideas/${id}] GET error:`, err);
        return NextResponse.json(
            { error: "Failed to fetch idea", details: String(err) },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/abt/ideas/:id — Met à jour une idée dans AB Tasty.
 */
export async function PATCH(req: Request, { params }: Params) {
    const { id } = await params;
    try {
        const body = await req.json() as UpdateIdeaPayload;
        const updated = await updateIdea(id, body);
        return NextResponse.json(updated);
    } catch (err) {
        console.error(`[ideas/${id}] PATCH error:`, err);
        return NextResponse.json(
            { error: "Failed to update idea", details: String(err) },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/abt/ideas/:id — Supprime définitivement une idée dans AB Tasty.
 */
export async function DELETE(_req: Request, { params }: Params) {
    const { id } = await params;
    try {
        await deleteIdea(id);
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(`[ideas/${id}] DELETE error:`, err);
        return NextResponse.json(
            { error: "Failed to delete idea", details: String(err) },
            { status: 500 }
        );
    }
}
