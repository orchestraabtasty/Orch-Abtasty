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
    created_at?: string;
    start_date?: string | null;
    end_date?: string | null;
    assigned_users?: string[];
    goals?: AbtGoal[];
    variations?: AbtVariation[];
}

export type AbtCampaignStatus =
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
