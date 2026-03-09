import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-server";

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
    if (body.role && ["admin", "member"].includes(body.role)) {
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
