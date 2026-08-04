import { Navigate, Outlet } from 'react-router';

import { useAuth } from '@shared/hooks/useAuth';

/**
 * Garde de route imbriquée : bloque l’accès tant que l’e-mail n’est pas confirmé.
 *
 * Doit être positionnée à l’intérieur d’un `<RequireAuthRoute />` — c’est celui-ci qui gère
 * l’état `loading` de la session Supabase et redirige les non-authentifiés vers `/`. Une fois
 * la session hydratée, on redirige vers `/verify-email` si `email_confirmed_at` est absent ;
 * sinon on délègue au reste de l’arbre de routes.
 */
export function RequireVerifiedEmailRoute() {
  const { isEmailVerified } = useAuth();

  if (!isEmailVerified) return <Navigate to="/verify-email" replace />;

  return <Outlet />;
}
