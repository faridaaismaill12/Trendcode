// =============================================================
// Trendcode accounts: Supabase connection settings.
//
// 1. Create a free project at https://supabase.com
// 2. Run supabase/schema.sql in the project's SQL editor
// 3. Copy Project Settings → API → "Project URL" and the "anon public" key below
//
// The anon key is designed to be public: Row Level Security in schema.sql
// is what keeps each person's data private. Never put the service_role key here.
//
// Leave these empty and the site still works: profiles and characters are
// saved in the visitor's browser only, without sign-in or syncing.
// =============================================================
window.TC_CONFIG = {
  supabaseUrl: "",      // e.g. "https://abcdefghijkl.supabase.co"
  supabaseAnonKey: "",  // e.g. "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
};
