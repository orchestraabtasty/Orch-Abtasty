import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Creates a Supabase client for use in Next.js middleware.
 * Reads/writes cookies from the request/response.
 */
export function createSupabaseMiddlewareClient(
    request: NextRequest,
    response: NextResponse
) {
    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) =>
                    request.cookies.set(name, value)
                );
                cookiesToSet.forEach(({ name, value, options }) =>
                    response.cookies.set(name, value, options)
                );
            },
        },
    });
}
