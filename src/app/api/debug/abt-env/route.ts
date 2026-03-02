import { NextResponse } from "next/server";
import { getToken } from "@/lib/abtasty";

export async function GET() {
    try {
        const token = await getToken();

        return NextResponse.json({
            ok: true,
            token_received: !!token,
            env: {
                has_client_id: !!process.env.ABT_CLIENT_ID,
                has_client_secret: !!process.env.ABT_CLIENT_SECRET,
                account_id: process.env.ABT_ACCOUNT_ID ?? null,
                auth_base_url: process.env.ABT_AUTH_BASE_URL ?? null,
                api_base_url: process.env.ABT_API_BASE_URL ?? null,
            },
        });
    } catch (error) {
        return NextResponse.json(
            {
                ok: false,
                error: String(error),
                env: {
                    has_client_id: !!process.env.ABT_CLIENT_ID,
                    has_client_secret: !!process.env.ABT_CLIENT_SECRET,
                    account_id: process.env.ABT_ACCOUNT_ID ?? null,
                    auth_base_url: process.env.ABT_AUTH_BASE_URL ?? null,
                    api_base_url: process.env.ABT_API_BASE_URL ?? null,
                },
            },
            { status: 500 }
        );
    }
}

