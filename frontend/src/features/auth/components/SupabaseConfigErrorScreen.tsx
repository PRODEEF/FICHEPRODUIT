import { Banner, Card, PageSection } from '@shared/ui';

/**
 * Écran affiché au démarrage lorsque les variables VITE_SUPABASE_* sont absentes.
 */
export function SupabaseConfigErrorScreen() {
  return (
    <PageSection className="max-w-2xl pt-8">
      <Card className="mx-auto w-full max-w-[34rem]">
        <h1 className="mb-4 text-center text-2xl font-extrabold text-text-primary">
          Configuration requise
        </h1>
        <Banner variant="error">
          Variables d'environnement Supabase manquantes. Copiez{' '}
          <code className="break-all text-[0.8em]">frontend/.env.example</code> vers{' '}
          <code className="break-all text-[0.8em]">frontend/.env</code> et renseignez l'URL ainsi
          que la clé anonyme, puis relancez le serveur de développement.
        </Banner>
      </Card>
    </PageSection>
  );
}
