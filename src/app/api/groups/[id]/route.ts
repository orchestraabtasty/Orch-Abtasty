import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireApproved } from "@/lib/auth-server";

interface Params {
    params: Promise<{ id: string }>;
}

/**
 * PATCH /api/groups/:id — Met à jour un groupe (nom, couleur, description).
 */
export async function PATCH(req: Request, { params }: Params) {
    const authError = await requireApproved(req);
    if (authError) return authError;
    const { id } = await params;
    try {
        const body = await req.json();
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (typeof body.name === "string" && body.name.trim()) {
            updates.name = body.name.trim();
        }
        if ("color" in body) updates.color = body.color ?? null;
        if ("description" in body) updates.description = body.description ?? null;

        const { data, error } = await supabaseAdmin
            .from("groups")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

/**
 * DELETE /api/groups/:id — Supprime un groupe (et ses associations via CASCADE).
 */
export async function DELETE(req: Request, { params }: Params) {
    const authError = await requireApproved(req);
    if (authError) return authError;
    const { id } = await params;
    const { error } = await supabaseAdmin.from("groups").delete().eq("id", id);
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
}
