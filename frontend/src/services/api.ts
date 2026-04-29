import axios from 'axios';

// In-memory access token store — never persisted to localStorage
let _accessToken: string | null = null;
let _onUnauthenticated: (() => void) | null = null;
let _isRefreshing = false;
let _refreshSubscribers: Array<(token: string | null) => void> = [];

export const setAccessToken = (token: string | null): void => {
  _accessToken = token;
};

export const getAccessToken = (): string | null => _accessToken;

export const setOnUnauthenticated = (fn: () => void): void => {
  _onUnauthenticated = fn;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // required for httpOnly refresh-token cookie
});

api.interceptors.request.use((config) => {
  if (_accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    const isAuthEndpoint = (originalRequest.url as string)?.includes('/auth/');

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      if (_isRefreshing) {
        return new Promise((resolve, reject) => {
          _refreshSubscribers.push((token) => {
            if (token) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              resolve(api(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      originalRequest._retry = true;
      _isRefreshing = true;

      try {
        const { data } = await axios.post<{ access_token: string }>(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        const newToken = data.access_token;
        setAccessToken(newToken);
        _refreshSubscribers.forEach((cb) => cb(newToken));
        _refreshSubscribers = [];
        _isRefreshing = false;
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        setAccessToken(null);
        _refreshSubscribers.forEach((cb) => cb(null));
        _refreshSubscribers = [];
        _isRefreshing = false;
        _onUnauthenticated?.();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserProfileBasics {
  id: string;
  firstName: string;
  lastName: string;
  bio?: string;
  isPrivate?: boolean;
  followerCount?: number;
  followingCount?: number;
  interests?: { id: string; name: string; slug: string }[];
}

export type FeedType = 'followers' | 'global';

export interface PostAuthor {
  id: string;
  firstName: string;
  lastName: string;
}

export interface PostComment {
  id: string;
  content: string;
  createdAt: string;
  author: PostAuthor;
}

export interface FeedPost {
  id: string;
  content: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likes?: { userId: string }[];
  author?: PostAuthor;
}

export interface PaginatedPostsResponse {
  data: FeedPost[];
  nextCursor: string | null;
}

export interface CreatePostPayload {
  content: string;
  visibility?: 'PUBLIC' | 'FOLLOWERS_ONLY';
}


export const registerUser = async (payload: RegisterPayload) => {
  const response = await api.post('/auth/register', payload);
  return response.data as {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
};

export const loginUser = async (payload: LoginPayload) => {
  const response = await api.post('/auth/login', payload);
  return response.data as { access_token: string };
};

export const getMyProfile = async () => {
  const response = await api.get('/users/me');
  return response.data as UserProfileBasics;
};

export const getUserProfile = async (userId: string) => {
  const response = await api.get(`/users/${userId}`);
  return response.data as UserProfileBasics;
};

export const searchUsers = async (query: string) => {
  const response = await api.get('/users/search', { params: { q: query } });
  return response.data as UserProfileBasics[];
};

export const getFeed = async (feedType: FeedType, cursor?: string) => {
  const endpoint = feedType === 'global' ? '/feed/global' : '/feed';
  const response = await api.get(endpoint, {
    params: {
      ...(cursor ? { cursor } : {}),
    },
  });

  return response.data as PaginatedPostsResponse;
};

export const createPost = async (payload: CreatePostPayload) => {
  const response = await api.post('/posts', payload);
  return response.data as FeedPost;
};

export const togglePostLike = async (postId: string) => {
  const response = await api.post(`/posts/${postId}/likes`);
  return response.data as { liked: boolean };
};

export const addPostComment = async (postId: string, content: string) => {
  const response = await api.post(`/posts/${postId}/comments`, { content });
  return response.data as PostComment;
};

export const getPostComments = async (postId: string) => {
  const response = await api.get(`/posts/${postId}/comments`);
  return response.data as PostComment[];
};

export const getMyPosts = async (cursor?: string) => {
  const response = await api.get('/posts/me/posts', {
    params: {
      ...(cursor ? { cursor } : {}),
    },
  });

  return response.data as PaginatedPostsResponse;
};

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  bio?: string;
  isPrivate?: boolean;
  interestIds?: string[];
}

export type FollowStatus = 'following' | 'requested' | 'none';

export interface FollowResult {
  status: 'following' | 'requested' | 'unfollowed' | 'request_cancelled' | 'not_following';
}

export interface UserBasic {
  id: string;
  firstName: string;
  lastName: string;
}

export interface FollowRequest {
  id: string;
  fromUser: UserBasic;
  createdAt: string;
}

export interface PaginatedUsersResponse {
  data: UserBasic[];
  nextCursor: string | null;
}

export const updateMyProfile = async (payload: UpdateProfilePayload) => {
  const response = await api.patch('/users/me', payload);
  return response.data as UserProfileBasics;
};

export const followUser = async (userId: string): Promise<FollowResult> => {
  const response = await api.post(`/social-graph/follow/${userId}`);
  return response.data as FollowResult;
};

export const unfollowUser = async (userId: string): Promise<FollowResult> => {
  const response = await api.delete(`/social-graph/follow/${userId}`);
  return response.data as FollowResult;
};

export const getFollowers = async (userId: string, cursor?: string): Promise<PaginatedUsersResponse> => {
  const response = await api.get(`/social-graph/followers/${userId}`, {
    params: cursor ? { cursor } : {},
  });
  return response.data as PaginatedUsersResponse;
};

export const getFollowing = async (userId: string, cursor?: string): Promise<PaginatedUsersResponse> => {
  const response = await api.get(`/social-graph/following/${userId}`, {
    params: cursor ? { cursor } : {},
  });
  return response.data as PaginatedUsersResponse;
};

export const getFollowRequests = async (): Promise<FollowRequest[]> => {
  const response = await api.get('/social-graph/follow-requests');
  return response.data as FollowRequest[];
};

export const acceptFollowRequest = async (requestId: string): Promise<{ status: string }> => {
  const response = await api.post(`/social-graph/follow-requests/${requestId}/accept`);
  return response.data as { status: string };
};

export const rejectFollowRequest = async (requestId: string): Promise<{ status: string }> => {
  const response = await api.post(`/social-graph/follow-requests/${requestId}/reject`);
  return response.data as { status: string };
};

export const logoutUser = async () => {
  await api.post('/auth/logout');
};

export default api;
