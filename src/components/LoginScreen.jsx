import React, { useState } from 'react';
import { User, KeyRound, LogIn } from 'lucide-react';
import { loginUsuario } from '../services/api';

export default function LoginScreen({ onLoginSuccess }) {
  const [user, setUser] = useState('admin');
  const [pass, setPass] = useState('1234');
  const [loading, setLoading] = useState(false);

  const vibrar = () => {
    if ("vibrate" in navigator) navigator.vibrate(30);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!user || !pass) {
      alert("Por favor, informe credencial e chave de segurança.");
      return;
    }

    setLoading(true);
    try {
      const res = await loginUsuario(user, pass);
      if (res && res.success) {
        vibrar();
        const nomeOficial = res.nome || user;
        onLoginSuccess(nomeOficial);
      } else {
        alert(res?.message || "Acesso negado.");
      }
    } catch (err) {
      alert("Falha na comunicação com o servidor de dados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="system-card">
      <div className="card-header">
        <h2>
          <User size={20} />
          Autenticação
        </h2>
        <p>IDENTIFICAÇÃO DO OFICIAL DE PATRIMÔNIO</p>
      </div>

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
              VALIDANDO...
            </>
          ) : (
            <>
              <LogIn size={18} />
              ENTRAR
            </>
          )}
        </button>
      </form>
    </div>
  );
}
