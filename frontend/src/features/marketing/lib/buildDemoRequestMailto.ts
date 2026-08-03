import type { DemoRequestPayload } from './marketingSchemas';
import { getContactEmail } from './pricingConstants';

/** Construit un lien mailto prérempli pour une demande de démo commerciale. */
export function buildDemoRequestMailto(payload: DemoRequestPayload): string {
  const subject = encodeURIComponent(`Demande de démo — secteur ${payload.sector}`);

  const lines = [
    'Bonjour,',
    '',
    'Je souhaite planifier une démo de Fiche Produit.',
    '',
    `Nom : ${payload.fullName}`,
    `E-mail : ${payload.email}`,
    `Entreprise : ${payload.company ?? '—'}`,
    `Secteur : ${payload.sector}`,
  ];

  if (payload.message) {
    lines.push('', 'Message :', payload.message);
  }

  const body = encodeURIComponent(lines.join('\n'));
  return `mailto:${getContactEmail()}?subject=${subject}&body=${body}`;
}
