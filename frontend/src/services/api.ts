import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
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

export interface FeedPost {
  id: string;
  content: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
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

export const getMyPosts = async (cursor?: string) => {
  const response = await api.get('/posts/me/posts', {
    params: {
      ...(cursor ? { cursor } : {}),
    },
  });

  return response.data as PaginatedPostsResponse;
};


export default api;
