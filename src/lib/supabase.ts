import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Browser client — uses anon key, safe to use in client components.
 * Uses RLS policies for access control.
 */
export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Server-side client — uses service role key.
 * Only use in API routes / server actions, NEVER in client components.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
