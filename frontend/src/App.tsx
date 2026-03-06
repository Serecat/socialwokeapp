import React, {useState} from 'react';
import Login from './screens/Auth/Login';
import Signup from './screens/Auth/Signup';
import Feed from './screens/Feed/Feed';
import Profile from './screens/Profile/Profile';

type AuthMode = 'login' | 'signup';
type AppView = 'auth' | 'feed' | 'profile';

function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [view, setView] = useState<AppView>('auth');
  
  const handleLoginSuccess = (_email: string) => {
    setView('feed');
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setView('auth');
    setAuthMode('login');
  };

  if (view === 'feed') {
    return <Feed onOpenProfile={() => setView('profile')} onLogout={handleLogout} />;
  }

  if (view === 'profile') {
    return (
      <Profile
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
