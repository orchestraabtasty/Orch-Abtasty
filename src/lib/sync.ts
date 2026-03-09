import type { Test, TestGroup } from "@/types/test";
import type { AbtCampaign, AbtIdea } from "@/types/abtasty";
import { mapAbtToInternal } from "@/lib/status-mapping";

/**
 * Merges data from AB Tasty API campaigns with metadata from Supabase.
 * Supabase rows are the source of truth for internal metadata.
 * ABT is the source of truth for name, status, dates, url, labels, visitors.
 */
export function mergeTestData(
    abtCampaigns: AbtCampaign[],
    supabaseRows: Partial<Test>[],
    groupsMap: Map<string, TestGroup[]> = new Map()
): Test[] {
    const supabaseMap = new Map(supabaseRows.map((r) => [r.abt_campaign_id, r]));

    return abtCampaigns.map((campaign): Test => {
        const meta = supabaseMap.get(String(campaign.id));
        const abtMappedStatus = mapAbtToInternal(campaign.status);
        const testId = meta?.id ?? String(campaign.id);

        return {
            id: testId,
            kind: "campaign",
            abt_campaign_id: String(campaign.id),
            abt_idea_id: null,
            internal_status: abtMappedStatus ?? meta?.internal_status ?? "idea",
            name: campaign.name,
            type: campaign.type ?? null,
            abt_status: campaign.status,
            // Supabase dates override ABT dates when explicitly set (timeline drag/resize)
            start_date: meta?.start_date ?? campaign.start_date ?? null,
            end_date: meta?.end_date ?? campaign.end_date ?? null,
            url: campaign.url ?? null,
            labels: campaign.labels ?? [],
            visitors: campaign.visitors ?? 0,
            // ABT enriched fields (read-only from ABT)
            description: campaign.description ?? null,
            test_note: campaign.test_note ?? null,
            traffic_value: campaign.traffic_value ?? null,
            report_token: campaign.report_token ?? null,
            variations: campaign.variations ?? [],
            goals: campaign.goals ?? [],
            // Supabase metadata
            target_start_date: meta?.target_start_date ?? null,
            hypothesis: meta?.hypothesis ?? null,
            comment: meta?.comment ?? null,
            tags: meta?.tags ?? [],
            assigned_to: meta?.assigned_to ?? [],
            created_at: meta?.created_at ?? campaign.created_at ?? new Date().toISOString(),
            updated_at: meta?.updated_at ?? new Date().toISOString(),
            stats: null,
            groups: groupsMap.get(testId) ?? [],
        };
    });
}

/**
 * Maps a Supabase row (Orch-only test, abt_campaign_id = null) to Test.
 */
export function rowToTest(
    row: Partial<Test> & { id: string },
    groupsMap: Map<string, TestGroup[]> = new Map()
): Test {
    return {
        id: row.id,
        kind: row.kind ?? "orch",
        abt_campaign_id: row.abt_campaign_id ?? null,
        abt_idea_id: row.abt_idea_id ?? null,
        internal_status: (row.internal_status as Test["internal_status"]) ?? "idea",
        name: row.name ?? "",
        type: row.type ?? null,
        abt_status: row.abt_status ?? null,
        start_date: row.start_date ?? null,
        end_date: row.end_date ?? null,
        url: row.url ?? null,
        labels: row.labels ?? [],
        visitors: row.visitors ?? 0,
        target_start_date: row.target_start_date ?? null,
        hypothesis: row.hypothesis ?? null,
        comment: row.comment ?? null,
        tags: row.tags ?? [],
        assigned_to: row.assigned_to ?? [],
        created_at: row.created_at ?? new Date().toISOString(),
        updated_at: row.updated_at ?? new Date().toISOString(),
        stats: null,
        groups: groupsMap.get(row.id) ?? [],
    };
}

/**
 * Maps an AB Tasty idea to a Test object (kind = "idea").
 */
export function ideaToTest(
    idea: AbtIdea,
    groupsMap: Map<string, TestGroup[]> = new Map()
): Test {
    const ideaId = `idea-${idea.id}`;
    return {
        id: ideaId,
        kind: "idea",
        abt_campaign_id: null,
        abt_idea_id: String(idea.id),
        internal_status: "idea",
        name: idea.name ?? "",
        type: null,
        abt_status: idea.status ?? null,
        start_date: null,
        end_date: null,
        url: null,
        labels: [],
        visitors: 0,
        description: idea.description ?? null,
        test_note: null,
        traffic_value: null,
        report_token: null,
        variations: [],
        goals: [],
        target_start_date: null,
        hypothesis: idea.description ?? null,
        comment: null,
        tags: Array.isArray(idea.tags) ? idea.tags : [],
        assigned_to: [],
        created_at: idea.created_at ?? new Date().toISOString(),
        updated_at: idea.updated_at ?? new Date().toISOString(),
        stats: null,
        groups: groupsMap.get(ideaId) ?? [],
    };
}
