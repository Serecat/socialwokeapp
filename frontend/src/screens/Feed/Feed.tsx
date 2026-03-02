import React from 'react';

interface FeedProps {
  onOpenProfile: () => void;
  onLogout: () => void;
}

const Feed: React.FC<FeedProps> = ({ onOpenProfile, onLogout }) => {
  return (
    <main className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-slate-900">Socialwoke</h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenProfile}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              My profile
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 px-4 py-6 md:grid-cols-[240px_minmax(0,1fr)_280px]">
        <aside className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Menu</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li className="rounded-lg bg-blue-50 px-3 py-2 font-medium text-blue-700">Home feed</li>
            <li className="rounded-lg px-3 py-2">Explore</li>
            <li className="rounded-lg px-3 py-2">Messages</li>
          </ul>
        </aside>

        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5">
            <h2 className="text-lg font-semibold text-slate-900">Home</h2>
            <p className="mt-1 text-sm text-slate-600">
              Chronological posts from people you follow will appear here.
            </p>
          </div>

          {Array.from({ length: 3 }).map((_, index) => (
            <article
              key={index}
              className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5"
            >
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="mt-4 space-y-2">
                <div className="h-3 w-full rounded bg-slate-100" />
                <div className="h-3 w-11/12 rounded bg-slate-100" />
                <div className="h-3 w-9/12 rounded bg-slate-100" />
              </div>
              <div className="mt-4 flex gap-2">
                <div className="h-7 w-16 rounded-full bg-slate-100" />
                <div className="h-7 w-20 rounded-full bg-slate-100" />
              </div>
            </article>
          ))}
        </div>

        <aside className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Trends</h2>
          <ul className="mt-3 space-y-3 text-sm text-slate-700">
            <li>#welcome</li>
            <li>#freespeech</li>
            <li>#chronologicalfeed</li>
          </ul>
        </aside>
      </section>
    </main>
  );
};

export default Feed;