import { LegalDocumentPage } from '../components/LegalDocumentPage';
import { LEGAL_NOTICE } from '../lib/legalContent';

export function LegalNotice() {
  return <LegalDocumentPage content={LEGAL_NOTICE} />;
}
