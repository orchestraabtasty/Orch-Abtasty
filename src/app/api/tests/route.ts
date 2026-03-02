import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { Test } from "@/types/test";

/**
 * POST /api/tests — Create a new test in Orch (Supabase only).
 * Body: { name: string, hypothesis?: string, target_start_date?: string }
 * Returns the created test (id = Supabase row id).
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const name = typeof body.name === "string" ? body.name.trim() : "";
        if (!name) {
            return NextResponse.json(
                { error: "name is required" },
                { status: 400 }
            );
        }

        const now = new Date().toISOString();
        const row = {
            name,
            hypothesis: body.hypothesis?.trim() || null,
            target_start_date: body.target_start_date || null,
            internal_status: "idea" as const,
            abt_campaign_id: null,
            comment: null,
            tags: [],
            assigned_to: [],
            created_at: now,
            updated_at: now,
        };

        const { data, error } = await supabaseAdmin
            .from("tests")
            .insert(row)
            .select()
            .single();

        if (error) {
            console.error("[tests] Supabase insert error:", error);
            return NextResponse.json(
                { error: "Failed to create test", details: error.message },
                { status: 500 }
            );
        }

        const test: Test = {
            id: data.id,
            abt_campaign_id: null,
            internal_status: data.internal_status ?? "idea",
            name: data.name,
            type: null,
            abt_status: null,
            start_date: null,
            end_date: null,
            url: null,
            labels: [],
            visitors: 0,
            target_start_date: data.target_start_date ?? null,
            hypothesis: data.hypothesis ?? null,
            comment: data.comment ?? null,
            tags: data.tags ?? [],
            assigned_to: data.assigned_to ?? [],
            created_at: data.created_at ?? now,
            updated_at: data.updated_at ?? now,
            stats: null,
        };

        return NextResponse.json(test);
    } catch (err) {
        console.error("[tests] Error:", err);
        return NextResponse.json(
            { error: "Failed to create test", details: String(err) },
            { status: 500 }
        );
    }
}
