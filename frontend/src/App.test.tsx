import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import App from './App';

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof axios>();
  return {
    ...actual,
    default: {
      ...actual,
      post: vi.fn().mockRejectedValue(new Error('No refresh token')),
      create: actual.create,
    },
  };
});

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login screen after failed silent refresh', async () => {
    render(<App />);
    const headingElement = await waitFor(() =>
      screen.getByRole('heading', { name: /login/i }),
    );
    expect(headingElement).toBeInTheDocument();
  });
});
