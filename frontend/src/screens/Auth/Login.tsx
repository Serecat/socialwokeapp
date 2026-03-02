import React, { FormEvent, useState } from 'react';
import axios from 'axios';
import { loginUser } from '../../services/api';

interface LoginProps {
  onSuccess: (email: string) => void;
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
      localStorage.setItem('access_token', response.access_token);
      onSuccess(email);
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
      <h1 className="text-2xl font-bold text-slate-900">Login</h1>
      <p className="mt-2 text-sm text-slate-600">Welcome back! Access your account.</p>

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
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
        
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <p className="mt-6 text-center text-sm text-slate-600">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={switchToSignup}
          className="font-semibold text-blue-600 hover:text-blue-700"
        >
          Sign up
        </button>
      </p>
    </div>
  );
};

export default Login;
