/**
 * Component tests for TrendCharts
 * T047: Test TrendCharts component (FR-010, FR-011)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TrendCharts } from '@/app/dashboard/components/TrendCharts';
import type { TrendResponse } from '@/lib/api/dashboard';

// Mock the API module
vi.mock('@/lib/api/dashboard', () => ({
  getTrendData: vi.fn(),
}));

// Mock recharts to avoid canvas issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

import * as dashboardApi from '@/lib/api/dashboard';

const mockWeekTrendResponse: TrendResponse = {
  period: 'week',
  data_points: [
    { date: '2025-01-10', review_count: 3, average_rating: 4.5, response_rate: 66.7 },
    { date: '2025-01-11', review_count: 5, average_rating: 4.2, response_rate: 80.0 },
    { date: '2025-01-12', review_count: 2, average_rating: 5.0, response_rate: 100.0 },
    { date: '2025-01-13', review_count: 4, average_rating: 4.0, response_rate: 75.0 },
    { date: '2025-01-14', review_count: 6, average_rating: 4.8, response_rate: 83.3 },
    { date: '2025-01-15', review_count: 3, average_rating: 4.3, response_rate: 66.7 },
    { date: '2025-01-16', review_count: 7, average_rating: 4.6, response_rate: 85.7 },
  ],
};

const mockMonthTrendResponse: TrendResponse = {
  period: 'month',
  data_points: [
    { date: '2025-01-01', review_count: 10, average_rating: 4.2, response_rate: 70.0 },
    { date: '2025-01-08', review_count: 15, average_rating: 4.5, response_rate: 80.0 },
    { date: '2025-01-15', review_count: 12, average_rating: 4.3, response_rate: 75.0 },
  ],
};

const emptyTrendResponse: TrendResponse = {
  period: 'week',
  data_points: [],
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

describe('TrendCharts Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('FR-010: Trend Charts Display', () => {
    it('should display trend charts', async () => {
      vi.mocked(dashboardApi.getTrendData).mockResolvedValue(mockWeekTrendResponse);

      renderWithProviders(<TrendCharts shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText(/trend|chart/i)).toBeInTheDocument();
      });
    });

    it('should render chart with data points', async () => {
      vi.mocked(dashboardApi.getTrendData).mockResolvedValue(mockWeekTrendResponse);

      renderWithProviders(<TrendCharts shopId="shop-123" />);

      await waitFor(() => {
        // Check that chart components are rendered
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });
  });

  describe('FR-011: Period Selection', () => {
    it('should show period selector options', async () => {
      vi.mocked(dashboardApi.getTrendData).mockResolvedValue(mockWeekTrendResponse);

      renderWithProviders(<TrendCharts shopId="shop-123" />);

      await waitFor(() => {
        // Should have period toggle buttons
        expect(screen.getByText(/week|7일/i)).toBeInTheDocument();
        expect(screen.getByText(/month|30일/i)).toBeInTheDocument();
        expect(screen.getByText(/year|365일/i)).toBeInTheDocument();
      });
    });

    it('should switch between periods on click', async () => {
      vi.mocked(dashboardApi.getTrendData)
        .mockResolvedValueOnce(mockWeekTrendResponse)
        .mockResolvedValueOnce(mockMonthTrendResponse);

      renderWithProviders(<TrendCharts shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText(/week|7일/i)).toBeInTheDocument();
      });

      // Click month button
      const monthButton = screen.getByRole('button', { name: /month|30일/i });
      fireEvent.click(monthButton);

      // Should fetch new data
      expect(dashboardApi.getTrendData).toHaveBeenCalledTimes(2);
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no data', async () => {
      vi.mocked(dashboardApi.getTrendData).mockResolvedValue(emptyTrendResponse);

      renderWithProviders(<TrendCharts shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText(/no data|no trend|데이터 없음/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state while fetching', async () => {
      vi.mocked(dashboardApi.getTrendData).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockWeekTrendResponse), 1000))
      );

      renderWithProviders(<TrendCharts shopId="shop-123" />);

      expect(screen.getByTestId('trend-charts-loading')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when API fails', async () => {
      vi.mocked(dashboardApi.getTrendData).mockRejectedValue(new Error('Failed to fetch'));

      renderWithProviders(<TrendCharts shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText(/error|failed|problem/i)).toBeInTheDocument();
      });
    });

    it('should provide retry option on error', async () => {
      vi.mocked(dashboardApi.getTrendData).mockRejectedValue(new Error('Failed to fetch'));

      renderWithProviders(<TrendCharts shopId="shop-123" />);

      await waitFor(() => {
        const retryButton = screen.queryByRole('button', { name: /retry|try again/i });
        expect(retryButton).toBeInTheDocument();
      });
    });
  });

  describe('Chart Elements', () => {
    it('should display chart legend', async () => {
      vi.mocked(dashboardApi.getTrendData).mockResolvedValue(mockWeekTrendResponse);

      renderWithProviders(<TrendCharts shopId="shop-123" />);

      await waitFor(() => {
        // Should have legend or metric labels
        expect(
          screen.getByText(/rating|review|response/i) ||
          screen.getByTestId('legend')
        ).toBeTruthy();
      });
    });
  });
});
