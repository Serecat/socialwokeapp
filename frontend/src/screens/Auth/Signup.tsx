import React, { FormEvent, useEffect, useState } from 'react';
import axios from 'axios';
import { getInterests, Interest, registerUser } from '../../services/api';

interface SignupProps {
  switchToLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ switchToLogin }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selectedInterestIds, setSelectedInterestIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getInterests()
      .then(setInterests)
      .catch(() => { /* interests are optional at signup if fetch fails */ });
  }, []);

  const toggleInterest = (id: string) => {
    setSelectedInterestIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (selectedInterestIds.length === 0 && interests.length > 0) {
      setError('Please select at least one interest.');
      return;
    }

    setIsSubmitting(true);

    try {
      await registerUser({ firstName, lastName, email, password, interestIds: selectedInterestIds });
      setSuccess('Account created successfully. You can now log in.');
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setSelectedInterestIds([]);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Unable to register. Please try again.');
      } else {
        setError('Unable to register. Please try again.');
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
      <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
      <p className="mt-2 text-sm text-slate-500">Join the community in seconds.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">
              First name
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">
              Last name
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>

        </div>
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
            minLength={8}
            required
            className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />
        </div>

        {interests.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Interests <span className="text-slate-400">(select at least one)</span>
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {interests.map((interest) => {
                const selected = selectedInterestIds.includes(interest.id);
                return (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => toggleInterest(interest.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      selected
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {interest.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
        {success && <p className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">{success}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
      
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <button
          type="button"
          onClick={switchToLogin}
          className="font-semibold text-purple-600 hover:text-purple-700"
        >
          Login
        </button>
      </p>
    </div>
  );
};

export default Signup;
