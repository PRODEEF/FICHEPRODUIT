import { useCallback, useEffect, useState } from 'react';

import { parseZodFieldErrors } from '@shared/lib/parseZodErrors';
import type { ShopSectorLabel } from '@shared/lib/shopSectors';

import { buildDemoRequestMailto } from '../lib/buildDemoRequestMailto';
import {
  demoRequestSchema,
  type DemoRequestInput,
  type DemoRequestPayload,
} from '../lib/marketingSchemas';

type DemoRequestFieldErrors = Partial<Record<keyof DemoRequestInput, string>>;

interface UseDemoRequestFormOptions {
  initialEmail?: string;
}

const EMPTY_FORM: DemoRequestInput = {
  fullName: '',
  email: '',
  company: '',
  sector: 'Glisse',
  message: '',
};

export function useDemoRequestForm({ initialEmail = '' }: UseDemoRequestFormOptions = {}) {
  const [form, setForm] = useState<DemoRequestInput>({ ...EMPTY_FORM, email: initialEmail });
  const [fieldErrors, setFieldErrors] = useState<DemoRequestFieldErrors>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (!initialEmail) return;
    // Différé pour éviter un setState synchrone dans le corps de l'effet
    queueMicrotask(() => {
      setForm((current) => (current.email === '' ? { ...current, email: initialEmail } : current));
    });
  }, [initialEmail]);

  const updateField = useCallback(
    <K extends keyof DemoRequestInput>(field: K, value: DemoRequestInput[K]) => {
      setForm((current) => ({ ...current, [field]: value }));
      setFieldErrors((current) => {
        if (!current[field]) return current;
        const next: DemoRequestFieldErrors = { ...current };
        Reflect.deleteProperty(next, field);
        return next;
      });
      setSubmitSuccess(false);
    },
    [],
  );

  const submit = useCallback(() => {
    const result = demoRequestSchema.safeParse(form);
    if (!result.success) {
      setFieldErrors(parseZodFieldErrors<keyof DemoRequestInput>(result.error));
      setSubmitSuccess(false);
      return;
    }

    openDemoRequestMailto(result.data);
    setFieldErrors({});
    setSubmitSuccess(true);
  }, [form]);

  return {
    form,
    fieldErrors,
    submitSuccess,
    updateField,
    submit,
    setSector: (sector: ShopSectorLabel) => void updateField('sector', sector),
  };
}

function openDemoRequestMailto(payload: DemoRequestPayload): void {
  const mailto = buildDemoRequestMailto(payload);
  window.location.href = mailto;
}
