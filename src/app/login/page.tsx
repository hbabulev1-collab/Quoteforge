'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div style={{ minHeight: '100vh', background: '#E8E6E1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#1F2421', padding: '40px 36px', borderRadius: 4, width: 380 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#FAF8F4', marginBottom: 4 }}>
          QUOTE<span style={{ color: '#FF6B1A' }}>FORGE</span>
        </div>
        <div style={{ fontSize: 13, color: '#8B9088', marginBottom: 28 }}>Вход в профила</div>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Имейл"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Парола"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ ...inputStyle, marginTop: 12 }}
          />

          {error && (
            <div style={{ color: '#FF6B1A', fontSize: 13, marginTop: 12 }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', marginTop: 20, background: '#FF6B1A', color: '#1F2421',
              border: 'none', padding: '12px', fontWeight: 700, fontSize: 14,
              borderRadius: 2, cursor: 'pointer', opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Влизане...' : 'Влез'}
          </button>
        </form>

        <div style={{ marginTop: 20, fontSize: 13, color: '#8B9088', textAlign: 'center' }}>
          Нямаш профил?{' '}
          <Link href="/signup" style={{ color: '#FF6B1A' }}>Регистрирай се</Link>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#2A302C', border: '1px solid #3C433D', color: '#FAF8F4',
  padding: '11px 12px', fontSize: 14, borderRadius: 2, boxSizing: 'border-box',
};
