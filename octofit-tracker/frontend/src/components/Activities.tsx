import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = { type: string; minutes: number; points: number };
type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; activities: Activity[] };

const typeLabels: Record<string, string> = { run: 'Corrida', walk: 'Caminhada', cycle: 'Ciclismo', strength: 'Força' };

export default function Activities() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ activities: Activity[] }>('/api/activities')
      .then(({ activities }) => { if (active) setState({ status: 'ready', activities }); })
      .catch(() => { if (active) setState({ status: 'error' }); });
    return () => { active = false; };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Atividades</h2>
        <p>Acompanhe os minutos de atividade e os pontos das pessoas participantes.</p>
        {state.status === 'loading' && <p role="status">Carregando atividades...</p>}
        {state.status === 'error' && <p role="alert">Não foi possível carregar as atividades. Tente novamente mais tarde.</p>}
        {state.status === 'ready' && state.activities.length === 0 && <p>Sem atividades registradas no momento.</p>}
        {state.status === 'ready' && state.activities.length > 0 && (
          <ul className="list-unstyled mb-0">
            {state.activities.map((activity, index) => (
              <li key={index}>{typeLabels[activity.type] ?? activity.type}: {activity.minutes} min, {activity.points} pontos</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
