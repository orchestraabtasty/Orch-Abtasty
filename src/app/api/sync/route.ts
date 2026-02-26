import { NextResponse } from "next/server";
import { getCampaigns } from "@/lib/abtasty";
import { supabaseAdmin } from "@/lib/supabase";
import { mapAbtToInternal } from "@/lib/status-mapping";

/**
 * POST /api/sync — Manual sync trigger.
 * Fetches all campaigns from ABT and upserts them into Supabase.
 * Only updates fields that come from ABT (name, type, dates, status mapping).
 */
export async function POST() {
    try {
        const campaigns = await getCampaigns();

        const upsertData = campaigns.map((c) => {
            const mappedStatus = mapAbtToInternal(c.status);
            return {
                abt_campaign_id: String(c.id),
                name: c.name,
                type: c.type ?? null,
                start_date: c.start_date ?? null,
                end_date: c.end_date ?? null,
                // Only override internal_status if ABT has a direct mapping
                ...(mappedStatus && { internal_status: mappedStatus }),
                updated_at: new Date().toISOString(),
            };
        });

        const { error } = await supabaseAdmin
            .from("tests")
            .upsert(upsertData, { onConflict: "abt_campaign_id" });

        if (error) {
            throw new Error(`Supabase upsert error: ${error.message}`);
        }

        return NextResponse.json({
            success: true,
            synced: campaigns.length,
        });
    } catch (err) {
        console.error("[sync] Error:", err);
        return NextResponse.json(
            { error: "Sync failed", details: String(err) },
            { status: 500 }
        );
    }
}
