import React, { FormEvent, useState } from 'react';
import axios from 'axios';
import { loginUser, setAccessToken } from '../../services/api';

interface LoginProps {
  onSuccess: () => void;
  switchToSignup: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess, switchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with /auth/login API
    setError('');
    setIsSubmitting(true);

        try {
      const response = await loginUser({ email, password });
      setAccessToken(response.access_token);
      onSuccess();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Unable to login. Please try again.');
      } else {
        setError('Unable to login. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (

    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-900/10">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 text-white">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
          </svg>
        </div>
        <span className="text-lg font-bold text-slate-900">SocialWoke</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Login</h1>
      <p className="mt-2 text-sm text-slate-500">Welcome back — sign in to continue.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />
        </div>
        
        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      
      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={switchToSignup}
          className="font-semibold text-purple-600 hover:text-purple-700"
        >
          Sign up
        </button>
      </p>
    </div>
  );
};

export default Login;
