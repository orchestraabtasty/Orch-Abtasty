export interface AbtTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

export interface AbtCampaign {
    id: number;
    name: string;
    status: AbtCampaignStatus;
    type: string;
    // Dates
    created_at?: string;
    start_date?: string | null;
    end_date?: string | null;
    // Champs enrichis (Public API v1)
    url?: string | null;
    labels?: string[];
    visitors?: number;
    // Description & notes from ABT
    description?: string | null;
    test_note?: string | null;
    // Traffic allocation percentage (0–100)
    traffic_value?: number | null;
    // Token pour lien direct vers le rapport ABT
    report_token?: string | null;
    // Relations
    assigned_users?: string[];
    goals?: AbtGoal[];
    variations?: AbtVariation[];
}

export type AbtCampaignStatus =
    | "play"
    | "pause"
    | "interrupted"
    | "in_qa"
    | "scheduled"
    | "archive"
    | "active"
    | "paused"
    | "stopped"
    | "archived"
    | "draft"
    | string;

export interface AbtGoal {
    id: number;
    name: string;
    type?: string;
    target?: string;
}

export interface AbtVariation {
    id: number;
    name: string;
    /** Traffic allocation in % (0–100) */
    traffic: number;
    description?: string;
    type?: string;
    is_redirection?: boolean;
}

export interface AbtCampaignsResponse {
    data: AbtCampaign[];
    total?: number;
    page?: number;
}

export interface AbtApiError {
    error: string;
    message: string;
    status: number;
}

// ─── Ideas (Backlog ABT) ──────────────────────────────────────────────────────

export interface AbtIdea {
    id: string | number;
    name: string;
    description?: string | null;
    status?: string | null;
    tags?: string[];
    created_at?: string | null;
    updated_at?: string | null;
    [key: string]: unknown;
}

export interface AbtIdeasResponse {
    _data: AbtIdea[];
    _pagination?: {
        _page: number;
        _pages: number;
        _max_per_page: number;
        _total: number;
    };
}

export type CreateIdeaPayload = {
    name: string;
    description?: string;
    status?: string;
    tags?: string[];
    [key: string]: unknown;
};

export type UpdateIdeaPayload = Partial<CreateIdeaPayload>;
