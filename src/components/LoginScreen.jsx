import { useState } from 'react';
import { Lock, User } from 'lucide-react';
import { loginUsuario } from '../services/api';
import brasaoPrefeitura from '../assets/brasao-prefeitura.png';

export default function LoginScreen({ onLoginSuccess, playSound }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    playSound?.playButtonClick();

    try {
      const result = await loginUsuario(user.trim(), pass);

      if (result.success) {
        onLoginSuccess(result.nome || user.trim());
        return;
      }

      setError(result.error || 'Não foi possível entrar. Confira os dados informados.');
    } catch {
      setError('Não foi possível conectar ao sistema. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-screen" aria-labelledby="login-title">
      <div className="login-panel">
        <div className="login-panel__header">
          <img
            className="login-panel__coat"
            src={brasaoPrefeitura}
            alt="Brasão da Prefeitura"
          />

          <h2 id="login-title">Acesso ao Sistema</h2>
          <p>Gestão Patrimonial</p>
        </div>

        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="login-form">
          <label>
            <span>
              <User size={14} aria-hidden="true" />
              Usuário
            </span>
            <input
              value={user}
              onChange={(event) => setUser(event.target.value)}
              autoComplete="username"
              inputMode="text"
              placeholder="Digite seu usuário"
              required
            />
          </label>

          <label>
            <span>
              <Lock size={14} aria-hidden="true" />
              Senha
            </span>
            <input
              type="password"
              value={pass}
              onChange={(event) => setPass(event.target.value)}
              autoComplete="current-password"
              placeholder="Digite sua senha"
              required
            />
          </label>

          <button
            type="submit"
            className="primary-button login-panel__submit"
            disabled={loading}
          >
            {loading ? 'ENTRANDO...' : 'ENTRAR'}
          </button>
        </form>
      </div>
    </section>
  );
}
