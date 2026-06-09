import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { getSupabaseClient } from '@shared/supabase';
import { useAuth } from '@shared/hooks/useAuth';

import {
  changePasswordSchema,
  type ChangePasswordInput,
  type ChangePasswordPayload,
} from '../lib/authSchemas';
import { changePasswordWithVerification } from '../lib/passwordAuth';

export function useChangePassword() {
  const { userEmail } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput, unknown, ChangePasswordPayload>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      passwordConfirm: '',
    },
  });

  const newPasswordValue = useWatch({
    control,
    name: 'newPassword',
    defaultValue: '',
  });

  const onSubmit = handleSubmit(async (data) => {
    if (!userEmail) {
      toast.error('Impossible de modifier le mot de passe : e-mail du compte indisponible.');
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      toast.error('Configuration Supabase manquante. Vérifiez le fichier .env du frontend.');
      return;
    }

    const result = await changePasswordWithVerification(
      supabase,
      userEmail,
      data.currentPassword,
      data.newPassword,
    );
    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    reset();
    toast.success('Mot de passe mis à jour.');
  });

  return {
    register,
    control,
    onSubmit,
    errors,
    isSubmitting,
    newPasswordValue,
  };
}
