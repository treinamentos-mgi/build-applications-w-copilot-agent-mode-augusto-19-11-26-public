import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { name: string; members: string[] };
type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; teams: Team[] };

export default function Teams() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then(({ teams }) => { if (active) setState({ status: 'ready', teams }); })
      .catch(() => { if (active) setState({ status: 'error' }); });
    return () => { active = false; };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Equipes</h2>
        <p>Gerencie equipes e integrantes.</p>
        {state.status === 'loading' && <p role="status">Carregando equipes...</p>}
        {state.status === 'error' && <p role="alert">Não foi possível carregar as equipes. Tente novamente mais tarde.</p>}
        {state.status === 'ready' && state.teams.length === 0 && <p>Sem equipes cadastradas no momento.</p>}
        {state.status === 'ready' && state.teams.length > 0 && (
          <ul className="list-unstyled mb-0">
            {state.teams.map((team, index) => (
              <li key={index}>{team.name}: {team.members.length} integrantes</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
