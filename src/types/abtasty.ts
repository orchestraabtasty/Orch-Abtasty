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
}

export interface AbtVariation {
    id: number;
    name: string;
    traffic: number;
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
