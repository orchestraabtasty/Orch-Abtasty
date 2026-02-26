import { NextResponse } from "next/server";

/**
 * GET /api/cron — Vercel Cron Job endpoint.
 * Triggers the sync between AB Tasty and Supabase on a schedule.
 * Configure in vercel.json: { "crons": [{ "path": "/api/cron", "schedule": "*\/5 * * * *" }] }
 */
export async function GET(req: Request) {
    // Verify it's called by Vercel Cron (in production)
    const authHeader = req.headers.get("authorization");
    if (
        process.env.NODE_ENV === "production" &&
        authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
        const res = await fetch(`${baseUrl}/api/sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();
        return NextResponse.json({ success: true, sync: data });
    } catch (err) {
        return NextResponse.json(
            { error: "Cron sync failed", details: String(err) },
            { status: 500 }
        );
    }
}
