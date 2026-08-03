import { LegalDocumentPage } from '../components/LegalDocumentPage';
import { TERMS_OF_SERVICE } from '../lib/legalContent';

export function TermsOfService() {
  return <LegalDocumentPage content={TERMS_OF_SERVICE} />;
}
