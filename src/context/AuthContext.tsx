"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export type UserRole = "super_admin" | "admin" | "member" | "view";

export interface UserProfile {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    status: "pending" | "approved" | "rejected";
}

interface AuthContextValue {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    profile: null,
    loading: true,
    signOut: async () => {},
    refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async (userId: string) => {
        const { data } = await supabaseBrowser
            .from("profiles")
            .select("id, email, name, role, status")
            .eq("id", userId)
            .single();
        setProfile(data as UserProfile ?? null);
    }, []);

    const refreshProfile = useCallback(async () => {
        if (user) await fetchProfile(user.id);
    }, [user, fetchProfile]);

    useEffect(() => {
        // Charger la session initiale
        supabaseBrowser.auth.getUser().then(({ data: { user: u } }) => {
            setUser(u);
            if (u) {
                fetchProfile(u.id).finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        });

        // Écouter les changements d'état auth
        const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange(
            async (_event, session) => {
                const u = session?.user ?? null;
                setUser(u);
                if (u) {
                    await fetchProfile(u.id);
                } else {
                    setProfile(null);
                }
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, [fetchProfile]);

    const signOut = async () => {
        await supabaseBrowser.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
