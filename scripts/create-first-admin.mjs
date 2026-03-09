/**
 * Script one-shot : crée le premier administrateur dans Supabase Auth + profil admin.
 *
 * Utilisation :
 *   node scripts/create-first-admin.mjs
 *
 * Variables d'environnement requises (dans .env.local ou export) :
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ADMIN_EMAIL      (email du premier admin)
 *   ADMIN_PASSWORD   (mot de passe temporaire, minimum 8 caractères)
 *   ADMIN_NAME       (nom affiché, optionnel)
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Charger .env.local manuellement
function loadEnv() {
    try {
        const envPath = resolve(__dirname, "../.env.local");
        const content = readFileSync(envPath, "utf-8");
        content.split("\n").forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) return;
            const idx = trimmed.indexOf("=");
            if (idx === -1) return;
            const key = trimmed.slice(0, idx).trim();
            const value = trimmed.slice(idx + 1).trim();
            if (!process.env[key]) process.env[key] = value;
        });
    } catch {
        // .env.local absent — variables attendues depuis l'environnement
    }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin";

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("❌  NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
    process.exit(1);
}
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("❌  ADMIN_EMAIL et ADMIN_PASSWORD sont requis.");
    console.error("    Exemple : ADMIN_EMAIL=admin@exemple.com ADMIN_PASSWORD=motdepasse123 node scripts/create-first-admin.mjs");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
    console.log(`\nCréation du premier admin : ${ADMIN_EMAIL}\n`);

    // 1. Vérifier si un profil admin existe déjà
    const { data: existing } = await supabase
        .from("profiles")
        .select("id, email, role")
        .eq("role", "admin")
        .limit(1);

    if (existing && existing.length > 0) {
        console.log(`ℹ️  Un admin existe déjà : ${existing[0].email} (id: ${existing[0].id})`);
        console.log("   Ce script n'a rien modifié. Utilisez le panel Settings pour gérer les rôles.\n");
        process.exit(0);
    }

    // 2. Créer l'utilisateur dans auth.users via Admin API
    const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true, // confirmer l'email directement
        user_metadata: { name: ADMIN_NAME },
    });

    if (createError) {
        if (createError.message.includes("already registered") || createError.message.includes("already exists")) {
            console.log(`ℹ️  L'utilisateur ${ADMIN_EMAIL} existe déjà dans Auth. Mise à jour du profil...`);
            // Récupérer l'utilisateur existant
            const { data: users } = await supabase.auth.admin.listUsers();
            const user = users.users.find((u) => u.email === ADMIN_EMAIL);
            if (!user) {
                console.error("❌  Impossible de trouver l'utilisateur existant.");
                process.exit(1);
            }
            await upsertAdminProfile(user.id, ADMIN_EMAIL, ADMIN_NAME);
        } else {
            console.error("❌  Erreur création utilisateur :", createError.message);
            process.exit(1);
        }
    } else {
        await upsertAdminProfile(authUser.user.id, ADMIN_EMAIL, ADMIN_NAME);
    }
}

async function upsertAdminProfile(userId, email, name) {
    const { error: profileError } = await supabase.from("profiles").upsert(
        {
            id: userId,
            email,
            name,
            role: "admin",
            status: "approved",
            updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
    );

    if (profileError) {
        console.error("❌  Erreur création profil :", profileError.message);
        process.exit(1);
    }

    console.log(`✅  Admin créé avec succès !`);
    console.log(`    Email    : ${email}`);
    console.log(`    Nom      : ${name}`);
    console.log(`    ID       : ${userId}`);
    console.log(`    Role     : admin`);
    console.log(`    Status   : approved`);
    console.log(`\n🔐  Connectez-vous sur /login avec ces identifiants.\n`);
}

main().catch((err) => {
    console.error("❌  Erreur inattendue :", err);
    process.exit(1);
});
