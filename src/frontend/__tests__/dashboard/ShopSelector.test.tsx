import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShopSelector } from '@/app/dashboard/components/ShopSelector';
import type { ShopsListResponse } from '@/lib/api/dashboard';

const mockReplace = vi.fn();
const searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  useSearchParams: () => searchParams,
}));

const mockUseUserShops = vi.fn();
vi.mock('@/app/dashboard/hooks/useDashboard', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/app/dashboard/hooks/useDashboard')>();
  return {
    ...actual,
    useUserShops: () => mockUseUserShops(),
  };
});

const baseResponse: ShopsListResponse = {
  shops: [
    {
      id: 'shop-1',
      name: 'Gangnam Beauty Lab',
      type: '헤어',
      has_reviews: true,
      has_posts: true,
    },
    {
      id: 'shop-2',
      name: 'Busan Nail Atelier',
      type: '네일',
      has_reviews: false,
      has_posts: true,
    },
  ],
};

beforeAll(() => {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.ResizeObserver = ResizeObserver;
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
});

beforeEach(() => {
  mockReplace.mockReset();
  mockUseUserShops.mockReturnValue({
    data: baseResponse,
    isLoading: false,
    error: null,
  });
  searchParams.delete('shopId');
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  });
});

describe('ShopSelector', () => {
  it('renders Radix Select with shop options', async () => {
    const onShopChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ShopSelector selectedShopId="shop-1" onShopChange={onShopChange} />
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();

    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Gangnam Beauty Lab')).toBeInTheDocument();
      expect(screen.getByText('Busan Nail Atelier')).toBeInTheDocument();
    });
  });

  it('invokes onShopChange when a new option is selected', async () => {
    const onShopChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ShopSelector selectedShopId="shop-1" onShopChange={onShopChange} />
    );

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    const option = await screen.findByText('Busan Nail Atelier', {}, { timeout: 10000 });
    await user.click(option);

    expect(onShopChange).toHaveBeenCalledWith('shop-2');
  }, 15000);

  it('shows shop insight popover with badges', async () => {
    const onShopChange = vi.fn();

    render(
      <ShopSelector selectedShopId="shop-1" onShopChange={onShopChange} />
    );

    const infoButton = screen.getByRole('button', { name: /샵 인사이트/ });
    fireEvent.click(infoButton);

    await waitFor(() => {
      expect(screen.getByText('리뷰 연동')).toBeInTheDocument();
      expect(screen.getByText('콘텐츠 스튜디오')).toBeInTheDocument();
    });
  });
});
