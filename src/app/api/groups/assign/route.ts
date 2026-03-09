import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireApproved } from "@/lib/auth-server";

/**
 * POST /api/groups/assign — Assigne un test à un groupe.
 * Body: { group_id: string, test_id: string }
 */
export async function POST(req: Request) {
    const authError = await requireApproved(req);
    if (authError) return authError;
    try {
        const body = await req.json();
        const { group_id, test_id } = body;
        if (!group_id || !test_id) {
            return NextResponse.json({ error: "group_id and test_id are required" }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from("group_tests")
            .upsert({ group_id, test_id, created_at: new Date().toISOString() }, { onConflict: "group_id,test_id" });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

/**
 * DELETE /api/groups/assign — Retire un test d'un groupe.
 * Body: { group_id: string, test_id: string }
 */
export async function DELETE(req: Request) {
    const authError2 = await requireApproved(req);
    if (authError2) return authError2;
    try {
        const body = await req.json();
        const { group_id, test_id } = body;
        if (!group_id || !test_id) {
            return NextResponse.json({ error: "group_id and test_id are required" }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from("group_tests")
            .delete()
            .eq("group_id", group_id)
            .eq("test_id", test_id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
