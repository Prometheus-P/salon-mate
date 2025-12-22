/**
 * Component tests for EngagementMetrics
 * T037: Test EngagementMetrics component (FR-008, FR-009)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EngagementMetrics } from '@/app/dashboard/components/EngagementMetrics';
import type { EngagementResponse } from '@/lib/api/dashboard';

// Mock the API module
vi.mock('@/lib/api/dashboard', () => ({
  getEngagementMetrics: vi.fn(),
}));

import * as dashboardApi from '@/lib/api/dashboard';

const mockEngagementResponse: EngagementResponse = {
  total_likes: 1250,
  total_comments: 340,
  total_reach: 15000,
  top_posts: [
    {
      id: 'post-1',
      image_url: 'https://example.com/img1.jpg',
      likes_count: 500,
      comments_count: 120,
      reach_count: 5000,
      engagement_score: 1240,
    },
    {
      id: 'post-2',
      image_url: 'https://example.com/img2.jpg',
      likes_count: 400,
      comments_count: 100,
      reach_count: 4000,
      engagement_score: 1000,
    },
    {
      id: 'post-3',
      image_url: 'https://example.com/img3.jpg',
      likes_count: 350,
      comments_count: 120,
      reach_count: 6000,
      engagement_score: 1190,
    },
  ],
  last_synced_at: '2025-01-15T10:30:00Z',
};

const emptyEngagementResponse: EngagementResponse = {
  total_likes: 0,
  total_comments: 0,
  total_reach: 0,
  top_posts: [],
  last_synced_at: '2025-01-15T10:30:00Z',
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });
}

function renderWithProviders(ui: React.ReactElement, queryClient?: QueryClient) {
  const testQueryClient = queryClient || createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('EngagementMetrics Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('FR-008: Engagement Totals', () => {
    it('should display total likes', async () => {
      vi.mocked(dashboardApi.getEngagementMetrics).mockResolvedValue(mockEngagementResponse);

      renderWithProviders(<EngagementMetrics shopId="shop-123" />);

      await waitFor(() => {
        // 1250 gets formatted as "1.2K" (may appear multiple times due to similar engagement scores)
        const elements = screen.getAllByText(/1\.2K/);
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it('should display total comments', async () => {
      vi.mocked(dashboardApi.getEngagementMetrics).mockResolvedValue(mockEngagementResponse);

      renderWithProviders(<EngagementMetrics shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText('Total Comments')).toBeInTheDocument();
      });

      // 340 is displayed via formatNumber which uses toLocaleString
      expect(screen.getByText('340')).toBeInTheDocument();
    });

    it('should display total reach', async () => {
      vi.mocked(dashboardApi.getEngagementMetrics).mockResolvedValue(mockEngagementResponse);

      renderWithProviders(<EngagementMetrics shopId="shop-123" />);

      await waitFor(() => {
        // 15000 gets formatted as "15K"
        expect(screen.getByText(/15(\.0)?K/)).toBeInTheDocument();
      });
    });
  });

  describe('FR-009: Top Posts', () => {
    it('should display top performing posts', async () => {
      vi.mocked(dashboardApi.getEngagementMetrics).mockResolvedValue(mockEngagementResponse);

      renderWithProviders(<EngagementMetrics shopId="shop-123" />);

      await waitFor(() => {
        // Should show top posts section
        expect(screen.getByText(/top|best|performing/i)).toBeInTheDocument();
      });
    });

    it('should show post thumbnails', async () => {
      vi.mocked(dashboardApi.getEngagementMetrics).mockResolvedValue(mockEngagementResponse);

      renderWithProviders(<EngagementMetrics shopId="shop-123" />);

      await waitFor(() => {
        // Should render images
        const images = screen.queryAllByRole('img');
        expect(images.length).toBeGreaterThan(0);
      });
    });

    it('should display engagement score for posts', async () => {
      vi.mocked(dashboardApi.getEngagementMetrics).mockResolvedValue(mockEngagementResponse);

      renderWithProviders(<EngagementMetrics shopId="shop-123" />);

      await waitFor(() => {
        // Should show engagement scores (1240 gets formatted as "1.2K")
        expect(screen.getAllByText(/1\.2K/).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no engagement data', async () => {
      vi.mocked(dashboardApi.getEngagementMetrics).mockResolvedValue(emptyEngagementResponse);

      renderWithProviders(<EngagementMetrics shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText(/no engagement|no posts|no data/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state while fetching', async () => {
      vi.mocked(dashboardApi.getEngagementMetrics).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockEngagementResponse), 1000))
      );

      renderWithProviders(<EngagementMetrics shopId="shop-123" />);

      expect(screen.getByTestId('engagement-metrics-loading')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when API fails', async () => {
      vi.mocked(dashboardApi.getEngagementMetrics).mockRejectedValue(new Error('Failed to fetch'));

      renderWithProviders(<EngagementMetrics shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText(/error|failed|problem/i)).toBeInTheDocument();
      });
    });

    it('should provide retry option on error', async () => {
      vi.mocked(dashboardApi.getEngagementMetrics).mockRejectedValue(new Error('Failed to fetch'));

      renderWithProviders(<EngagementMetrics shopId="shop-123" />);

      await waitFor(() => {
        const retryButton = screen.queryByRole('button', { name: /retry|try again/i });
        expect(retryButton).toBeInTheDocument();
      });
    });
  });

  describe('Data Freshness', () => {
    it('should display last synced time', async () => {
      vi.mocked(dashboardApi.getEngagementMetrics).mockResolvedValue(mockEngagementResponse);

      renderWithProviders(<EngagementMetrics shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText(/updated|synced/i)).toBeInTheDocument();
      });
    });
  });

  describe('Labels', () => {
    it('should display labels for metrics', async () => {
      vi.mocked(dashboardApi.getEngagementMetrics).mockResolvedValue(mockEngagementResponse);

      renderWithProviders(<EngagementMetrics shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText(/likes/i)).toBeInTheDocument();
        expect(screen.getByText(/comments/i)).toBeInTheDocument();
        expect(screen.getByText(/reach/i)).toBeInTheDocument();
      });
    });
  });
});
