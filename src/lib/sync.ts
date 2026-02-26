import type { Test } from "@/types/test";
import type { AbtCampaign } from "@/types/abtasty";
import { mapAbtToInternal } from "@/lib/status-mapping";

/**
 * Merges data from AB Tasty API campaigns with metadata from Supabase.
 * Supabase rows are the source of truth for internal metadata.
 * ABT is the source of truth for name, status, dates.
 */
export function mergeTestData(
    abtCampaigns: AbtCampaign[],
    supabaseRows: Partial<Test>[]
): Test[] {
    const supabaseMap = new Map(supabaseRows.map((r) => [r.abt_campaign_id, r]));

    return abtCampaigns.map((campaign): Test => {
        const meta = supabaseMap.get(String(campaign.id));
        const abtMappedStatus = mapAbtToInternal(campaign.status);

        return {
            id: meta?.id ?? String(campaign.id),
            abt_campaign_id: String(campaign.id),
            internal_status:
                abtMappedStatus ?? meta?.internal_status ?? "idea",
            name: campaign.name,
            type: campaign.type ?? null,
            start_date: campaign.start_date ?? null,
            end_date: campaign.end_date ?? null,
            abt_status: campaign.status,
            target_start_date: meta?.target_start_date ?? null,
            hypothesis: meta?.hypothesis ?? null,
            comment: meta?.comment ?? null,
            tags: meta?.tags ?? [],
            assigned_to: meta?.assigned_to ?? [],
            created_at: meta?.created_at ?? new Date().toISOString(),
            updated_at: meta?.updated_at ?? new Date().toISOString(),
            stats: null,
        };
    });
}
