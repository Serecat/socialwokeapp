import React, { useEffect, useState } from 'react';
import { getMyProfile, UserProfileBasics } from '../../services/api';

interface ProfileProps {
  onBackToFeed: () => void;
  onUnauthorized: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onBackToFeed, onUnauthorized }) => {
  const [profile, setProfile] = useState<UserProfileBasics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await getMyProfile();
        setProfile(response);
      } catch {
        const hasToken = Boolean(localStorage.getItem('access_token'));
        if (hasToken) {
          setErrorMessage('Unable to load profile right now. Please try again.');
          return;
        }

        onUnauthorized();
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [onUnauthorized]);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto w-full max-w-3xl">
        <button
          type="button"
          onClick={onBackToFeed}
          className="mb-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ← Back to feed
        </button>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
          {isLoading ? (
            <p className="text-sm text-slate-600">Loading profile...</p>
          ) : errorMessage ? (
            <p className="text-sm text-red-600">{errorMessage}</p>
          ) : profile ? (
            <>
              <h1 className="text-2xl font-bold text-slate-900">
                {profile.firstName} {profile.lastName}
              </h1>
              <p className="mt-2 text-sm text-slate-600">Signed in as {profile.email}</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Posts</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">0</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Followers</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">0</p>
                </div>
              </div>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
};

export default Profile;
