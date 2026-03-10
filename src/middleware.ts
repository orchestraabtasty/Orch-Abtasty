import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase-middleware";
import { supabaseAdmin } from "@/lib/supabase-server";

/** Routes accessibles sans connexion */
const PUBLIC_PATHS = ["/login", "/signup", "/pending", "/reset-password"];

/** Routes accessibles uniquement aux admins */
const ADMIN_ONLY_PATHS = ["/settings"];

function isPublic(pathname: string) {
    return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isAdminOnly(pathname: string) {
    return ADMIN_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Ignorer les assets statiques et les routes API
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        pathname.startsWith("/api/") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    const response = NextResponse.next({
        request: { headers: request.headers },
    });

    const supabase = createSupabaseMiddlewareClient(request, response);

    // Rafraîchir la session si nécessaire
    const { data: { user } } = await supabase.auth.getUser();

    // Pas de session → redirect vers /login sauf si route publique
    if (!user) {
        if (isPublic(pathname)) return response;
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirectTo", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Utilisateur connecté sur une page publique (/login, /signup) → redirect /dashboard
    if (user && (pathname === "/login" || pathname === "/signup")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Lire le profil pour vérifier status et role
    const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("status, role")
        .eq("id", user.id)
        .single();

    const status = profile?.status ?? "pending";
    const role = profile?.role ?? "member";

    // Compte en attente ou rejeté → /pending (sauf si déjà dessus)
    if (status !== "approved" && pathname !== "/pending") {
        return NextResponse.redirect(new URL("/pending", request.url));
    }

    // Compte approuvé sur /pending → dashboard
    if (status === "approved" && pathname === "/pending") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Settings réservé aux admins et super_admin
    if (isAdminOnly(pathname) && !["admin", "super_admin"].includes(role)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)",
    ],
};
