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

export interface AbtIdeaDateField {
    readable_date?: string;
    timestamp?: number;
    pattern?: string;
}

export interface AbtIdeaUserField {
    firstname?: string;
    lastname?: string;
    email?: string;
}

export interface AbtIdeaLinkedTest {
    id: number;
    name: string;
    test_type?: string;
}

export interface AbtIdeaScores {
    impact?: number;
    confidence?: number;
    ease?: number;
    total?: number;
    [key: string]: number | undefined;
}

export interface AbtIdea {
    id: string | number;
    /** Libellé principal de l’idée (champ observé dans la réponse) */
    title: string;
    description?: string | null;
    hypothesis?: string | null;
    primary_kpi?: string | null;
    status?: string | null;
    from_source?: string | null;
    tags?: string[];
    scores?: AbtIdeaScores | null;
    start_date?: AbtIdeaDateField | null;
    end_date?: AbtIdeaDateField | null;
    created_by?: AbtIdeaUserField | null;
    created_at?: AbtIdeaDateField | null;
    updated_by?: AbtIdeaUserField | null;
    updated_at?: AbtIdeaDateField | null;
    tests?: AbtIdeaLinkedTest[];
    owner?: AbtIdeaUserField | null;
}

export interface AbtIdeasResponse {
    data: AbtIdea[];
}

export type CreateIdeaPayload = {
    /** AB Tasty utilise `title` comme nom d’idée. */
    title: string;
    description?: string;
    status?: string;
    tags?: string[];
    [key: string]: unknown;
};

export type UpdateIdeaPayload = Partial<CreateIdeaPayload>;
