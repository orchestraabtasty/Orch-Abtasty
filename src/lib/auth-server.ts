import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase-server";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Creates a Supabase client that reads cookies from the Next.js request context.
 * For use in API routes (Next.js App Router).
 */
async function createApiClient() {
    const cookieStore = await cookies();
    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll() {
                // Read-only in API routes — cookies set by middleware
            },
        },
    });
}

/**
 * Returns the authenticated user ID from the current request, or null if not authenticated.
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
    const client = await createApiClient();
    const { data: { user } } = await client.auth.getUser();
    return user?.id ?? null;
}

/**
 * Returns an error response (401) if the caller is not authenticated,
 * or an error response (403) if not approved. Otherwise returns null.
 */
export async function requireApproved(_req: Request): Promise<NextResponse | null> {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("status")
        .eq("id", userId)
        .single();

    if (profile?.status !== "approved") {
        return NextResponse.json({ error: "Account not approved" }, { status: 403 });
    }

    return null;
}

/**
 * Returns an error response if the caller is not an approved admin.
 */
export async function requireAdmin(_req: Request): Promise<NextResponse | null> {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("status, role")
        .eq("id", userId)
        .single();

    if (profile?.status !== "approved") {
        return NextResponse.json({ error: "Account not approved" }, { status: 403 });
    }

    if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
    }

    return null;
}
