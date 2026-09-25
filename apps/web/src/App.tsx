import './App.css';

import { IndicatorsDashboard } from './features/indicators/IndicatorsDashboard';

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="/" aria-label="Pulse FX">
          <span className="brand__mark">P</span>
          <span>Pulse FX</span>
        </a>

        <span className="app-header__tagline">
          Dados oficiais. Decisões conscientes.
        </span>
      </header>

      <IndicatorsDashboard />

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