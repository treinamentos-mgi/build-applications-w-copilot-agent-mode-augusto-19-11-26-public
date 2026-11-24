import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Entry = { teamName: string; totalPoints: number; rank: number };
type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; leaderboard: Entry[] };

export default function Leaderboard() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: Entry[] }>('/api/leaderboard')
      .then(({ leaderboard }) => { if (active) setState({ status: 'ready', leaderboard }); })
      .catch(() => { if (active) setState({ status: 'error' }); });
    return () => { active = false; };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Placar</h2>
        <p>Compare a pontuação total das equipes.</p>
        {state.status === 'loading' && <p role="status">Carregando placar...</p>}
        {state.status === 'error' && <p role="alert">Não foi possível carregar o placar. Tente novamente mais tarde.</p>}
        {state.status === 'ready' && state.leaderboard.length === 0 && <p>Sem pontuação registrada no momento.</p>}
        {state.status === 'ready' && state.leaderboard.length > 0 && (
          <ol className="mb-0">
            {state.leaderboard.map((entry, index) => (
              <li key={index}>{entry.teamName}: {entry.totalPoints} pontos</li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
