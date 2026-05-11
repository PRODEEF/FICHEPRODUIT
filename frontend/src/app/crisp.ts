import { Crisp } from 'crisp-sdk-web';

let crispBooted = false;

export function bootCrisp() {
  if (crispBooted) return;

  const websiteId = import.meta.env['VITE_CRISP_WEBSITE_ID'];
  if (!websiteId) return;

  Crisp.configure(websiteId);
  crispBooted = true;
}
