import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { isApiError } from '@api/apiError';
import { deleteAccount } from '@api/user';
import { apiErrorMessage } from '@lib/apiErrorMessage';
import { useAuth } from '@shared/hooks/useAuth';

import {
  deleteAccountSchema,
  type DeleteAccountInput,
  type DeleteAccountPayload,
} from '../lib/authSchemas';

const WRONG_PASSWORD_MESSAGE = 'Mot de passe incorrect.';
const GENERIC_ERROR_MESSAGE =
  'La suppression du compte a échoué. Réessayez dans quelques instants.';

/**
 * Gère la suppression définitive du compte connecté :
 * - ouvre/ferme la modale de confirmation ;
 * - valide le mot de passe via RHF + Zod ;
 * - appelle l'API, déconnecte l'utilisateur et redirige vers la home après succès.
 */
export function useDeleteAccount() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  const form = useForm<DeleteAccountInput, unknown, DeleteAccountPayload>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { password: '' },
  });

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  const openModal = useCallback(() => {
    reset();
    setModalOpen(true);
  }, [reset]);

  const closeModal = useCallback(() => {
    if (isSubmitting) return;
    setModalOpen(false);
    reset();
  }, [isSubmitting, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await deleteAccount(data.password);
    } catch (err) {
      if (isApiError(err) && (err.status === 401 || err.status === 403)) {
        setError('password', { message: WRONG_PASSWORD_MESSAGE });
        return;
      }
      toast.error(apiErrorMessage(err, GENERIC_ERROR_MESSAGE));
      return;
    }

    toast.success('Compte supprimé. À bientôt.');
    setModalOpen(false);
    try {
      await signOut();
    } catch {
      // La session Supabase peut être invalidée côté serveur : on ignore et on redirige.
    }
    void navigate('/', { replace: true });
  });

  return {
    modalOpen,
    openModal,
    closeModal,
    onSubmit,
    control,
    errors,
    isSubmitting,
  };
}
