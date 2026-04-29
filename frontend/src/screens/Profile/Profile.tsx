import React, { useEffect, useState } from 'react';
import {
  FeedPost,
  FollowRequest,
  FollowResult,
  getMyProfile,
  getMyPosts,
  getUserProfile,
  UserProfileBasics,
  updateMyProfile,
  followUser,
  unfollowUser,
  getFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
} from '../../services/api';
import api from '../../services/api';
import { getAccessToken } from '../../services/api';

interface ProfileProps {
  userId?: string;
  onBackToFeed: () => void;
  onUnauthorized: () => void;
}

interface EditFormState {
  firstName: string;
  lastName: string;
  bio: string;
  isPrivate: boolean;
}

const Profile: React.FC<ProfileProps> = ({ userId, onBackToFeed, onUnauthorized }) => {
  const [profile, setProfile] = useState<UserProfileBasics | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [followStatus, setFollowStatus] = useState<'following' | 'requested' | 'none'>('none');
  const [followLoading, setFollowLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    firstName: '',
    lastName: '',
    bio: '',
    isPrivate: false,
  });
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [showFollowRequests, setShowFollowRequests] = useState(false);

  const isOwnProfile = !userId;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (userId) {
          const [profileResponse, postsResponse] = await Promise.all([
            getUserProfile(userId),
            api.get(`/posts/user/${userId}/posts`),
          ]);
          setProfile(profileResponse);
          setPosts(postsResponse.data.data as FeedPost[]);
          const status = (profileResponse as UserProfileBasics & { followStatus?: 'following' | 'requested' | 'none' }).followStatus ?? 'none';
          setFollowStatus(status);
        } else {
          const [profileResponse, postsResponse] = await Promise.all([getMyProfile(), getMyPosts()]);
          setProfile(profileResponse);
          setPosts(postsResponse.data);
          // Load incoming follow requests for own profile
          const requests = await getFollowRequests();
          setFollowRequests(requests);
        }
      } catch {
        const hasToken = Boolean(getAccessToken());
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
  }, [onUnauthorized, userId]);

  const handleFollowToggle = async () => {
    if (!userId || followLoading) return;
    setFollowLoading(true);
    try {
      let result: FollowResult;
      if (followStatus === 'following' || followStatus === 'requested') {
        result = await unfollowUser(userId);
        setFollowStatus('none');
        if (followStatus === 'following' && profile) {
          setProfile({ ...profile, followerCount: (profile.followerCount ?? 1) - 1 });
        }
      } else {
        result = await followUser(userId);
        if (result.status === 'following') {
          setFollowStatus('following');
          if (profile) {
            setProfile({ ...profile, followerCount: (profile.followerCount ?? 0) + 1 });
          }
        } else if (result.status === 'requested') {
          setFollowStatus('requested');
        }
      }
    } catch {
      // silently ignore
    } finally {
      setFollowLoading(false);
    }
  };

  const startEdit = () => {
    if (!profile) return;
    setEditForm({
      firstName: profile.firstName,
      lastName: profile.lastName,
      bio: profile.bio ?? '',
      isPrivate: profile.isPrivate ?? false,
    });
    setEditError('');
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditError('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      const updated = await updateMyProfile({
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        bio: editForm.bio,
        isPrivate: editForm.isPrivate,
      });
      setProfile((prev) => (prev ? { ...prev, ...updated } : updated));
      setIsEditing(false);
    } catch {
      setEditError('Failed to save profile. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFollowRequest(requestId);
      setFollowRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch {
      // silently ignore
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectFollowRequest(requestId);
      setFollowRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch {
      // silently ignore
    }
  };

  const followButtonLabel = () => {
    if (followLoading) return '…';
    if (followStatus === 'following') return 'Unfollow';
    if (followStatus === 'requested') return 'Cancel Request';
    return 'Follow';
  };

  const followButtonClass = () => {
    const base = 'rounded-lg px-4 py-2 text-sm font-medium transition-colors';
    if (followStatus === 'following') return `${base} border border-slate-300 bg-white text-slate-700 hover:bg-red-50 hover:text-red-600`;
    if (followStatus === 'requested') return `${base} border border-amber-300 bg-amber-50 text-amber-700`;
    return `${base} bg-blue-600 text-white hover:bg-blue-700`;
  };

  const isProfileLimited = profile?.isPrivate && !isOwnProfile && followStatus !== 'following';

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <button type="button" onClick={onBackToFeed} className="mb-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">← Back to feed</button>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
          {isLoading ? (
            <p className="text-sm text-slate-600">Loading profile...</p>
          ) : errorMessage ? (
            <p className="text-sm text-red-600">{errorMessage}</p>
          ) : profile ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-slate-900">{profile.firstName} {profile.lastName}</h1>
                  {profile.isPrivate && (
                    <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">🔒 Private</span>
                  )}
                  {!isProfileLimited && profile.bio && (
                    <p className="mt-2 text-sm text-slate-600">{profile.bio}</p>
                  )}
                  {isProfileLimited && (
                    <p className="mt-2 text-sm text-slate-500 italic">This account is private. Follow to see their posts.</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  {isOwnProfile && (
                    <button type="button" onClick={startEdit} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                      Edit Profile
                    </button>
                  )}
                  {!isOwnProfile && (
                    <button type="button" onClick={handleFollowToggle} disabled={followLoading} className={followButtonClass()}>
                      {followButtonLabel()}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Posts</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{posts.length}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Followers</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{profile.followerCount ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Following</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{profile.followingCount ?? 0}</p>
                </div>
              </div>

              {!isProfileLimited && profile.interests && profile.interests.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <span key={interest.id} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      {interest.name}
                    </span>
                  ))}
                </div>
              )}

              {isOwnProfile && followRequests.length > 0 && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setShowFollowRequests(!showFollowRequests)}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {followRequests.length} pending follow request{followRequests.length !== 1 ? 's' : ''} {showFollowRequests ? '▲' : '▼'}
                  </button>
                  {showFollowRequests && (
                    <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">
                      {followRequests.map((req) => (
                        <li key={req.id} className="flex items-center justify-between px-4 py-3">
                          <span className="text-sm text-slate-800">{req.fromUser.firstName} {req.fromUser.lastName}</span>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => handleAcceptRequest(req.id)} className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700">Accept</button>
                            <button type="button" onClick={() => handleRejectRequest(req.id)} className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">Reject</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          ) : null}
        </section>

        {isEditing && (
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
            <h2 className="text-lg font-semibold text-slate-900">Edit Profile</h2>
            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">First name</label>
                  <input
                    id="firstName"
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">Last name</label>
                  <input
                    id="lastName"
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-slate-700">Bio</label>
                <textarea
                  id="bio"
                  value={editForm.bio}
                  onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                  rows={3}
                  maxLength={500}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-slate-400">{editForm.bio.length}/500</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="isPrivate"
                  type="checkbox"
                  checked={editForm.isPrivate}
                  onChange={(e) => setEditForm((f) => ({ ...f, isPrivate: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <label htmlFor="isPrivate" className="text-sm text-slate-700">Private account</label>
              </div>
              {editError && <p className="text-sm text-red-600">{editError}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={editLoading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                  {editLoading ? 'Saving…' : 'Save changes'}
                </button>
                <button type="button" onClick={cancelEdit} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {!isProfileLimited && (
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
            <h2 className="text-lg font-semibold text-slate-900">Posts</h2>
            {isLoading ? null : posts.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">No posts yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {posts.map((post) => (
                  <article key={post.id} className="rounded-xl border border-slate-200 p-4">
                    <p className="whitespace-pre-wrap text-sm text-slate-800">{post.content}</p>
                    <div className="mt-3 flex gap-2 text-xs text-slate-600">
                      <span className="rounded-full bg-slate-100 px-3 py-1">❤️ {post.likeCount}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1">💬 {post.commentCount}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
};

export default Profile;
