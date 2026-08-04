import { useMemo, useState } from 'react';
import { ArrowRight, Lock, User } from 'lucide-react';
import { loginUsuario } from '../services/api';
import brasaoPrefeitura from '../assets/brasao-prefeitura.png';

export default function LoginScreen({ onLoginSuccess, playSound }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [blockedUntil, setBlockedUntil] = useState(0);

  const blockedMessage = useMemo(() => {
    if (!blockedUntil || blockedUntil <= Date.now()) return '';
    return `Acesso temporariamente bloqueado até ${new Date(blockedUntil).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`;
  }, [blockedUntil]);

  const submit = async (event) => {
    event.preventDefault();
    if (blockedUntil > Date.now()) return;
    setError('');
    setLoading(true);
    playSound?.playButtonClick();

    try {
      const result = await loginUsuario(user.trim(), pass);
      if (result.success) {
        onLoginSuccess({
          token: result.token,
          user: result.usuario || user.trim(),
          name: result.nome || user.trim(),
          expiresAt: Number(result.expiresAt)
        });
        return;
      }
      if (result.blockedUntil) setBlockedUntil(Number(result.blockedUntil));
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
          <img src={brasaoPrefeitura} alt="Brasão da Prefeitura" />
          <div>
            <span className="eyebrow">ACESSO SEGURO</span>
            <h2 id="login-title">Acesso ao Sistema</h2>
            <p>Patrimônio Bens Móveis</p>
          </div>
        </div>

        {(error || blockedMessage) && <div className="alert error" role="alert">{blockedMessage || error}</div>}

        <form onSubmit={submit} className="login-form">
          <label>
            <span><User size={15} /> Usuário</span>
            <input value={user} onChange={(event) => setUser(event.target.value)} autoComplete="username" placeholder="Digite seu usuário" required />
          </label>

          <label>
            <span><Lock size={15} /> Senha</span>
            <input type="password" value={pass} onChange={(event) => setPass(event.target.value)} autoComplete="current-password" placeholder="Digite sua senha" required />
          </label>

          <button type="submit" className="primary-button login-panel__submit" disabled={loading || blockedUntil > Date.now()}>
            {loading ? 'ENTRANDO...' : <>ENTRAR <ArrowRight size={18} /></>}
          </button>
        </form>
      </div>
    </section>
  );
}
