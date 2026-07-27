import { SHOP_SECTOR_LABELS } from '@shared/lib/shopSectors';
import { cn } from '@shared/lib/cn';
import { Banner, Button, Card, InputField, SelectField } from '@shared/ui';

import { useDemoRequestForm } from '../hooks/useDemoRequestForm';

interface DemoRequestPanelProps {
  initialEmail?: string;
}

export function DemoRequestPanel({ initialEmail }: DemoRequestPanelProps) {
  const { form, fieldErrors, submitSuccess, updateField, submit, setSector } = useDemoRequestForm(
    initialEmail !== undefined ? { initialEmail } : {},
  );

  return (
    <section className="mx-auto max-w-xl px-6 pb-20">
      <Card className="p-6 md:p-8">
        <h2 className="mb-2 text-xl font-extrabold text-text-primary">Planifier votre démo</h2>
        <p className="mb-6 text-sm text-text-secondary">
          Remplissez le formulaire : votre client mail s’ouvrira avec un message prérempli à envoyer
          à notre équipe.
        </p>

        {submitSuccess ? (
          <Banner variant="success" className="mb-6">
            Votre client mail devrait s’ouvrir. Si rien ne se passe, vérifiez que votre navigateur
            autorise l’ouverture des liens mailto.
          </Banner>
        ) : null}

        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          noValidate
        >
          <InputField
            id="demo-full-name"
            label="Nom complet"
            name="fullName"
            autoComplete="name"
            value={form.fullName}
            onChange={(event) => void updateField('fullName', event.target.value)}
            error={fieldErrors.fullName}
            errorId="demo-full-name-error"
          />

          <InputField
            id="demo-email"
            label="E-mail"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => void updateField('email', event.target.value)}
            error={fieldErrors.email}
            errorId="demo-email-error"
          />

          <InputField
            id="demo-company"
            label="Entreprise (optionnel)"
            name="company"
            autoComplete="organization"
            value={form.company}
            onChange={(event) => void updateField('company', event.target.value)}
            error={fieldErrors.company}
            errorId="demo-company-error"
          />

          <SelectField
            id="demo-sector"
            label="Secteur"
            name="sector"
            value={form.sector}
            onChange={(event) => void setSector(event.target.value as typeof form.sector)}
            error={fieldErrors.sector}
            errorId="demo-sector-error"
          >
            {SHOP_SECTOR_LABELS.map((sector) => (
              <option key={sector} value={sector}>
                {sector}
              </option>
            ))}
          </SelectField>

          <div className="flex flex-col gap-1.5 text-left">
            <label
              htmlFor="demo-message"
              className="text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              Message (optionnel)
            </label>
            <textarea
              id="demo-message"
              name="message"
              rows={4}
              value={form.message}
              onChange={(event) => void updateField('message', event.target.value)}
              className={cn(
                'w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100',
                fieldErrors.message &&
                  'border-red-500 ring-2 ring-red-100 focus:border-red-500 focus:ring-red-100',
              )}
              aria-invalid={Boolean(fieldErrors.message)}
              aria-describedby={fieldErrors.message ? 'demo-message-error' : undefined}
            />
            {fieldErrors.message ? (
              <p id="demo-message-error" className="m-0 text-sm text-red-500" role="alert">
                {fieldErrors.message}
              </p>
            ) : null}
          </div>

          <Button type="submit" variant="primary" size="lg" className="mt-2 w-full">
            Envoyer ma demande
          </Button>
        </form>
      </Card>
    </section>
  );
}
