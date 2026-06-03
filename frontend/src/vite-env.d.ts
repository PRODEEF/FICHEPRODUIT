/// <reference types="vite/client" />

/**
 * Variables `VITE_*` lues dans l’app — typage explicite pour éviter `any` sur `import.meta.env[...]`.
 * Étendre ici quand de nouvelles clés sont ajoutées au `.env`.
 */
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  // readonly VITE_CRISP_WEBSITE_ID?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUGGEST_URLS_URL?: string;
}
