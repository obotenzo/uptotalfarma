'use client';

import { useState } from 'react';

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const form = new FormData(e.currentTarget);
      const res = await fetch('/api/login', {
        method: 'POST',
        body: form,
      });

      if (res.ok) {
        window.location.href = '/dashboard';
        return;
      }

      const data = await res.json().catch(() => ({}));
      setError(data?.error || 'Não foi possível entrar.');
    } catch {
      setError('Falha de rede ao tentar entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="login-card" onSubmit={onSubmit}>
      <div className="login-badge">Dashboard Up Total Farma</div>
      <h1>Entrar no painel</h1>
      <p>Use seu login e senha para acessar mapas e unidades.</p>
      <label>
        Login
        <input name="username" type="text" placeholder="AdminUpTotalFarma" required autoComplete="username" />
      </label>
      <label>
        Senha
        <input name="password" type="password" placeholder="••••••••" required autoComplete="current-password" />
      </label>
      {error ? <div className="login-error">{error}</div> : null}
      <button type="submit" disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
