import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPost, FeedPost, FeedType, getFeed } from '../../services/api';

interface FeedProps {
  onOpenProfile: () => void;
  onLogout: () => void;
}

const formatPostedDate = (isoDate: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(isoDate));

const Feed: React.FC<FeedProps> = ({ onOpenProfile, onLogout }) => {
  const [feedType, setFeedType] = useState<FeedType>('followers');
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [postContent, setPostContent] = useState('');

  const feedTitle = useMemo(
    () => (feedType === 'followers' ? 'Following feed' : 'Global feed'),
    [feedType],
  );

  const loadFeed = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      const response = await getFeed(feedType);
      setPosts(response.data);
    } catch {
      setErrorMessage('Unable to load feed right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [feedType]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleCreatePost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedContent = postContent.trim();

    if (!trimmedContent) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await createPost({
        content: trimmedContent,
        visibility: feedType === 'global' ? 'PUBLIC' : 'FOLLOWERS_ONLY',
      });
      setPostContent('');
      await loadFeed();
    } catch {
      setErrorMessage('Unable to publish your post right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <h2 className="text-lg font-semibold text-slate-900">{feedTitle}</h2>
            <p className="mt-1 text-sm text-slate-600">
              Toggle between your following timeline and the full global timeline.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setFeedType('followers')}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  feedType === 'followers'
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-300 text-slate-700'
                }`}
              >
                Following
              </button>
              <button
                type="button"
                onClick={() => setFeedType('global')}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  feedType === 'global'
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-300 text-slate-700'
                }`}
              >
                Global
              </button>
            </div>
          </div>

          <form
            onSubmit={handleCreatePost}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5"
          >
            <label htmlFor="post-content" className="text-sm font-medium text-slate-700">
              Share something
            </label>
            <textarea
              id="post-content"
              value={postContent}
              onChange={(event) => setPostContent(event.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="What do you want to post today?"
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-300 focus:ring"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-500">{postContent.length}/2000</span>
              <button
                disabled={isSubmitting || !postContent.trim()}
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>

          {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

          {isLoading ? (
            <article className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-900/5">
              Loading feed...
            </article>
          ) : posts.length === 0 ? (
            <article className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-900/5">
              No posts yet for this feed.
            </article>
          ) : (
            posts.map((post) => (
              <article key={post.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">
                    {post.author
                      ? `${post.author.firstName} ${post.author.lastName}`
                      : 'You'}
                  </p>
                  <p className="text-xs text-slate-500">{formatPostedDate(post.createdAt)}</p>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-800">{post.content}</p>
                <div className="mt-4 flex gap-2 text-xs text-slate-600">
                  <span className="rounded-full bg-slate-100 px-3 py-1">❤️ {post.likeCount} likes</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    💬 {post.commentCount} comments
                  </span>
                </div>
              </article>
            ))
          )}
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