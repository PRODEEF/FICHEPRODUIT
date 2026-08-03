import { LegalDocumentPage } from '../components/LegalDocumentPage';
import { PRIVACY_POLICY } from '../lib/legalContent';

export function PrivacyPolicy() {
  return <LegalDocumentPage content={PRIVACY_POLICY} />;
}
