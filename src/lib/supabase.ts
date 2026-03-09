import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser client — uses anon key, safe to use in client components.
 * Uses @supabase/ssr for proper session management with cookies.
 */
export const supabaseBrowser = createBrowserClient(supabaseUrl, supabaseAnonKey);

/**
 * Legacy browser client using supabase-js directly (for queries not requiring auth cookies).
 */
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
