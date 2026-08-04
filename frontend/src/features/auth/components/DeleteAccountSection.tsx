import { Controller } from 'react-hook-form';

import { Button, Card, Modal } from '@shared/ui';

import { PasswordField } from './PasswordField';
import { useDeleteAccount } from '../hooks/useDeleteAccount';

/**
 * Zone dangereuse du profil : suppression définitive du compte.
 *
 * Le bouton principal ouvre une modale qui demande la ré-authentification par mot de passe
 * avant d'appeler l'API. Le composant ne contient aucune logique métier : tout est délégué
 * au hook `useDeleteAccount`.
 */
export function DeleteAccountSection() {
  const { modalOpen, openModal, closeModal, onSubmit, control, errors, isSubmitting } =
    useDeleteAccount();

  return (
    <Card className="flex flex-col gap-4 border-red-200 bg-red-50/40">
      <div>
        <h2 className="m-0 text-xl font-bold text-red-700">Supprimer mon compte</h2>
        <p className="mt-1 text-sm text-red-900/80">
          Cette action est définitive. Vos analyses, votre boutique et l’historique associé seront
          effacés et ne pourront pas être restaurés.
        </p>
      </div>

      <div>
        <Button type="button" variant="danger-outline" size="sm" onClick={openModal}>
          Supprimer définitivement mon compte
        </Button>
      </div>

      <Modal
        open={modalOpen}
        title="Confirmer la suppression du compte"
        onClose={closeModal}
        panelClassName="w-full max-w-[30rem] p-6 sm:p-8"
      >
        <h2 className="m-0 mb-2 text-lg font-bold text-text-primary">
          Confirmer la suppression du compte
        </h2>
        <p className="mb-5 text-sm text-text-secondary">
          Confirmez votre mot de passe pour supprimer votre compte. Cette action est
          <strong className="font-semibold text-red-700"> irréversible</strong>.
        </p>

        <form className="flex flex-col gap-4" noValidate onSubmit={(e) => void onSubmit(e)}>
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <PasswordField
                id="delete-account-password"
                label="Mot de passe actuel"
                autoComplete="current-password"
                placeholder="••••••••"
                required
                error={errors.password?.message}
                disabled={isSubmitting}
                {...field}
              />
            )}
          />

          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="neutral-outline"
              size="sm"
              disabled={isSubmitting}
              onClick={closeModal}
            >
              Annuler
            </Button>
            <Button type="submit" variant="danger-outline" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Suppression…' : 'Supprimer mon compte'}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
