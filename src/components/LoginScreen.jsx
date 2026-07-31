import { useState } from 'react';
import { Lock, LogIn, User } from 'lucide-react';
import { loginUsuario } from '../services/api';
import './editor-clean.css';

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

    const result = await loginUsuario(user, pass);
    setLoading(false);

    if (result.success) {
      onLoginSuccess(result.nome || user);
      return;
    }

    setError(result.error || 'Não foi possível entrar.');
  };

  return (
    <section className="login-screen">
      <div className="login-panel">
        <div className="login-panel__brand">
          <span className="login-panel__icon"><LogIn size={22} /></span>
          <div>
            <h2>Acesso ao sistema</h2>
            <p>Gestão Patrimonial</p>
          </div>
        </div>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={submit} className="login-form">
          <label>
            <span><User size={15} /> Usuário</span>
            <input
              value={user}
              onChange={(event) => setUser(event.target.value)}
              autoComplete="username"
              placeholder="Digite seu usuário"
              required
            />
          </label>

          <label>
            <span><Lock size={15} /> Senha</span>
            <input
              type="password"
              value={pass}
              onChange={(event) => setPass(event.target.value)}
              autoComplete="current-password"
              placeholder="Digite sua senha"
              required
            />
          </label>

          <button className="primary-button login-panel__submit" disabled={loading}>
            {loading ? 'ENTRANDO...' : 'ENTRAR'}
          </button>
        </form>
      </div>
    </section>
  );
}
