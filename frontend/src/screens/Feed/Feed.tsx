import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  addPostComment,
  createPost,
  FeedPost,
  FeedType,
  getFeed,
  getMyProfile,
  getPostComments,
  PostComment,
  searchUsers,
  togglePostLike,
  UserProfileBasics,
} from '../../services/api';
import { getInitials, getAvatarColor } from '../../utils/avatar';
import Chat from '../Chat/Chat';

interface FeedProps {
  onOpenProfile: () => void;
  onOpenUserProfile: (userId: string) => void;
  onLogout: () => void;
}

type ActiveView = 'home' | 'explore' | 'messages';

// ── Helpers ────────────────────────────────────────────────────────────────

const formatRelativeTime = (isoDate: string): string => {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

// ── Icons ──────────────────────────────────────────────────────────────────

const SparkleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
);

const HomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const ExploreIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const MessagesIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
);

const ProfileIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LogoutIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const HeartIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const CommentIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

// ── Avatar ─────────────────────────────────────────────────────────────────

interface AvatarProps {
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg';
}

const Avatar: React.FC<AvatarProps> = ({ firstName, lastName, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'h-7 w-7 text-xs' : size === 'lg' ? 'h-12 w-12 text-base' : 'h-9 w-9 text-xs';
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${sizeClass} ${getAvatarColor(firstName)}`}>
      {getInitials(firstName, lastName)}
    </div>
  );
};

// ── Component ──────────────────────────────────────────────────────────────

type NavItemId = ActiveView | 'profile';

interface NavItem {
  id: NavItemId;
  label: string;
  Icon: React.FC<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'explore', label: 'Explore', Icon: ExploreIcon },
  { id: 'messages', label: 'Messages', Icon: MessagesIcon },
  { id: 'profile', label: 'Profile', Icon: ProfileIcon },
];

const Feed: React.FC<FeedProps> = ({ onOpenProfile, onOpenUserProfile, onLogout }) => {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const feedType: FeedType = activeView === 'explore' ? 'explore' : 'followers';

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, PostComment[]>>({});
  const [commentInputByPost, setCommentInputByPost] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfileBasics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [postContent, setPostContent] = useState('');
  const [currentUser, setCurrentUser] = useState<UserProfileBasics | null>(null);

  const postTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getMyProfile()
      .then(setCurrentUser)
      .catch(() => { /* silently ignore — sidebar user info is non-critical */ });
  }, []);

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

  useEffect(() => {
    const runSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
    };
    runSearch().catch(() => setSearchResults([]));
  }, [searchQuery]);

  const handleCreatePost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedContent = postContent.trim();
    if (!trimmedContent) return;

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await createPost({ content: trimmedContent, visibility: 'PUBLIC' });
      setPostContent('');
      await loadFeed();
    } catch {
      setErrorMessage('Unable to publish your post right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    await togglePostLike(postId);
    await loadFeed();
  };

  const handleToggleComments = async (postId: string) => {
    const isExpanded = expandedComments.has(postId);
    if (isExpanded) {
      setExpandedComments((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    } else {
      setExpandedComments((prev) => new Set(prev).add(postId));
      if (!commentsByPost[postId]) {
        const comments = await getPostComments(postId);
        setCommentsByPost((prev) => ({ ...prev, [postId]: comments }));
      }
    }
  };

  const handleCommentSubmit = async (postId: string) => {
    const content = (commentInputByPost[postId] ?? '').trim();
    if (!content) return;
    await addPostComment(postId, content);
    setCommentInputByPost((prev) => ({ ...prev, [postId]: '' }));
    const comments = await getPostComments(postId);
    setCommentsByPost((prev) => ({ ...prev, [postId]: comments }));
    await loadFeed();
  };

  const focusComposer = () => {
    if (activeView !== 'home' && activeView !== 'explore') setActiveView('home');
    setTimeout(() => {
      postTextareaRef.current?.focus();
      postTextareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  };

  const handleNavClick = (id: NavItemId) => {
    if (id === 'profile') {
      onOpenProfile();
    } else {
      setActiveView(id);
    }
  };

  const feedTitle = activeView === 'explore' ? 'Explore' : 'Home Feed';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-7xl">

        {/* ── Left Sidebar ── */}
        <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-slate-100 bg-white px-4 py-6">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-600 px-4 py-3 text-white shadow-sm">
            <SparkleIcon className="h-5 w-5" />
            <span className="text-lg font-bold tracking-tight">SocialWoke</span>
          </div>

          {/* Nav */}
          <nav className="space-y-1">
            {NAV_ITEMS.map(({ id, label, Icon }) => {
              const isActive = id === activeView;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleNavClick(id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-purple-600' : ''}`} />
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="flex-1" />

          {/* Create Post */}
          <button
            type="button"
            onClick={focusComposer}
            className="mb-6 w-full rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            Create Post
          </button>

          {/* Current user */}
          {currentUser && (
            <div className="flex items-center gap-3">
              <Avatar firstName={currentUser.firstName} lastName={currentUser.lastName} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {currentUser.firstName} {currentUser.lastName}
                </p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Log out"
                className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <LogoutIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </aside>

        {/* ── Center Feed ── */}
        <main className="flex min-h-screen flex-1 flex-col border-x border-slate-100">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur">
            <h1 className="text-xl font-bold text-slate-900">{feedTitle}</h1>
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setActiveView('home')}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeView === 'home'
                    ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Following
              </button>
              <button
                type="button"
                onClick={() => setActiveView('explore')}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeView === 'explore'
                    ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Explore
              </button>
            </div>
          </div>

          {activeView === 'messages' ? (
            /* Real-time Chat */
            <Chat />
          ) : (
            <div className="divide-y divide-slate-100">
              {/* Post composer */}
              <div className="bg-white px-6 py-5">
                <div className="flex gap-3">
                  {currentUser && (
                    <Avatar firstName={currentUser.firstName} lastName={currentUser.lastName} size="md" />
                  )}
                  <form onSubmit={handleCreatePost} className="flex-1">
                    <textarea
                      ref={postTextareaRef}
                      id="post-content"
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      maxLength={2000}
                      rows={3}
                      placeholder="What's on your mind?"
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-purple-300 focus:bg-white focus:ring-2 focus:ring-purple-100"
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-slate-400">{postContent.length}/2000</span>
                      <button
                        type="submit"
                        disabled={isSubmitting || !postContent.trim()}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <SparkleIcon className="h-3.5 w-3.5" />
                        {isSubmitting ? 'Posting…' : 'Post'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {errorMessage && (
                <div className="bg-red-50 px-6 py-3 text-sm text-red-700">{errorMessage}</div>
              )}

              {/* Feed */}
              {isLoading ? (
                <div className="flex justify-center py-16">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                </div>
              ) : posts.length === 0 ? (
                <div className="py-16 text-center text-sm text-slate-500">
                  No posts yet. Follow some people or check the Explore feed.
                </div>
              ) : (
                posts.map((post) => (
                  <article key={post.id} className="bg-white px-6 py-5 transition hover:bg-slate-50/60">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => post.author?.id && onOpenUserProfile(post.author.id)}
                        className="shrink-0"
                      >
                        <Avatar
                          firstName={post.author?.firstName ?? 'U'}
                          lastName={post.author?.lastName ?? ''}
                          size="md"
                        />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => post.author?.id && onOpenUserProfile(post.author.id)}
                            className="text-sm font-semibold text-slate-900 hover:underline"
                          >
                            {post.author
                              ? `${post.author.firstName} ${post.author.lastName}`
                              : 'You'}
                          </button>
                          <span className="text-xs text-slate-300">·</span>
                          <span className="text-xs text-slate-400">
                            {formatRelativeTime(post.createdAt)}
                          </span>
                        </div>

                        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                          {post.content}
                        </p>

                        {/* Actions */}
                        <div className="mt-3 flex items-center gap-5">
                          <button
                            type="button"
                            onClick={() => handleToggleComments(post.id)}
                            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-purple-600"
                          >
                            <CommentIcon className="h-4 w-4" />
                            {post.commentCount}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleLike(post.id)}
                            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-pink-600"
                          >
                            <HeartIcon className="h-4 w-4" />
                            {post.likeCount}
                          </button>
                        </div>

                        {/* Comments */}
                        {expandedComments.has(post.id) && (
                          <div className="mt-4 space-y-3">
                            {(commentsByPost[post.id] ?? []).map((comment) => (
                              <div key={comment.id} className="flex gap-2">
                                <Avatar
                                  firstName={comment.author.firstName}
                                  lastName={comment.author.lastName}
                                  size="sm"
                                />
                                <div className="flex-1 rounded-xl bg-slate-50 px-3 py-2">
                                  <span className="text-xs font-semibold text-slate-800">
                                    {comment.author.firstName} {comment.author.lastName}
                                  </span>
                                  <p className="text-xs text-slate-600">{comment.content}</p>
                                </div>
                              </div>
                            ))}
                            <div className="flex gap-2">
                              <input
                                value={commentInputByPost[post.id] ?? ''}
                                onChange={(e) =>
                                  setCommentInputByPost((prev) => ({
                                    ...prev,
                                    [post.id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    void handleCommentSubmit(post.id);
                                  }
                                }}
                                placeholder="Write a comment…"
                                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-100"
                              />
                              <button
                                type="button"
                                onClick={() => void handleCommentSubmit(post.id)}
                                className="rounded-xl bg-purple-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-purple-700"
                              >
                                Send
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}
        </main>

        {/* ── Right Sidebar ── */}
        <aside className="sticky top-0 h-screen w-72 shrink-0 overflow-y-auto px-4 py-6">
          {/* Search */}
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Search people</h2>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name…"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-100"
            />
            {searchResults.length > 0 && (
              <ul className="mt-2 space-y-1">
                {searchResults.map((result) => (
                  <li key={result.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenUserProfile(result.id);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition hover:bg-slate-50"
                    >
                      <Avatar firstName={result.firstName} lastName={result.lastName} size="sm" />
                      <span className="text-sm text-slate-800">
                        {result.firstName} {result.lastName}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Trending topics */}
          <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Trending topics</h2>
            <ul className="space-y-3">
              {['#welcome', '#freespeech', '#chronologicalfeed', '#opensource'].map((tag) => (
                <li key={tag}>
                  <span className="text-sm font-medium text-purple-700">{tag}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default Feed;