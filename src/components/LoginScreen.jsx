import { useState } from 'react';
import { LogIn, User, Lock } from 'lucide-react';
import { loginUsuario } from '../services/api';
export default function LoginScreen({ onLoginSuccess, playSound }) {
  const [user,setUser]=useState(''); const [pass,setPass]=useState(''); const [loading,setLoading]=useState(false); const [error,setError]=useState('');
  const submit=async e=>{e.preventDefault(); setError(''); setLoading(true); playSound?.playButtonClick(); const r=await loginUsuario(user,pass); setLoading(false); if(r.success) onLoginSuccess(r.nome||user); else setError(r.error);};
  return <section className="panel compact"><div className="section-title"><LogIn/><div><h2>Acesso ao sistema</h2><p>Entre para iniciar uma coleta</p></div></div>
    {error&&<div className="alert error">{error}</div>}
    <form onSubmit={submit} className="form-stack">
      <label><span><User size={16}/> Usuário</span><input value={user} onChange={e=>setUser(e.target.value)} autoComplete="username" /></label>
      <label><span><Lock size={16}/> Senha</span><input type="password" value={pass} onChange={e=>setPass(e.target.value)} autoComplete="current-password" /></label>
      <button className="primary-button" disabled={loading}>{loading?'ENTRANDO...':'ENTRAR'}</button>
    </form></section>;
}
