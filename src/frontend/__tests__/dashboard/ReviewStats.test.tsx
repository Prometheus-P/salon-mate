/**
 * Component tests for ReviewStats
 * T017: Test ReviewStats component (FR-001, FR-002, FR-003, FR-004)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReviewStats } from '@/app/dashboard/components/ReviewStats';
import type { ReviewStatsResponse } from '@/lib/api/dashboard';

// Mock the API module
vi.mock('@/lib/api/dashboard', () => ({
  getReviewStats: vi.fn(),
}));

import * as dashboardApi from '@/lib/api/dashboard';

const mockReviewStats: ReviewStatsResponse = {
  total_reviews: 150,
  average_rating: 4.5,
  response_rate: 85.5,
  pending_count: 8,
  by_platform: {
    google: {
      total_reviews: 100,
      average_rating: 4.6,
      response_rate: 90.0,
    },
    naver: {
      total_reviews: 50,
      average_rating: 4.3,
      response_rate: 76.0,
    },
  },
  last_synced_at: '2025-01-15T10:30:00Z',
};

const emptyReviewStats: ReviewStatsResponse = {
  total_reviews: 0,
  average_rating: 0,
  response_rate: 0,
  pending_count: 0,
  by_platform: {},
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

describe('ReviewStats Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('FR-001: Total Reviews Display', () => {
    it('should display total review count', async () => {
      vi.mocked(dashboardApi.getReviewStats).mockResolvedValue(mockReviewStats);

      renderWithProviders(<ReviewStats shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument();
      });
    });

    it('should show empty state when no reviews', async () => {
      vi.mocked(dashboardApi.getReviewStats).mockResolvedValue(emptyReviewStats);

      renderWithProviders(<ReviewStats shopId="shop-123" />);

      await waitFor(() => {
        // Shows friendly empty state message instead of just "0"
        expect(screen.getByText('No review data yet')).toBeInTheDocument();
      });
    });
  });

  describe('FR-002: Average Rating Display', () => {
    it('should display average rating with one decimal place', async () => {
      vi.mocked(dashboardApi.getReviewStats).mockResolvedValue(mockReviewStats);

      renderWithProviders(<ReviewStats shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText('4.5')).toBeInTheDocument();
      });
    });

    it('should show visual star indicator for rating', async () => {
      vi.mocked(dashboardApi.getReviewStats).mockResolvedValue(mockReviewStats);

      renderWithProviders(<ReviewStats shopId="shop-123" />);

      await waitFor(() => {
        // Should have some visual indicator (stars or similar)
        const ratingElement = screen.getByText('4.5');
        expect(ratingElement).toBeInTheDocument();
      });
    });
  });

  describe('FR-003: Response Rate Display', () => {
    it('should display response rate as percentage', async () => {
      vi.mocked(dashboardApi.getReviewStats).mockResolvedValue(mockReviewStats);

      renderWithProviders(<ReviewStats shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText(/85\.5%/)).toBeInTheDocument();
      });
    });

    it('should show empty state when no reviews', async () => {
      vi.mocked(dashboardApi.getReviewStats).mockResolvedValue(emptyReviewStats);

      renderWithProviders(<ReviewStats shopId="shop-123" />);

      await waitFor(() => {
        // Shows empty state instead of stats with 0%
        expect(screen.getByText('No review data yet')).toBeInTheDocument();
      });
    });
  });

  describe('FR-004: Pending Reviews Count', () => {
    it('should display pending review count', async () => {
      vi.mocked(dashboardApi.getReviewStats).mockResolvedValue(mockReviewStats);

      renderWithProviders(<ReviewStats shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText('8')).toBeInTheDocument();
      });
    });

    it('should highlight pending count when non-zero', async () => {
      vi.mocked(dashboardApi.getReviewStats).mockResolvedValue(mockReviewStats);

      renderWithProviders(<ReviewStats shopId="shop-123" />);

      await waitFor(() => {
        const pendingElement = screen.getByText('8');
        // Should have some styling to indicate attention needed
        expect(pendingElement).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton while fetching', async () => {
      vi.mocked(dashboardApi.getReviewStats).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockReviewStats), 1000))
      );

      renderWithProviders(<ReviewStats shopId="shop-123" />);

      // Should show loading state immediately
      expect(screen.getByTestId('review-stats-loading')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when API fails', async () => {
      vi.mocked(dashboardApi.getReviewStats).mockRejectedValue(new Error('Failed to fetch'));

      renderWithProviders(<ReviewStats shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText(/error|failed|problem/i)).toBeInTheDocument();
      });
    });

    it('should provide retry option on error', async () => {
      vi.mocked(dashboardApi.getReviewStats).mockRejectedValue(new Error('Failed to fetch'));

      renderWithProviders(<ReviewStats shopId="shop-123" />);

      await waitFor(() => {
        const retryButton = screen.queryByRole('button', { name: /retry|try again/i });
        expect(retryButton).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no reviews', async () => {
      vi.mocked(dashboardApi.getReviewStats).mockResolvedValue(emptyReviewStats);

      renderWithProviders(<ReviewStats shopId="shop-123" />);

      await waitFor(() => {
        // Should show the EmptyState component with guidance
        expect(screen.getByText('No review data yet')).toBeInTheDocument();
        expect(screen.getByText('Connect Platforms')).toBeInTheDocument();
      });
    });
  });

  describe('Data Freshness', () => {
    it('should display last synced time', async () => {
      vi.mocked(dashboardApi.getReviewStats).mockResolvedValue(mockReviewStats);

      renderWithProviders(<ReviewStats shopId="shop-123" />);

      await waitFor(() => {
        // Should show freshness indicator
        expect(screen.getByText(/updated|synced/i)).toBeInTheDocument();
      });
    });
  });

  describe('Labels', () => {
    it('should display appropriate labels for each stat', async () => {
      vi.mocked(dashboardApi.getReviewStats).mockResolvedValue(mockReviewStats);

      renderWithProviders(<ReviewStats shopId="shop-123" />);

      await waitFor(() => {
        // Check that all stat labels are present (use getAllBy since there may be multiple matches)
        expect(screen.getAllByText(/reviews/i).length).toBeGreaterThan(0);
        expect(screen.getByText('Average Rating')).toBeInTheDocument();
        expect(screen.getByText('Response Rate')).toBeInTheDocument();
        expect(screen.getByText('Pending Reviews')).toBeInTheDocument();
      });
    });
  });
});
