import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { getSupabaseClient } from '@shared/supabase';
import { useAuth } from '@shared/hooks/useAuth';

import { profileSchema, type ProfileInput, type ProfilePayload } from '../lib/authSchemas';
import { saveUserProfile } from '../lib/userProfile';
import { createSupabaseUserRepository } from '../supabaseUserRepository';

export function useProfileForm() {
  const { user, profile, refreshProfile } = useAuth();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput, unknown, ProfilePayload>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: profile?.username ?? '' },
    values: { username: profile?.username ?? '' },
  });

  const onSubmit = handleSubmit(async (data) => {
    setSuccess(false);
    clearErrors('root');

    if (!user) return;

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('root', {
        message: 'Configuration Supabase manquante. Vérifiez le fichier .env du frontend.',
      });
      return;
    }

    const repo = createSupabaseUserRepository(supabase);
    const result = await saveUserProfile(repo, user, data);
    if (!result.ok) {
      setError('root', { message: result.message });
      return;
    }

    setSuccess(true);
    await refreshProfile();
  });

  return {
    register,
    onSubmit,
    errors,
    isSubmitting,
    success,
    dismissSuccess: () => void setSuccess(false),
  };
}
