import { NextResponse } from "next/server";
import { getCampaigns, getIdeas } from "@/lib/abtasty";
import { supabaseAdmin } from "@/lib/supabase-server";
import { mergeTestData, rowToTest, ideaToTest } from "@/lib/sync";
import { requireApproved } from "@/lib/auth-server";
import type { Test, TestGroup } from "@/types/test";

export async function GET(req: Request) {
    const authError = await requireApproved(req);
    if (authError) return authError;
    try {
        // 1. Fetch campaigns and ideas from AB Tasty (in parallel)
        const [abtCampaigns, abtIdeas] = await Promise.all([
            getCampaigns(),
            getIdeas().catch((err) => {
                console.warn("[campaigns] Could not fetch ABT ideas:", err);
                return [];
            }),
        ]);

        // 2. Fetch metadata and groups from Supabase (in parallel)
        const [supabaseResult, groupsResult, groupTestsResult] = await Promise.all([
            supabaseAdmin.from("tests").select("*"),
            supabaseAdmin.from("groups").select("id, name, color"),
            supabaseAdmin.from("group_tests").select("group_id, test_id"),
        ]);

        const supabaseRows = supabaseResult.data ?? [];

        // Build groups map: test_id → TestGroup[]
        const groupsMap = new Map<string, TestGroup[]>();
        if (!groupsResult.error && !groupTestsResult.error) {
            const groupById = new Map<string, TestGroup>(
                (groupsResult.data ?? []).map((g) => [g.id, g as TestGroup])
            );
            for (const gt of groupTestsResult.data ?? []) {
                const group = groupById.get(gt.group_id);
                if (!group) continue;
                const existing = groupsMap.get(gt.test_id) ?? [];
                existing.push(group);
                groupsMap.set(gt.test_id, existing);
            }
        }

        if (supabaseResult.error) {
            console.error("[campaigns] Supabase error:", supabaseResult.error);
            // Fallback: return ABT data without metadata
            const nowIso = new Date().toISOString();
            const tests: Test[] = [
                ...abtCampaigns.map((c) => ({
                    id: String(c.id),
                    kind: "campaign" as const,
                    abt_campaign_id: String(c.id),
                    abt_idea_id: null,
                    internal_status: "idea" as const,
                    name: c.name,
                    type: c.type ?? null,
                    abt_status: c.status,
                    start_date: c.start_date ?? null,
                    end_date: c.end_date ?? null,
                    url: c.url ?? null,
                    labels: c.labels ?? [],
                    visitors: c.visitors ?? 0,
                    target_start_date: null,
                    hypothesis: null,
                    comment: null,
                    tags: [],
                    assigned_to: [],
                    created_at: c.created_at ?? nowIso,
                    updated_at: nowIso,
                    stats: null,
                    groups: [],
                })),
                ...abtIdeas.map((idea) => ideaToTest(idea)),
            ];
            return NextResponse.json({ data: tests });
        }

        // 3. Merge ABT campaigns + Supabase metadata
        const merged = mergeTestData(abtCampaigns, supabaseRows ?? [], groupsMap);

        // 4. Append Orch-only tests (Supabase rows with no ABT campaign)
        const orchOnly = (supabaseRows ?? [])
            .filter((r) => r.abt_campaign_id == null && r.abt_idea_id == null && r.id)
            .map((r) => rowToTest(r as Partial<Test> & { id: string }, groupsMap));

        // 5. Map ABT ideas (merged with any Supabase row that has abt_idea_id)
        const ideaRowsMap = new Map(
            (supabaseRows ?? [])
                .filter((r) => r.abt_idea_id != null)
                .map((r) => [r.abt_idea_id!, r])
        );
        const ideas: Test[] = abtIdeas.map((idea) => {
            const meta = ideaRowsMap.get(String(idea.id));
            const ideaId = meta?.id ?? `idea-${idea.id}`;
            return {
                ...ideaToTest(idea, groupsMap),
                id: ideaId,
                hypothesis: meta?.hypothesis ?? idea.description ?? null,
                comment: meta?.comment ?? null,
                tags: meta?.tags ?? (Array.isArray(idea.tags) ? idea.tags : []),
                assigned_to: meta?.assigned_to ?? [],
                groups: groupsMap.get(ideaId) ?? [],
            };
        });

        const tests: Test[] = [...merged, ...orchOnly, ...ideas];

        return NextResponse.json({ data: tests });
    } catch (err) {
        console.error("[campaigns] Error:", err);
        return NextResponse.json(
            { error: "Failed to fetch campaigns", details: String(err) },
            { status: 500 }
        );
    }
}
