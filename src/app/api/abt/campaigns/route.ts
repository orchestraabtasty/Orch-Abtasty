import { NextResponse } from "next/server";
import { getCampaigns } from "@/lib/abtasty";
import { supabaseAdmin } from "@/lib/supabase";
import { mergeTestData } from "@/lib/sync";
import type { Test } from "@/types/test";

export async function GET() {
    try {
        // 1. Fetch campaigns from AB Tasty
        const abtCampaigns = await getCampaigns();

        // 2. Fetch metadata from Supabase
        const { data: supabaseRows, error } = await supabaseAdmin
            .from("tests")
            .select("*");

        if (error) {
            console.error("[campaigns] Supabase error:", error);
            // Fallback: return ABT data without metadata
            const tests: Test[] = abtCampaigns.map((c) => ({
                id: String(c.id),
                abt_campaign_id: String(c.id),
                internal_status: "idea" as const,
                name: c.name,
                type: c.type ?? null,
                start_date: c.start_date ?? null,
                end_date: c.end_date ?? null,
                abt_status: c.status,
                target_start_date: null,
                hypothesis: null,
                comment: null,
                tags: [],
                assigned_to: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                stats: null,
            }));
            return NextResponse.json({ data: tests });
        }

        // 3. Merge ABT + Supabase data
        const tests = mergeTestData(abtCampaigns, supabaseRows ?? []);

        return NextResponse.json({ data: tests });
    } catch (err) {
        console.error("[campaigns] Error:", err);
        return NextResponse.json(
            { error: "Failed to fetch campaigns", details: String(err) },
            { status: 500 }
        );
    }
}
