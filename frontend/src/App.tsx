import React, {useState} from 'react';
import Login from './screens/Auth/Login';
import Signup from './screens/Auth/Signup';

function App() {
  const [authMode, setAuthmode] = useState<'login' | 'signup'>('login');
  const [loggedInEmail, setLoggedInEmail] = useState('');

  if (loggedInEmail) { 
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-900/10">
          <h1 className="text-2xl font-bold text-slate-900">You are logged in</h1>
          <p className="mt-3 text-slate-600">Signed in as {loggedInEmail}</p>
          <button
            type="button"
            className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            onClick={() => {
              localStorage.removeItem('access_token');
              setLoggedInEmail('');
            }}
          >
            Logout 
          </button>  
        </div>
      </main> 
  );
}

return (
  <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-blue-100 px-4 py-10">
    {authMode === 'login' ? (
      <Login onSuccess={setLoggedInEmail} switchToSignup={() => setAuthmode('signup')} />
    ) : (
      <Signup switchToLogin={() => setAuthmode('login')} />  
    )}
  </main>
);
}

export default App;
