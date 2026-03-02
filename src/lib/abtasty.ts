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
    // The list endpoint returns locale-level items; the master holds the canonical data.
    // The single-test endpoint returns the master directly (no `.master` wrapper).
    const m = t.master ?? t;
    const masterName: string | undefined = m.name;
    const localeLabel: string | undefined = t.master ? t.name : undefined;

    // Dates: prefer explicit datetime strings, fall back to readable_date objects
    const liveDateRaw: string | null =
        m.start_datetime ??
        (m.live_at?.timestamp > 0 ? m.live_at.readable_date : null) ??
        null;
    const endDateRaw: string | null =
        m.stop_datetime ??
        (m.last_pause?.timestamp > 0 ? m.last_pause.readable_date : null) ??
        null;
    const createdRaw: string | null =
        m.created_at?.readable_date ?? null;

    // Labels: prefer master (canonical), fall back to locale
    const labels: string[] = Array.isArray(m.labels)
        ? m.labels
        : Array.isArray(t.labels) ? t.labels : [];

    // Normalise state/status : l'API peut renvoyer une string ou un objet { name: "in_qa" }.
    const toStateString = (v: unknown): string => {
        if (v == null) return "";
        if (typeof v === "string") return v.trim().toLowerCase();
        if (typeof v === "object" && v !== null && "name" in v && typeof (v as { name: unknown }).name === "string") {
            return ((v as { name: string }).name).trim().toLowerCase();
        }
        return String(v).trim().toLowerCase();
    };
    const tState = toStateString(t.state ?? t.status);
    const mState = toStateString(m.state ?? m.status);
    const rawState = tState || mState || "";

    // Ordre de priorité pour éviter les mauvaises colonnes (Terminé > Recette > Pause > Play).
    const isStopped =
        ["stopped", "archived", "archive"].includes(tState) ||
        ["stopped", "archived", "archive"].includes(mState);
    const isQa =
        rawState === "in_qa" ||
        ((t.qa_mode === true || m.qa_mode === true) && (rawState === "play" || rawState === "active"));
    const operationalStatus: string = isStopped
        ? "stopped"
        : isQa
          ? "in_qa"
          : rawState || "";

    return {
        id: t.id,
        name: masterName
            ? `${masterName}${localeLabel && localeLabel !== masterName ? ` (${localeLabel})` : ""}`
            : localeLabel ?? "",
        status: operationalStatus as any,
        type: m.type ?? m.test_type ?? t.type ?? t.test_type ?? "",
        url: m.url ?? t.url ?? null,
        labels,
        visitors: m.traffic?.visitors ?? t.traffic?.visitors ?? 0,
        traffic_value: m.traffic?.value ?? t.traffic?.value ?? null,
        start_date: liveDateRaw || null,
        end_date: endDateRaw || null,
        created_at: createdRaw ?? undefined,
        description: m.description || t.description || null,
        test_note: m.test_note || t.test_note || null,
        report_token: m.report?.token ?? t.report?.token ?? null,
        assigned_users: [],
        goals: (m.goals ?? t.goals ?? []).map((g: any) => ({
            id: g.id,
            name: g.name ?? "",
            type: g.type ?? null,
            target: g.target ?? null,
        })),
        variations: (m.variations ?? t.variations ?? []).map((v: any) => ({
            id: v.id,
            name: v.name ?? "",
            description: v.description ?? "",
            traffic: v.traffic ?? 0,
            type: v.type ?? "",
            is_redirection: v.is_redirection ?? false,
        })),
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
