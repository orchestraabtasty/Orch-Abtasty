export type InternalStatus =
    | "idea"
    | "creating"
    | "staging"
    | "live"
    | "done";

/** Distingue les campagnes ABT des idées du backlog ABT et des tests Orch purs */
export type TestKind = "campaign" | "idea" | "orch";

export interface TestGroup {
    id: string;
    name: string;
    color: string | null;
}

export interface Test {
    id: string;
    /** Source du test : campagne ABT, idée backlog ABT ou test Orch-only */
    kind: TestKind;
    abt_campaign_id: string | null;
    /** Pour les idées ABT : identifiant de l'idée dans ABT */
    abt_idea_id: string | null;
    internal_status: InternalStatus;
    // Data from ABT API
    name: string;
    type: string | null;
    abt_status: string | null;
    start_date: string | null;
    end_date: string | null;
    // Champs enrichis ABT
    url: string | null;
    labels: string[];
    visitors: number;
    // Description & notes from ABT
    description?: string | null;
    test_note?: string | null;
    // Traffic allocation % and report link
    traffic_value?: number | null;
    report_token?: string | null;
    // Variations from ABT
    variations?: AbtVariationSummary[];
    // Goals from ABT
    goals?: AbtGoalSummary[];
    // Data from Supabase
    target_start_date: string | null;
    hypothesis: string | null;
    comment: string | null;
    tags: string[];
    assigned_to: string[];
    created_at: string;
    updated_at: string;
    // Stats from ABT (optional)
    stats?: AbtCampaignStats | null;
    // Groupes Orch associés au test
    groups: TestGroup[];
}

export interface AbtVariationSummary {
    id: number;
    name: string;
    traffic: number;
    description?: string;
    is_redirection?: boolean;
}

export interface AbtGoalSummary {
    id: number;
    name: string;
    type?: string;
}

export interface AbtCampaignStats {
    visitors?: number;
    conversions?: number;
    uplift?: number;
    confidence?: number;
}

export interface StatusHistoryEntry {
    id: string;
    test_id: string;
    old_status: InternalStatus;
    new_status: InternalStatus;
    changed_at: string;
    changed_by: string | null;
}
