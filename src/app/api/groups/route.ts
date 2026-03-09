import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireApproved } from "@/lib/auth-server";

/**
 * GET /api/groups — Liste tous les groupes.
 */
export async function GET(req: Request) {
    const authError = await requireApproved(req);
    if (authError) return authError;
    const { data, error } = await supabaseAdmin
        .from("groups")
        .select("*")
        .order("name", { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data: data ?? [] });
}

/**
 * POST /api/groups — Crée un nouveau groupe.
 * Body: { name: string, color?: string, description?: string }
 */
export async function POST(req: Request) {
    const authError = await requireApproved(req);
    if (authError) return authError;
    try {
        const body = await req.json();
        const name = typeof body.name === "string" ? body.name.trim() : "";
        if (!name) {
            return NextResponse.json({ error: "name is required" }, { status: 400 });
        }

        const now = new Date().toISOString();
        const { data, error } = await supabaseAdmin
            .from("groups")
            .insert({
                name,
                color: body.color ?? null,
                description: body.description ?? null,
                created_at: now,
                updated_at: now,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json(data, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
