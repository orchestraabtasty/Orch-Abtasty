import { NextResponse } from "next/server";
import { getToken } from "@/lib/abtasty";

const BASE_URL = process.env.ABT_API_BASE_URL ?? "https://api.abtasty.com";
const ACCOUNT_ID = process.env.ABT_ACCOUNT_ID ?? "";

export async function GET() {
    try {
        const token = await getToken();

        const res = await fetch(
            `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/tests?_page=1&_max_per_page=50`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                cache: "no-store",
            }
        );

        const json = await res.json();

        const total: number = json?._pagination?._total ?? 0;
        const pages: number = json?._pagination?._pages ?? 1;
        const firstPageCount: number = json?._data?.length ?? 0;

        return NextResponse.json(
            {
                ok: res.ok,
                status: res.status,
                statusText: res.statusText,
                pagination: {
                    total,
                    pages,
                    first_page_count: firstPageCount,
                    note:
                        pages > 1
                            ? `⚠️ ${pages} pages détectées — getCampaigns() pagine automatiquement.`
                            : `✅ Tout tient sur 1 page (${total} tests).`,
                },
                raw: JSON.stringify(json),
            },
            { status: res.ok ? 200 : 500 }
        );
    } catch (error) {
        return NextResponse.json(
            {
                ok: false,
                error: String(error),
            },
            { status: 500 }
        );
    }
}
