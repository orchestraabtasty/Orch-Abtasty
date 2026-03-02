import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser client — uses anon key, safe to use in client components.
 * Uses RLS policies for access control.
 */
export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey);
