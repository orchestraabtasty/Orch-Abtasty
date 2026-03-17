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
 * Converts an AbtIdeaDateField to an ISO 8601 string.
 * Uses the timestamp (in seconds or ms) when available for reliable parsing.
 */
function ideaDateToIso(
    field: import("@/types/abtasty").AbtIdeaDateField | null | undefined
): string | null {
    if (!field) return null;
    if (field.timestamp != null) {
        // ABT timestamps appear to be in seconds; convert to ms if needed
        const ms = field.timestamp > 1e10 ? field.timestamp : field.timestamp * 1000;
        const d = new Date(ms);
        if (!isNaN(d.getTime())) return d.toISOString();
    }
    if (field.readable_date) {
        // readable_date may be "DD/MM/YYYY" — try to parse it
        const parts = field.readable_date.split("/");
        if (parts.length === 3) {
            const [dd, mm, yyyy] = parts;
            const d = new Date(`${yyyy}-${mm}-${dd}`);
            if (!isNaN(d.getTime())) return d.toISOString();
        }
        const d = new Date(field.readable_date);
        if (!isNaN(d.getTime())) return d.toISOString();
    }
    return null;
}

/**
 * Maps an AB Tasty idea to a Test object (kind = "idea").
 */
export function ideaToTest(
    idea: AbtIdea,
    groupsMap: Map<string, TestGroup[]> = new Map()
): Test {
    const ideaId = `idea-${idea.id}`;
    const created = ideaDateToIso(idea.created_at);
    const start = ideaDateToIso(idea.start_date);
    const end = ideaDateToIso(idea.end_date);

    return {
        id: ideaId,
        kind: "idea",
        abt_campaign_id: null,
        abt_idea_id: String(idea.id),
        internal_status: "idea",
        name: idea.title ?? "",
        type: null,
        abt_status: idea.status ?? null,
        start_date: start,
        end_date: end,
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
        hypothesis: idea.hypothesis ?? idea.description ?? null,
        comment: null,
        tags: Array.isArray(idea.tags) ? idea.tags : [],
        assigned_to: [],
        created_at: created ?? new Date().toISOString(),
        updated_at: ideaDateToIso(idea.updated_at) ?? created ?? new Date().toISOString(),
        stats: null,
        groups: groupsMap.get(ideaId) ?? [],
    };
}
