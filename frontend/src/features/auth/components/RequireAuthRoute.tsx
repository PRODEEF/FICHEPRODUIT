import { Navigate, Outlet } from 'react-router';

import { useAuth } from '@shared/hooks/useAuth';

/**
 * Garde de route applicable à toute route privée.
 *
 * Tant que la session Supabase n'est pas hydratée (`loading`), affiche un fallback de
 * chargement commun pour éviter le flash d'une redirection avant restauration de la session.
 * Si aucune session n'est disponible une fois l'hydratation terminée, redirige vers `/login`.
 * Sinon, délègue le rendu aux routes enfants via `<Outlet />`.
 *
 * Utiliser ce composant comme `element` d'une route parente regroupant les routes privées
 * permet de centraliser le contrôle d'accès et d'éviter sa duplication dans chaque page.
 */
export function RequireAuthRoute() {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div
        role="status"
        aria-busy="true"
        aria-live="polite"
        className="relative z-[1] flex min-h-[60vh] w-full flex-1 flex-col items-center justify-center gap-4 px-12 pb-12 pt-9"
      >
        <div
          aria-hidden
          className="h-12 w-12 animate-spin rounded-full border-3 border-soft border-t-purple-600 motion-reduce:animate-none"
        />
        <p className="text-sm text-text-secondary">Vérification de la session…</p>
      </div>
    );

  if (!user) return <Navigate to="/login" replace />;
  
  return <Outlet />;
}
