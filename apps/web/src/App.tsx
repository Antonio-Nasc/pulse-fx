import { useEffect, useState } from 'react';

import './App.css';

import { IndicatorDetailPage } from './features/indicators/IndicatorDetailPage';
import { IndicatorsDashboard } from './features/indicators/IndicatorsDashboard';
import {
  createIndicatorPath,
  readIndicatorSlug,
} from './lib/app-navigation';

function App() {
  const [selectedSlug, setSelectedSlug] = useState(
    readIndicatorSlug,
  );

  useEffect(() => {
    const handlePopState = () => {
      setSelectedSlug(readIndicatorSlug());
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const openIndicator = (slug: string) => {
    window.history.pushState(
      { pulseFxView: 'detail' },
      '',
      createIndicatorPath(slug),
    );
    setSelectedSlug(slug);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showDashboard = () => {
    window.history.pushState({}, '', '/');
    setSelectedSlug(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const returnToDashboard = () => {
    if (window.history.state?.pulseFxView === 'detail') {
      window.history.back();
      return;
    }

    window.history.replaceState({}, '', '/');
    setSelectedSlug(null);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <a
          className="brand"
          href="/"
          aria-label="Pulse FX"
          onClick={(event) => {
            event.preventDefault();

            if (selectedSlug) {
              showDashboard();
            }
          }}
        >
          <span className="brand__mark">P</span>
          <span>Pulse FX</span>
        </a>

        <span className="app-header__tagline">
          Dados oficiais. Decisões conscientes.
        </span>
      </header>

      {selectedSlug ? (
        <IndicatorDetailPage
          slug={selectedSlug}
          onBack={returnToDashboard}
          key={selectedSlug}
        />
      ) : (
        <IndicatorsDashboard
          onSelectIndicator={openIndicator}
        />
      )}

      <footer className="app-footer">
        <strong>Pulse FX</strong>
        <p>
          Conteúdo exclusivamente educacional. Não constitui
          recomendação de investimento.
        </p>
      </footer>
    </div>
  );
}

export default App;
