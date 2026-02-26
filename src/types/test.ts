export type InternalStatus =
    | "idea"
    | "creating"
    | "staging"
    | "live"
    | "done";

export interface Test {
    id: string;
    abt_campaign_id: string | null;
    internal_status: InternalStatus;
    // Data from ABT API
    name: string;
    type: string | null;
    start_date: string | null;
    end_date: string | null;
    abt_status: string | null;
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
}

export interface AbtCampaignStats {
    visitors?: number;
    conversions?: number;
    uplift?: number;
    confidence?: number;
}

export interface TeamMember {
    id: string;
    name: string;
    email: string | null;
    role: string | null;
    created_at: string;
}

export interface StatusHistoryEntry {
    id: string;
    test_id: string;
    old_status: InternalStatus;
    new_status: InternalStatus;
    changed_at: string;
    changed_by: string | null;
}
