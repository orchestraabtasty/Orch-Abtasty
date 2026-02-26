import { NextResponse } from "next/server";
import { getCampaign, updateCampaignStatus } from "@/lib/abtasty";
import { supabaseAdmin } from "@/lib/supabase";
import { mapInternalToAbt } from "@/lib/status-mapping";
import type { InternalStatus } from "@/types/test";

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params) {
    const { id } = await params;
    try {
        const campaign = await getCampaign(id);
        const { data: meta } = await supabaseAdmin
            .from("tests")
            .select("*")
            .eq("abt_campaign_id", id)
            .single();

        return NextResponse.json({ campaign, meta: meta ?? null });
    } catch (err) {
        return NextResponse.json(
            { error: "Failed to fetch campaign", details: String(err) },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request, { params }: Params) {
    const { id } = await params;
    try {
        const body = await req.json();
        const { internal_status, ...metaFields } = body;

        // 1. Update Supabase metadata (always)
        const { error: supabaseError } = await supabaseAdmin
            .from("tests")
            .upsert(
                {
                    abt_campaign_id: id,
                    ...(internal_status && { internal_status }),
                    ...metaFields,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "abt_campaign_id" }
            );

        if (supabaseError) {
            console.error("[campaigns/id] Supabase error:", supabaseError);
        }

        // 2. If updating status and it has an ABT equivalent → sync to ABT
        if (internal_status) {
            const abtStatus = mapInternalToAbt(internal_status as InternalStatus);
            if (abtStatus) {
                await updateCampaignStatus(id, abtStatus);
            }
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json(
            { error: "Failed to update campaign", details: String(err) },
            { status: 500 }
        );
    }
}
