import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Suggestion = { title: string; reason: string };
type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; suggestions: Suggestion[] };

const userEmail = 'mona@example.com';

export default function Workouts() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: Suggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`)
      .then(({ suggestions }) => { if (active) setState({ status: 'ready', suggestions }); })
      .catch(() => { if (active) setState({ status: 'error' }); });
    return () => { active = false; };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Sugestões de treino</h2>
        <p>Receba recomendações de treino com base nos seus padrões de atividade.</p>
        {state.status === 'loading' && <p role="status">Carregando sugestões...</p>}
        {state.status === 'error' && <p role="alert">Não foi possível carregar as sugestões. Tente novamente mais tarde.</p>}
        {state.status === 'ready' && state.suggestions.length === 0 && <p>Sem sugestões de treino no momento.</p>}
        {state.status === 'ready' && state.suggestions.length > 0 && (
          <ul className="list-unstyled mb-0">
            {state.suggestions.map((suggestion, index) => (
              <li key={index}><strong>{suggestion.title}</strong>: {suggestion.reason}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
