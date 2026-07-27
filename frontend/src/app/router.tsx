import { lazy } from 'react';
import { Route } from 'react-router';

import { RequireAuthRoute } from '../features/auth/components/RequireAuthRoute';

const Home = lazy(async () => {
  const m = await import('../features/landing/pages/Home');
  return { default: m.Home };
});
const PublicCatalog = lazy(async () => {
  const m = await import('../features/catalog/pages/PublicCatalog');
  return { default: m.PublicCatalog };
});
const Login = lazy(async () => {
  const m = await import('../features/auth/pages/Login');
  return { default: m.Login };
});
const Signup = lazy(async () => {
  const m = await import('../features/auth/pages/Signup');
  return { default: m.Signup };
});
const ForgotPassword = lazy(async () => {
  const m = await import('../features/auth/pages/ForgotPassword');
  return { default: m.ForgotPassword };
});
const ResetPassword = lazy(async () => {
  const m = await import('../features/auth/pages/ResetPassword');
  return { default: m.ResetPassword };
});
const Catalog = lazy(async () => {
  const m = await import('../features/catalog/pages/Catalog');
  return { default: m.Catalog };
});
const Profile = lazy(async () => {
  const m = await import('../features/auth/pages/Profile');
  return { default: m.Profile };
});
const MyStore = lazy(async () => {
  const m = await import('../features/store/pages/Store');
  return { default: m.MyStore };
});
// Pricing temporairement désactivé
// const Pricing = lazy(async () => {
//   const m = await import('../features/marketing/pages/Pricing');
//   return { default: m.Pricing };
// });
const DemoRequest = lazy(async () => {
  const m = await import('../features/marketing/pages/DemoRequest');
  return { default: m.DemoRequest };
});
const About = lazy(async () => {
  const m = await import('../features/marketing/pages/About');
  return { default: m.About };
});
const BillingSuccess = lazy(async () => {
  const m = await import('../features/billing/pages/BillingSuccess');
  return { default: m.BillingSuccess };
});
const BillingCancel = lazy(async () => {
  const m = await import('../features/billing/pages/BillingCancel');
  return { default: m.BillingCancel };
});

/** Enfants JSX directs du layout — ne pas envelopper dans un composant (React Router ignore les `<Route>` rendus par un composant). */
export const appRouteElements = (
  <>
    <Route path="/" element={<Home />} />
    <Route path="/catalog/public/:analysisId" element={<PublicCatalog />} />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/auth/reset-password" element={<ResetPassword />} />
    {/* Pricing temporairement désactivé */}
    {/* <Route path="/pricing" element={<Pricing />} /> */}
    <Route path="/billing/success" element={<BillingSuccess />} />
    <Route path="/billing/cancel" element={<BillingCancel />} />
    <Route path="/demo" element={<DemoRequest />} />
    <Route path="/about" element={<About />} />

    <Route element={<RequireAuthRoute />}>
      <Route path="/catalog" element={<Catalog />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/store" element={<MyStore />} />
    </Route>
  </>
);
