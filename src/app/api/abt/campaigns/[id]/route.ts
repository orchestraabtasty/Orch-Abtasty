import { NextResponse } from "next/server";
import { getCampaign, updateCampaignStatus } from "@/lib/abtasty";
import { supabaseAdmin } from "@/lib/supabase-server";
import { mapInternalToAbt } from "@/lib/status-mapping";
import type { InternalStatus } from "@/types/test";

interface Params {
    params: Promise<{ id: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: Request, { params }: Params) {
    const { id } = await params;
    try {
        // If id looks like a Supabase UUID, try to load by primary key first (Orch-only or linked test)
        if (UUID_REGEX.test(id)) {
            const { data: metaById } = await supabaseAdmin
                .from("tests")
                .select("*")
                .eq("id", id)
                .single();

            if (metaById) {
                if (metaById.abt_campaign_id == null) {
                    return NextResponse.json({ campaign: null, meta: metaById });
                }
                const campaign = await getCampaign(String(metaById.abt_campaign_id));
                return NextResponse.json({ campaign, meta: metaById });
            }
        }

        // Otherwise treat id as AB Tasty campaign id
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
        const isUuid = UUID_REGEX.test(id);

        if (isUuid) {
            // Update by Supabase primary key (Orch-only or linked test)
            const { error: supabaseError } = await supabaseAdmin
                .from("tests")
                .update({
                    ...(internal_status && { internal_status }),
                    ...metaFields,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", id);

            if (supabaseError) {
                console.error("[campaigns/id] Supabase error:", supabaseError);
                return NextResponse.json(
                    { error: "Failed to update test", details: supabaseError.message },
                    { status: 500 }
                );
            }
            // No ABT sync for Orch-only tests (abt_campaign_id is null)
            return NextResponse.json({ success: true });
        }

        // Update by abt_campaign_id (upsert for ABT-linked tests)
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
