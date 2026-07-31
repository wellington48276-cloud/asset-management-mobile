import { useState } from 'react';
import { Lock, LogIn, ShieldCheck, User } from 'lucide-react';
import { loginUsuario } from '../services/api';

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
    if (result.success) onLoginSuccess(result.nome || user);
    else setError(result.error || 'Não foi possível entrar.');
  };

  return (
    <section className="login-hero">
      <div className="login-card-modern">
        <div className="login-brand-mark"><ShieldCheck size={30} /></div>
        <div className="login-heading">
          <span>GESTÃO PATRIMONIAL</span>
          <h2>Acesso ao sistema</h2>
          <p>Identifique-se para iniciar a coleta móvel de bens.</p>
        </div>
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={submit} className="form-stack login-form-modern">
          <label>
            <span><User size={16} /> Usuário</span>
            <input value={user} onChange={(event) => setUser(event.target.value)} autoComplete="username" placeholder="Digite seu usuário" required />
          </label>
          <label>
            <span><Lock size={16} /> Senha</span>
            <input type="password" value={pass} onChange={(event) => setPass(event.target.value)} autoComplete="current-password" placeholder="Digite sua senha" required />
          </label>
          <button className="primary-button login-submit" disabled={loading}>
            <LogIn size={19} /> {loading ? 'ENTRANDO...' : 'ENTRAR'}
          </button>
        </form>
        <small className="login-security">Acesso protegido e registro local seguro</small>
      </div>
    </section>
  );
}
