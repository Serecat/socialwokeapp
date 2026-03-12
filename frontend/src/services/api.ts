import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
  email: string;
  firstName: string;
  lastName: string;
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

export default api;
