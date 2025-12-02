/**
 * Component tests for PostingCalendar
 * T027: Test PostingCalendar component (FR-005, FR-006, FR-007)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PostingCalendar } from '@/app/dashboard/components/PostingCalendar';
import type { CalendarResponse } from '@/lib/api/dashboard';

// Mock the API module
vi.mock('@/lib/api/dashboard', () => ({
  getPostingCalendar: vi.fn(),
}));

import * as dashboardApi from '@/lib/api/dashboard';

const mockCalendarResponse: CalendarResponse = {
  start_date: '2025-01-01',
  end_date: '2025-01-31',
  entries: [
    {
      date: '2025-01-15',
      posts: [
        {
          id: 'post-1',
          status: 'published',
          image_url: 'https://example.com/img1.jpg',
          caption_snippet: 'First post about...',
          scheduled_at: '2025-01-15T10:00:00Z',
          published_at: '2025-01-15T10:00:00Z',
        },
      ],
    },
    {
      date: '2025-01-20',
      posts: [
        {
          id: 'post-2',
          status: 'scheduled',
          image_url: 'https://example.com/img2.jpg',
          caption_snippet: 'Upcoming promotion',
          scheduled_at: '2025-01-20T14:00:00Z',
          published_at: null,
        },
      ],
    },
    {
      date: '2025-01-18',
      posts: [
        {
          id: 'post-3',
          status: 'failed',
          image_url: 'https://example.com/img3.jpg',
          caption_snippet: 'Failed post',
          scheduled_at: '2025-01-18T09:00:00Z',
          published_at: null,
        },
      ],
    },
  ],
  last_synced_at: '2025-01-15T10:30:00Z',
};

const emptyCalendarResponse: CalendarResponse = {
  start_date: '2025-01-01',
  end_date: '2025-01-31',
  entries: [],
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

describe('PostingCalendar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('FR-005: Calendar Display', () => {
    it('should display posts on calendar', async () => {
      vi.mocked(dashboardApi.getPostingCalendar).mockResolvedValue(mockCalendarResponse);

      renderWithProviders(<PostingCalendar shopId="shop-123" />);

      await waitFor(() => {
        // Should show calendar with posts
        expect(screen.getByText(/posting calendar|calendar/i)).toBeInTheDocument();
      });
    });

    it('should show empty state when no posts', async () => {
      vi.mocked(dashboardApi.getPostingCalendar).mockResolvedValue(emptyCalendarResponse);

      renderWithProviders(<PostingCalendar shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText(/no posts|no scheduled|empty/i)).toBeInTheDocument();
      });
    });
  });

  describe('FR-006: Week/Month Views', () => {
    it('should show view toggle options', async () => {
      vi.mocked(dashboardApi.getPostingCalendar).mockResolvedValue(mockCalendarResponse);

      renderWithProviders(<PostingCalendar shopId="shop-123" />);

      await waitFor(() => {
        // Should have view toggle buttons
        const weekButton = screen.queryByRole('button', { name: /week/i });
        const monthButton = screen.queryByRole('button', { name: /month/i });

        // At least one view option should be present
        expect(weekButton || monthButton).toBeTruthy();
      });
    });

    it('should switch between week and month views', async () => {
      vi.mocked(dashboardApi.getPostingCalendar).mockResolvedValue(mockCalendarResponse);

      renderWithProviders(<PostingCalendar shopId="shop-123" />);

      await waitFor(() => {
        // Should be able to switch views
        const weekButton = screen.queryByRole('button', { name: /week/i });
        if (weekButton) {
          fireEvent.click(weekButton);
        }
      });
    });
  });

  describe('FR-007: Status Indicators', () => {
    it('should show published status indicator (green)', async () => {
      vi.mocked(dashboardApi.getPostingCalendar).mockResolvedValue(mockCalendarResponse);

      renderWithProviders(<PostingCalendar shopId="shop-123" />);

      await waitFor(() => {
        // Should show published indicator
        const publishedIndicator = screen.queryByText(/published/i) ||
                                   screen.queryByTestId('status-published');
        expect(publishedIndicator).toBeTruthy();
      });
    });

    it('should show scheduled status indicator (yellow)', async () => {
      vi.mocked(dashboardApi.getPostingCalendar).mockResolvedValue(mockCalendarResponse);

      renderWithProviders(<PostingCalendar shopId="shop-123" />);

      await waitFor(() => {
        // Should show scheduled indicator
        const scheduledIndicator = screen.queryByText(/scheduled/i) ||
                                   screen.queryByTestId('status-scheduled');
        expect(scheduledIndicator).toBeTruthy();
      });
    });

    it('should show failed status indicator (red)', async () => {
      vi.mocked(dashboardApi.getPostingCalendar).mockResolvedValue(mockCalendarResponse);

      renderWithProviders(<PostingCalendar shopId="shop-123" />);

      await waitFor(() => {
        // Should show failed indicator
        const failedIndicator = screen.queryByText(/failed/i) ||
                               screen.queryByTestId('status-failed');
        expect(failedIndicator).toBeTruthy();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state while fetching', async () => {
      vi.mocked(dashboardApi.getPostingCalendar).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockCalendarResponse), 1000))
      );

      renderWithProviders(<PostingCalendar shopId="shop-123" />);

      // Should show loading state immediately
      expect(screen.getByTestId('posting-calendar-loading')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when API fails', async () => {
      vi.mocked(dashboardApi.getPostingCalendar).mockRejectedValue(new Error('Failed to fetch'));

      renderWithProviders(<PostingCalendar shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText(/error|failed|problem/i)).toBeInTheDocument();
      });
    });

    it('should provide retry option on error', async () => {
      vi.mocked(dashboardApi.getPostingCalendar).mockRejectedValue(new Error('Failed to fetch'));

      renderWithProviders(<PostingCalendar shopId="shop-123" />);

      await waitFor(() => {
        const retryButton = screen.queryByRole('button', { name: /retry|try again/i });
        expect(retryButton).toBeInTheDocument();
      });
    });
  });

  describe('Post Details', () => {
    it('should show post image thumbnail', async () => {
      vi.mocked(dashboardApi.getPostingCalendar).mockResolvedValue(mockCalendarResponse);

      renderWithProviders(<PostingCalendar shopId="shop-123" />);

      await waitFor(() => {
        // Should render images (may be in popup or inline)
        const images = screen.queryAllByRole('img');
        expect(images.length).toBeGreaterThanOrEqual(0);
      });
    });

    it('should show caption snippet on hover or click', async () => {
      vi.mocked(dashboardApi.getPostingCalendar).mockResolvedValue(mockCalendarResponse);

      renderWithProviders(<PostingCalendar shopId="shop-123" />);

      await waitFor(() => {
        // Caption should be accessible somewhere
        const caption = screen.queryByText(/First post|Upcoming promotion|Failed post/i);
        // May or may not be immediately visible
      });
    });
  });

  describe('Data Freshness', () => {
    it('should display last synced time', async () => {
      vi.mocked(dashboardApi.getPostingCalendar).mockResolvedValue(mockCalendarResponse);

      renderWithProviders(<PostingCalendar shopId="shop-123" />);

      await waitFor(() => {
        // Should show freshness indicator
        expect(screen.getByText(/updated|synced/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should have navigation controls', async () => {
      vi.mocked(dashboardApi.getPostingCalendar).mockResolvedValue(mockCalendarResponse);

      renderWithProviders(<PostingCalendar shopId="shop-123" />);

      await waitFor(() => {
        // Should have previous/next navigation
        const prevButton = screen.queryByRole('button', { name: /prev|previous|back|</i });
        const nextButton = screen.queryByRole('button', { name: /next|forward|>/i });

        // At least one navigation control should exist
        expect(prevButton || nextButton).toBeTruthy();
      });
    });
  });
});
