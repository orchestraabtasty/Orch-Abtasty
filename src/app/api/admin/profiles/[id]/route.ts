import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin, getAuthenticatedUserId } from "@/lib/auth-server";

interface Params {
    params: Promise<{ id: string }>;
}

/**
 * PATCH /api/admin/profiles/:id — Met à jour le status et/ou le role d'un profil (admin uniquement).
 * Body: { status?: "pending"|"approved"|"rejected", role?: "admin"|"member" }
 */
export async function PATCH(req: Request, { params }: Params) {
    const { id } = await params;

    const authError = await requireAdmin(req);
    if (authError) return authError;

    const body = await req.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.status && ["pending", "approved", "rejected"].includes(body.status)) {
        updates.status = body.status;
    }
    if (body.role && ["super_admin", "admin", "member", "view"].includes(body.role)) {
        updates.role = body.role;
    }

    if (Object.keys(updates).length === 1) {
        return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
        .from("profiles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

/**
 * DELETE /api/admin/profiles/:id — Supprime un utilisateur (profil + compte auth) — admin uniquement.
 * Un admin ne peut pas se supprimer lui-même.
 */
export async function DELETE(req: Request, { params }: Params) {
    const { id } = await params;

    const authError = await requireAdmin(req);
    if (authError) return authError;

    const callerId = await getAuthenticatedUserId();
    if (callerId === id) {
        return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte." }, { status: 400 });
    }

    try {
        // Tentative de suppression du compte Auth (cascade supprime aussi le profil)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

        if (authError) {
            console.error("[DELETE profile] auth.admin.deleteUser error:", authError);
            // Fallback : supprimer uniquement le profil public si l'utilisateur auth n'existe pas
            const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("id", id);
            if (profileError) {
                console.error("[DELETE profile] profiles delete error:", profileError);
                return NextResponse.json({ error: profileError.message }, { status: 500 });
            }
        }
    } catch (err) {
        console.error("[DELETE profile] Unexpected error:", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
