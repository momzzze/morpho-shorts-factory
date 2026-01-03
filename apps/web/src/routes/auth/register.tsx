import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useTheme } from '../../theme';
import { useAppStore } from '@/app/store';
import { api } from '@/app/apiClient';

export const Route = createFileRoute('/auth/register')({
  component: RegisterPage,
});

function RegisterPage() {
  const { tokens } = useTheme();
  const navigate = useNavigate();
  const setAuth = useAppStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api<{ token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });

      // API already returns token + user in data
      setAuth({ token: res.token, user: res.user });

      navigate({ to: '/', replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="w-full max-w-md p-8 rounded-xl shadow-lg"
      style={{
        backgroundColor: tokens.surface,
        borderColor: tokens.border,
        borderWidth: '1px',
      }}
    >
      <h1
        className="text-3xl font-bold mb-6 text-center"
        style={{ color: tokens.primary }}
      >
        Register
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border focus:outline-none"
            style={{
              backgroundColor: tokens.bg,
              borderColor: tokens.border,
              color: tokens.fg,
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg border focus:outline-none"
            style={{
              backgroundColor: tokens.bg,
              borderColor: tokens.border,
              color: tokens.fg,
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg border focus:outline-none"
            style={{
              backgroundColor: tokens.bg,
              borderColor: tokens.border,
              color: tokens.fg,
            }}
          />
        </div>

        {error && (
          <div
            className="p-3 rounded-lg text-sm"
            style={{
              backgroundColor: tokens.danger + '20',
              color: tokens.danger,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg font-semibold transition disabled:opacity-50"
          style={{
            backgroundColor: tokens.primary,
            color: tokens.bg,
          }}
        >
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm opacity-70">
        Already have an account?{' '}
        <Link
          to="/auth/login"
          className="font-semibold hover:underline"
          style={{ color: tokens.primary }}
        >
          Login
        </Link>
      </p>
    </div>
  );
}
