import { NextResponse } from "next/server";
import { getCampaign, updateCampaign, updateCampaignStatus } from "@/lib/abtasty";
import { supabaseAdmin } from "@/lib/supabase-server";
import { mapInternalToAbt } from "@/lib/status-mapping";
import { requireApproved, requireModifier } from "@/lib/auth-server";
import type { InternalStatus } from "@/types/test";

interface Params {
    params: Promise<{ id: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getGroupsForTest(testId: string) {
    const { data: links } = await supabaseAdmin
        .from("group_tests")
        .select("group_id")
        .eq("test_id", testId);
    const groupIds = (links ?? []).map((r) => r.group_id);
    if (groupIds.length === 0) return [];
    const { data: groups } = await supabaseAdmin
        .from("groups")
        .select("id, name, color")
        .in("id", groupIds);
    return (groups ?? []) as { id: string; name: string; color: string | null }[];
}

export async function GET(req: Request, { params }: Params) {
    const authError = await requireApproved(req);
    if (authError) return authError;
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
                const groups = await getGroupsForTest(metaById.id);
                if (metaById.abt_campaign_id == null) {
                    return NextResponse.json({ campaign: null, meta: metaById, groups });
                }
                const campaign = await getCampaign(String(metaById.abt_campaign_id));
                return NextResponse.json({ campaign, meta: metaById, groups });
            }
        }

        // Otherwise treat id as AB Tasty campaign id
        const campaign = await getCampaign(id);
        const { data: meta } = await supabaseAdmin
            .from("tests")
            .select("*")
            .eq("abt_campaign_id", id)
            .single();

        const groups = meta?.id ? await getGroupsForTest(meta.id) : [];
        return NextResponse.json({ campaign, meta: meta ?? null, groups });
    } catch (err) {
        return NextResponse.json(
            { error: "Failed to fetch campaign", details: String(err) },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request, { params }: Params) {
    const authError = await requireModifier(req);
    if (authError) return authError;
    const { id } = await params;
    try {
        const body = await req.json();
        const { internal_status, start_date, end_date, target_start_date, ...metaFields } = body;
        const isUuid = UUID_REGEX.test(id);

        // --- Supabase update ---
        const supabasePayload: Record<string, unknown> = {
            ...(internal_status && { internal_status }),
            ...(start_date !== undefined && { start_date }),
            ...(end_date !== undefined && { end_date }),
            ...(target_start_date !== undefined && { target_start_date }),
            ...metaFields,
            updated_at: new Date().toISOString(),
        };

        if (isUuid) {
            const { data: existing } = await supabaseAdmin
                .from("tests")
                .select("abt_campaign_id")
                .eq("id", id)
                .single();

            const { error: supabaseError } = await supabaseAdmin
                .from("tests")
                .update(supabasePayload)
                .eq("id", id);

            if (supabaseError) {
                console.error("[campaigns/id] Supabase error:", supabaseError);
                return NextResponse.json(
                    { error: "Failed to update test", details: supabaseError.message },
                    { status: 500 }
                );
            }

            // Sync to ABT if test has a linked abt_campaign_id
            const abtId = existing?.abt_campaign_id;
            if (abtId) {
                await syncToAbt(abtId, { internal_status, start_date, end_date });
            }

            return NextResponse.json({ success: true });
        }

        // Update by abt_campaign_id (upsert for ABT-linked tests)
        const { error: supabaseError } = await supabaseAdmin
            .from("tests")
            .upsert(
                { abt_campaign_id: id, ...supabasePayload },
                { onConflict: "abt_campaign_id" }
            );

        if (supabaseError) {
            console.error("[campaigns/id] Supabase error:", supabaseError);
        }

        // Sync to ABT
        await syncToAbt(id, { internal_status, start_date, end_date });

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json(
            { error: "Failed to update campaign", details: String(err) },
            { status: 500 }
        );
    }
}

/**
 * Syncs relevant fields to AB Tasty API.
 * Propagates status changes and/or date changes.
 */
async function syncToAbt(
    abtId: string,
    fields: {
        internal_status?: InternalStatus;
        start_date?: string | null;
        end_date?: string | null;
    }
): Promise<void> {
    const abtPayload: Record<string, unknown> = {};

    if (fields.internal_status) {
        const abtStatus = mapInternalToAbt(fields.internal_status);
        if (abtStatus) {
            abtPayload.status = abtStatus;
        }
    }

    if (fields.start_date !== undefined) {
        abtPayload.start_datetime = fields.start_date;
    }

    if (fields.end_date !== undefined) {
        abtPayload.stop_datetime = fields.end_date;
    }

    if (Object.keys(abtPayload).length > 0) {
        try {
            await updateCampaign(abtId, abtPayload);
        } catch (err) {
            // Log but don't fail the request — Supabase update already succeeded
            console.error(`[campaigns/id] ABT sync error for campaign ${abtId}:`, err);
        }
    }
}
