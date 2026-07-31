import React, { useState } from 'react';
import { User, KeyRound, LogIn, Cpu, ShieldAlert } from 'lucide-react';
import { loginUsuario } from '../services/api';

export default function LoginScreen({ onLoginSuccess, playSound }) {
  const [user, setUser] = useState('admin');
  const [pass, setPass] = useState('1234');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (playSound) playSound.playButtonClick();

    if (!user || !pass) {
      setErrorMsg("Informe credencial e chave de segurança.");
      return;
    }

    setLoading(true);
    try {
      const res = await loginUsuario(user, pass);
      if (res && res.success) {
        if (playSound) playSound.playSuccessSound();
        const nomeOficial = res.nome || user;
        onLoginSuccess(nomeOficial);
      } else {
        setErrorMsg(res?.message || "Acesso negado.");
      }
    } catch (err) {
      setErrorMsg("Falha na comunicação com o servidor de dados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="system-card glass-cyber">
      <div className="card-header">
        <h2>
          <Cpu size={20} className="glow-icon" />
          Autenticação
        </h2>
        <p>IDENTIFICAÇÃO DO OFICIAL DE PATRIMÔNIO</p>
      </div>

      {errorMsg && (
        <div className="error-alert">
          <ShieldAlert size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleLogin}>
        <div className="input-group">
          <label htmlFor="user">
            <User size={14} />
            Credencial de Acesso
          </label>
          <input
            type="text"
            id="user"
            placeholder="Digite o usuário"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="pass">
            <KeyRound size={14} />
            Chave de Segurança
          </label>
          <input
            type="password"
            id="pass"
            placeholder="••••••••"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-tech-start" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner"></span>
              VALIDANDO ACESSO...
            </>
          ) : (
            <>
              <LogIn size={18} />
              ENTRAR NO SISTEMA
            </>
          )}
        </button>
      </form>
    </div>
  );
}
