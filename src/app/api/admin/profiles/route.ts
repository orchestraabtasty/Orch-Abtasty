import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-server";

/**
 * GET /api/admin/profiles — Liste tous les profils (admin uniquement).
 * Query param: ?status=pending|approved|rejected|all (défaut: all)
 */
export async function GET(req: Request) {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = supabaseAdmin
        .from("profiles")
        .select("id, email, name, role, status, created_at, updated_at")
        .order("created_at", { ascending: false });

    if (status && status !== "all") {
        query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
}
