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

      setError(
        result.error ||
          'Não foi possível entrar. Confira os dados informados.'
      );
    } catch {
      setError('Não foi possível conectar ao sistema. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-screen institutional-login institutional-login--centered" aria-labelledby="login-title">
      <div className="login-panel institutional-login__panel">
        <div className="institutional-login__brand">
          <img
            className="institutional-login__coat"
            src={brasaoPrefeitura}
            alt="Brasão da Prefeitura"
          />

          <div className="institutional-login__titles">
            <h2 id="login-title">Acesso ao Sistema</h2>
            <p>Patrimônio Bens Móveis</p>
          </div>
        </div>

        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="login-form institutional-login__form">
          <label>
            <span>
              <User size={14} aria-hidden="true" />
              Usuário
            </span>
            <input
              value={user}
              onChange={(event) => setUser(event.target.value)}
              autoComplete="username"
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
