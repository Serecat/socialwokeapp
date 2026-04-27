import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './screens/Auth/Login';
import Signup from './screens/Auth/Signup';
import Feed from './screens/Feed/Feed';
import Profile from './screens/Profile/Profile';
import {
  setAccessToken,
  setOnUnauthenticated,
  logoutUser,
} from './services/api';

type AuthMode = 'login' | 'signup';
type AppView = 'auth' | 'feed' | 'profile' | 'loading';

function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [view, setView] = useState<AppView>('loading');
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);

  const goToAuth = () => {
    setAccessToken(null);
    setView('auth');
    setAuthMode('login');
    setSelectedUserId(undefined);
  };

  useEffect(() => {
    setOnUnauthenticated(goToAuth);

    // Attempt silent refresh to restore session from httpOnly cookie
    axios
      .post<{ access_token: string }>(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      .then(({ data }) => {
        setAccessToken(data.access_token);
        setView('feed');
      })
      .catch(() => {
        setView('auth');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoginSuccess = () => {
    setView('feed');
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // ignore errors — always redirect to auth
    }
    goToAuth();
  };

  if (view === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-blue-100">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  if (view === 'feed') {
    return (
      <Feed
        onOpenProfile={() => {
          setSelectedUserId(undefined);
          setView('profile');
        }}
        onOpenUserProfile={(userId) => {
          setSelectedUserId(userId);
          setView('profile');
        }}
        onLogout={handleLogout}
      />
    );
  }

  if (view === 'profile') {
    return (
      <Profile
        userId={selectedUserId}
        onBackToFeed={() => setView('feed')}
        onUnauthorized={handleLogout}
      />
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-blue-100 px-4 py-10">
      {authMode === 'login' ? (
        <Login onSuccess={handleLoginSuccess} switchToSignup={() => setAuthMode('signup')} />
      ) : (
        <Signup switchToLogin={() => setAuthMode('login')} />
      )}
    </main>
  );
}

export default App;
