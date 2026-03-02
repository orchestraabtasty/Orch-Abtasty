import type {
    AbtTokenResponse,
    AbtCampaign,
    AbtCampaignsResponse,
} from "@/types/abtasty";

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

    const body = {
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
    };

    const res = await fetch(`${BASE_URL}/oauth/v2/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(body),
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
 * Makes an authenticated GET request to the AB Tasty Public API.
 * `path` doit être un chemin complet à partir de la racine, ex:
 * `/api/core/accounts/{account_id}/tests`.
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

function mapAbtTest(t: any): AbtCampaign {
    const masterName: string | undefined = t.master?.name;
    const localeLabel: string | undefined = t.name;

    return {
        id: t.id,
        name: masterName
            ? `${masterName}${localeLabel ? ` (${localeLabel})` : ""}`
            : localeLabel ?? "",
        status: (t.status ?? t.state ?? "") as any,
        type: t.type ?? t.test_type ?? "",
        url: t.url ?? t.master?.url ?? null,
        labels: Array.isArray(t.labels) ? t.labels : [],
        visitors: t.traffic?.visitors ?? 0,
        start_date:
            t.start_datetime ??
            t.live_at?.readable_date ??
            t.created_at?.readable_date ??
            null,
        end_date:
            t.stop_datetime ??
            t.last_pause?.readable_date ??
            null,
        created_at: t.created_at?.readable_date ?? null,
        assigned_users: [],
        goals: [],
        variations:
            t.variations?.map((v: any) => ({
                id: v.id,
                name: v.name,
                traffic: v.traffic,
            })) ?? [],
    };
}

/**
 * Fetches all tests/campaigns for the configured account.
 * Aligne l’endpoint sur celui utilisé par l’UI AB Tasty :
 * Appel sans has_redirection pour récupérer tous les tests. Pagination sur _pagination._pages.
 */
export async function getCampaigns(): Promise<AbtCampaign[]> {
    try {
        const first = await abtFetch<any>(
            `/api/v1/accounts/${ACCOUNT_ID}/tests?_page=1&_max_per_page=50`
        );

        const pages: number = first._pagination?._pages ?? 1;
        let items: any[] = first._data ?? [];

        for (let page = 2; page <= pages; page++) {
            const next = await abtFetch<any>(
                `/api/v1/accounts/${ACCOUNT_ID}/tests?_page=${page}&_max_per_page=50`
            );
            if (Array.isArray(next._data)) {
                items = items.concat(next._data);
            }
        }

        return items.map(mapAbtTest);
    } catch (error) {
        console.error("[abtasty] getCampaigns error:", error);
        throw error;
    }
}

/**
 * Fetches a single test/campaign by ID.
 */
export async function getCampaign(id: number | string): Promise<AbtCampaign> {
    // Public API: GET /api/v1/accounts/[account_id]/tests/[test_id]
    const t = await abtFetch<any>(
        `/api/v1/accounts/${ACCOUNT_ID}/tests/${id}`
    );

    return mapAbtTest(t);
}

/**
 * Updates the status of a test/campaign in AB Tasty.
 */
export async function updateCampaignStatus(
    id: number | string,
    status: string
): Promise<AbtCampaign> {
    // Public API: PATCH /api/v1/accounts/[account_id]/tests/[test_id]
    return abtPatch<AbtCampaign>(
        `/api/v1/accounts/${ACCOUNT_ID}/tests/${id}`,
        { status }
    );
}
