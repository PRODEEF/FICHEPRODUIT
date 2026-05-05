import { useSearchParams } from 'react-router';
import type { ResultTab } from '../../../components/analysis/AnalyseResult';

function parse(searchParams: URLSearchParams): ResultTab {
  return searchParams.get('tab') === 'template' ? 'template' : 'catalog';
}

export function useResultTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parse(searchParams);

  const setTab = (next: ResultTab) => {
    setSearchParams(
      (p) => {
        const updated = new URLSearchParams(p);
        if (next === 'catalog') updated.delete('tab');
        else updated.set('tab', 'template');
        return updated;
      },
      { replace: true },
    );
  };

  return { tab, setTab };
}
