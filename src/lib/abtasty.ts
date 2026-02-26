import type { AbtTokenResponse, AbtCampaign, AbtCampaignsResponse } from "@/types/abtasty";

const BASE_URL = process.env.ABT_API_BASE_URL ?? "https://api.abtasty.com";
const CLIENT_ID = process.env.ABT_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.ABT_CLIENT_SECRET ?? "";
const ACCOUNT_ID = process.env.ABT_ACCOUNT_ID ?? "";

// In-memory token cache (valid for the lifetime of a serverless function call)
let cachedToken: { access_token: string; expires_at: number } | null = null;

/**
 * Gets a valid OAuth2 access token using client_credentials grant.
 * Caches the token and refreshes it automatically before expiry.
 */
export async function getToken(): Promise<string> {
    const now = Date.now();

    // Return cached token if still valid (with 60s buffer)
    if (cachedToken && cachedToken.expires_at > now + 60_000) {
        return cachedToken.access_token;
    }

    const params = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
    });

    const res = await fetch(`${BASE_URL}/oauth/v2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
        cache: "no-store",
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`ABT auth failed: ${res.status} — ${text}`);
    }

    const data: AbtTokenResponse = await res.json();
    cachedToken = {
        access_token: data.access_token,
        expires_at: now + data.expires_in * 1000,
    };

    return data.access_token;
}

/**
 * Makes an authenticated GET request to the AB Tasty API.
 */
async function abtFetch<T>(path: string): Promise<T> {
    const token = await getToken();
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        cache: "no-store",
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`ABT API error: ${res.status} ${path} — ${text}`);
    }

    return res.json();
}

/**
 * Makes an authenticated PATCH request to the AB Tasty API.
 */
async function abtPatch<T>(path: string, body: object): Promise<T> {
    const token = await getToken();
    const res = await fetch(`${BASE_URL}${path}`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`ABT API PATCH error: ${res.status} ${path} — ${text}`);
    }

    return res.json();
}

/**
 * Fetches all campaigns for the configured account.
 */
export async function getCampaigns(): Promise<AbtCampaign[]> {
    try {
        const data = await abtFetch<AbtCampaignsResponse>(
            `/v1/accounts/${ACCOUNT_ID}/campaigns`
        );
        return data.data ?? [];
    } catch (error) {
        console.error("[abtasty] getCampaigns error:", error);
        throw error;
    }
}

/**
 * Fetches a single campaign by ID.
 */
export async function getCampaign(id: number | string): Promise<AbtCampaign> {
    return abtFetch<AbtCampaign>(
        `/v1/accounts/${ACCOUNT_ID}/campaigns/${id}`
    );
}

/**
 * Updates the status of a campaign in AB Tasty.
 */
export async function updateCampaignStatus(
    id: number | string,
    status: string
): Promise<AbtCampaign> {
    return abtPatch<AbtCampaign>(
        `/v1/accounts/${ACCOUNT_ID}/campaigns/${id}`,
        { status }
    );
}
