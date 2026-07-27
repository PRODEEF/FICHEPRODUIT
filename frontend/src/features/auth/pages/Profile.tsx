import { useAuth } from '@shared/hooks/useAuth';
import { Card, InputField } from '@shared/ui';

// Crédits / facturation temporairement désactivés
// import { BillingAccountSection } from '../../billing/components/BillingAccountSection';
import { ChangePasswordForm } from '../components/ChangePasswordForm';
import { ProfileForm } from '../components/ProfileForm';

export function Profile() {
  const { userEmail } = useAuth();

  return (
    <div className="relative z-[1] w-full px-12 pb-12 pt-9">
      <header className="mb-6">
        <div>
          <h1 className="m-0 text-3xl font-extrabold text-text-primary">Mon profil</h1>
          <p className="mt-1 text-sm text-text-muted">Mettez à jour vos informations de compte</p>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <Card className="flex flex-col gap-8">
          <InputField
            id="profile-email"
            label="Adresse e-mail"
            name="email"
            type="email"
            autoComplete="email"
            value={userEmail ?? ''}
            disabled
            readOnly
          />

          <ProfileForm />
          <ChangePasswordForm />
        </Card>

        {/* Crédits / facturation temporairement désactivés */}
        {/* <BillingAccountSection /> */}
      </div>
    </div>
  );
}
