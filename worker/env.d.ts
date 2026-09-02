interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  ADMIN_EMAIL_DOMAIN: string;
  ASSETS: Fetcher;
}
