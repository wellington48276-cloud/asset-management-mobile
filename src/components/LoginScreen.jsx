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
    <section className="login-screen cyber-login" aria-labelledby="login-title">
      <div className="login-panel cyber-login__panel">
        <div className="cyber-login__identity">
          <img
            className="cyber-login__coat"
            src={brasaoPrefeitura}
            alt="Brasão da Prefeitura"
          />

          <div className="cyber-login__heading">
            <h2 id="login-title">
              INTEGRAÇÃO E TRATAMENTO DE PATRIMÔNIO
            </h2>
            <p>Sistema corporativo de gestão patrimonial</p>
          </div>
        </div>

        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="login-form cyber-login__form">
          <label>
            <span>
              <User size={15} aria-hidden="true" />
              USUÁRIO
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
              <Lock size={15} aria-hidden="true" />
              SENHA
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
            className="primary-button cyber-login__submit"
            disabled={loading}
          >
            {loading ? 'ENTRANDO...' : 'ENTRAR'}
          </button>
        </form>
      </div>
    </section>
  );
}
