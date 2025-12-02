/**
 * Component tests for PendingReviews
 * T061: Test PendingReviews component (FR-012, FR-013, FR-014)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PendingReviews } from '@/app/dashboard/components/PendingReviews';
import type {
  PendingReviewsResponse,
  GeneratedResponseResult,
  PublishResponseResult,
} from '@/lib/api/dashboard';

// Mock the API module
vi.mock('@/lib/api/dashboard', () => ({
  getPendingReviews: vi.fn(),
  generateAIResponse: vi.fn(),
  publishResponse: vi.fn(),
}));

import * as dashboardApi from '@/lib/api/dashboard';

const mockPendingReviewsResponse: PendingReviewsResponse = {
  reviews: [
    {
      id: 'review-1',
      reviewer_name: '김철수',
      reviewer_profile_url: 'https://example.com/profile1.jpg',
      rating: 4,
      content: '좋은 서비스였습니다. 다음에 또 방문할게요.',
      review_date: '2025-01-15T10:30:00Z',
      platform: 'google',
      ai_response: null,
    },
    {
      id: 'review-2',
      reviewer_name: '이영희',
      reviewer_profile_url: null,
      rating: 3,
      content: '보통이었어요. 조금 기다렸습니다.',
      review_date: '2025-01-14T15:00:00Z',
      platform: 'naver',
      ai_response: null,
    },
    {
      id: 'review-3',
      reviewer_name: '박민수',
      reviewer_profile_url: 'https://example.com/profile3.jpg',
      rating: 5,
      content: '최고의 서비스! 강력 추천합니다.',
      review_date: '2025-01-13T09:00:00Z',
      platform: 'google',
      ai_response: '감사합니다! 좋은 리뷰 남겨주셔서 감사해요.',
    },
  ],
  total_pending: 3,
};

const emptyPendingReviewsResponse: PendingReviewsResponse = {
  reviews: [],
  total_pending: 0,
};

const mockGeneratedResponse: GeneratedResponseResult = {
  review_id: 'review-1',
  ai_response: '안녕하세요, 김철수님! 소중한 리뷰 감사합니다.',
  generated_at: '2025-01-16T12:00:00Z',
};

const mockPublishResult: PublishResponseResult = {
  review_id: 'review-1',
  status: 'replied',
  replied_at: '2025-01-16T12:05:00Z',
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

describe('PendingReviews Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('FR-012: Display Pending Reviews', () => {
    it('should display pending reviews list', async () => {
      vi.mocked(dashboardApi.getPendingReviews).mockResolvedValue(mockPendingReviewsResponse);

      renderWithProviders(<PendingReviews shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText(/pending|대기/i)).toBeInTheDocument();
      });
    });

    it('should show reviewer name for each review', async () => {
      vi.mocked(dashboardApi.getPendingReviews).mockResolvedValue(mockPendingReviewsResponse);

      renderWithProviders(<PendingReviews shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText('김철수')).toBeInTheDocument();
        expect(screen.getByText('이영희')).toBeInTheDocument();
      });
    });

    it('should show review rating', async () => {
      vi.mocked(dashboardApi.getPendingReviews).mockResolvedValue(mockPendingReviewsResponse);

      renderWithProviders(<PendingReviews shopId="shop-123" />);

      await waitFor(() => {
        // Should display ratings in some form (stars or numbers)
        const ratingElements = screen.getAllByText(/[1-5]/);
        expect(ratingElements.length).toBeGreaterThan(0);
      });
    });

    it('should show review content', async () => {
      vi.mocked(dashboardApi.getPendingReviews).mockResolvedValue(mockPendingReviewsResponse);

      renderWithProviders(<PendingReviews shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText(/좋은 서비스/)).toBeInTheDocument();
      });
    });

    it('should show total pending count', async () => {
      vi.mocked(dashboardApi.getPendingReviews).mockResolvedValue(mockPendingReviewsResponse);

      renderWithProviders(<PendingReviews shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText(/3/)).toBeInTheDocument();
      });
    });

    it('should show platform indicator', async () => {
      vi.mocked(dashboardApi.getPendingReviews).mockResolvedValue(mockPendingReviewsResponse);

      renderWithProviders(<PendingReviews shopId="shop-123" />);

      await waitFor(() => {
        // Should show platform badges (google/naver)
        expect(screen.getByText(/google/i) || screen.getByText(/구글/i)).toBeTruthy();
      });
    });
  });

  describe('FR-013: Generate AI Response', () => {
    it('should show generate response button for each review', async () => {
      vi.mocked(dashboardApi.getPendingReviews).mockResolvedValue(mockPendingReviewsResponse);

      renderWithProviders(<PendingReviews shopId="shop-123" />);

      await waitFor(() => {
        const generateButtons = screen.getAllByRole('button', { name: /generate|생성|ai/i });
        expect(generateButtons.length).toBeGreaterThan(0);
      });
    });

    it('should call generateAIResponse when generate button clicked', async () => {
      vi.mocked(dashboardApi.getPendingReviews).mockResolvedValue(mockPendingReviewsResponse);
      vi.mocked(dashboardApi.generateAIResponse).mockResolvedValue(mockGeneratedResponse);

      renderWithProviders(<PendingReviews shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText('김철수')).toBeInTheDocument();
      });

      const generateButtons = screen.getAllByRole('button', { name: /generate|생성|ai/i });
      fireEvent.click(generateButtons[0]);

      await waitFor(() => {
        expect(dashboardApi.generateAIResponse).toHaveBeenCalledWith('shop-123', 'review-1');
      });
    });

    it('should display generated response in textarea', async () => {
      vi.mocked(dashboardApi.getPendingReviews).mockResolvedValue(mockPendingReviewsResponse);
      vi.mocked(dashboardApi.generateAIResponse).mockResolvedValue(mockGeneratedResponse);

      renderWithProviders(<PendingReviews shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText('김철수')).toBeInTheDocument();
      });

      const generateButtons = screen.getAllByRole('button', { name: /generate|생성|ai/i });
      fireEvent.click(generateButtons[0]);

      await waitFor(() => {
        expect(screen.getByDisplayValue(/김철수님|소중한 리뷰/)).toBeInTheDocument();
      });
    });

    it('should show loading state while generating', async () => {
      vi.mocked(dashboardApi.getPendingReviews).mockResolvedValue(mockPendingReviewsResponse);
      vi.mocked(dashboardApi.generateAIResponse).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockGeneratedResponse), 1000))
      );

      renderWithProviders(<PendingReviews shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText('김철수')).toBeInTheDocument();
      });

      const generateButtons = screen.getAllByRole('button', { name: /generate|생성|ai/i });
      fireEvent.click(generateButtons[0]);

      // Should show loading indicator
      expect(screen.getByText(/loading|생성 중|처리/i) || screen.getByRole('progressbar')).toBeTruthy();
    });
  });

  describe('FR-014: Publish Response', () => {
    it('should show publish button when response is available', async () => {
      const responseWithAI = {
        ...mockPendingReviewsResponse,
        reviews: mockPendingReviewsResponse.reviews.map((r, i) =>
          i === 0 ? { ...r, ai_response: '감사합니다!' } : r
        ),
      };
      vi.mocked(dashboardApi.getPendingReviews).mockResolvedValue(responseWithAI);

      renderWithProviders(<PendingReviews shopId="shop-123" />);

      await waitFor(() => {
        const publishButtons = screen.getAllByRole('button', { name: /publish|게시|발행/i });
        expect(publishButtons.length).toBeGreaterThan(0);
      });
    });

    it('should allow editing response before publishing', async () => {
      vi.mocked(dashboardApi.getPendingReviews).mockResolvedValue(mockPendingReviewsResponse);
      vi.mocked(dashboardApi.generateAIResponse).mockResolvedValue(mockGeneratedResponse);

      renderWithProviders(<PendingReviews shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText('김철수')).toBeInTheDocument();
      });

      const generateButtons = screen.getAllByRole('button', { name: /generate|생성|ai/i });
      fireEvent.click(generateButtons[0]);

      await waitFor(() => {
        const textarea = screen.getByRole('textbox');
        expect(textarea).toBeInTheDocument();
        // Should be editable
        fireEvent.change(textarea, { target: { value: '수정된 응답입니다.' } });
        expect(textarea).toHaveValue('수정된 응답입니다.');
      });
    });

    it('should call publishResponse when publish button clicked', async () => {
      vi.mocked(dashboardApi.getPendingReviews).mockResolvedValue(mockPendingReviewsResponse);
      vi.mocked(dashboardApi.generateAIResponse).mockResolvedValue(mockGeneratedResponse);
      vi.mocked(dashboardApi.publishResponse).mockResolvedValue(mockPublishResult);

      renderWithProviders(<PendingReviews shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText('김철수')).toBeInTheDocument();
      });

      // Generate response first
      const generateButtons = screen.getAllByRole('button', { name: /generate|생성|ai/i });
      fireEvent.click(generateButtons[0]);

      await waitFor(() => {
        expect(screen.getByDisplayValue(/김철수님|소중한 리뷰/)).toBeInTheDocument();
      });

      // Click publish
      const publishButtons = screen.getAllByRole('button', { name: /publish|게시|발행/i });
      fireEvent.click(publishButtons[0]);

      await waitFor(() => {
        expect(dashboardApi.publishResponse).toHaveBeenCalledWith(
          'shop-123',
          'review-1',
          expect.any(String)
        );
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no pending reviews', async () => {
      vi.mocked(dashboardApi.getPendingReviews).mockResolvedValue(emptyPendingReviewsResponse);

      renderWithProviders(<PendingReviews shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText(/no pending|없습니다|리뷰가 없/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state while fetching', async () => {
      vi.mocked(dashboardApi.getPendingReviews).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockPendingReviewsResponse), 1000))
      );

      renderWithProviders(<PendingReviews shopId="shop-123" />);

      expect(screen.getByTestId('pending-reviews-loading')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when API fails', async () => {
      vi.mocked(dashboardApi.getPendingReviews).mockRejectedValue(new Error('Failed to fetch'));

      renderWithProviders(<PendingReviews shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText(/error|failed|problem|오류/i)).toBeInTheDocument();
      });
    });

    it('should provide retry option on error', async () => {
      vi.mocked(dashboardApi.getPendingReviews).mockRejectedValue(new Error('Failed to fetch'));

      renderWithProviders(<PendingReviews shopId="shop-123" />);

      await waitFor(() => {
        const retryButton = screen.queryByRole('button', { name: /retry|try again|다시/i });
        expect(retryButton).toBeInTheDocument();
      });
    });
  });

  describe('Expandable Cards', () => {
    it('should expand review card to show full content', async () => {
      vi.mocked(dashboardApi.getPendingReviews).mockResolvedValue(mockPendingReviewsResponse);

      renderWithProviders(<PendingReviews shopId="shop-123" />);

      await waitFor(() => {
        expect(screen.getByText('김철수')).toBeInTheDocument();
      });

      // Click on a review to expand it
      const reviewCard = screen.getByText('김철수').closest('div');
      if (reviewCard) {
        fireEvent.click(reviewCard);
      }

      // Should show expanded view with action buttons
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /generate|생성|ai/i })).toBeInTheDocument();
      });
    });
  });
});
