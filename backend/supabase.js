const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = (process.env.SUPABASE_URL || "")
    .trim()
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/+$/, "");

const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ""
).trim();

const supabaseConfigurado =
    Boolean(supabaseUrl) &&
    Boolean(supabaseKey) &&
    !supabaseUrl.includes("SEU_PROJETO") &&
    !supabaseKey.includes("sua_chave");

const supabase = supabaseConfigurado
    ? createClient(supabaseUrl, supabaseKey)
    : null;

if (!supabaseConfigurado) {
    console.warn(
        "[SUPABASE] SUPABASE_URL e SUPABASE_KEY ainda não foram configurados em backend/.env."
    );
}

module.exports = {
    supabase,
    supabaseConfigurado
};

