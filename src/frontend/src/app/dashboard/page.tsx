'use client';

/**
 * Marketing Dashboard Page
 * Main dashboard view for salon owners to monitor marketing metrics
 */

import { useEffect, useSyncExternalStore } from 'react';
import { ReviewStats } from './components/ReviewStats';
import { PostingCalendar } from './components/PostingCalendar';
import { EngagementMetrics } from './components/EngagementMetrics';
import { TrendCharts } from './components/TrendCharts';
import { PendingReviews } from './components/PendingReviews';
import { CardSkeleton } from './components/EmptyState';
import { useShopStore } from '@/stores/shopStore';
import { useShopsWithStats } from './hooks/useDashboard';

// Material UI imports
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid'; // Using Grid with v2 API (size prop)

// Helper to safely get selectedShopId with hydration handling
function useHydratedShopId() {
  const store = useShopStore;
  return useSyncExternalStore(
    store.subscribe,
    () => store.getState().selectedShopId,
    () => null // Server snapshot returns null
  );
}

export default function DashboardPage() {
  const selectedShopId = useHydratedShopId();
  const setSelectedShopId = useShopStore((s) => s.setSelectedShopId);
  const { data: shopsData } = useShopsWithStats();

  // Auto-select first shop if none selected (only on client side after hydration)
  const shops = shopsData?.shops;
  useEffect(() => {
    if (selectedShopId === null && shops && shops.length > 0) {
      // Use setTimeout to avoid synchronous setState during render
      const timeoutId = setTimeout(() => {
        setSelectedShopId(shops[0].id);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedShopId, shops, setSelectedShopId]);

  // Get the current shop name for display
  const currentShop = shops?.find((s) => s.id === selectedShopId);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ flexGrow: 1 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            대시보드
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {currentShop ? `${currentShop.name} - 마케팅 현황` : '사이드바에서 매장을 선택하세요'}
          </Typography>
        </Box>

        {/* Dashboard Content */}
        {!selectedShopId ? (
          // Loading state while shop is being selected
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <CardSkeleton />
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <CardSkeleton />
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <CardSkeleton />
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Row 1: Review Stats + Pending Reviews */}
            <Grid container spacing={3}>
              {/* ReviewStats component - US1 */}
              <Grid size={{ xs: 12, lg: 6 }}>
                <ReviewStats shopId={selectedShopId} />
              </Grid>

              {/* PendingReviews component - US5 */}
              <Grid size={{ xs: 12, lg: 6 }}>
                <PendingReviews shopId={selectedShopId} />
              </Grid>
            </Grid>

            {/* Row 2: Posting Calendar - US2 */}
            <PostingCalendar shopId={selectedShopId} />

            {/* Row 3: Engagement Metrics + Trend Charts */}
            <Grid container spacing={3}>
              {/* EngagementMetrics component - US3 */}
              <Grid size={{ xs: 12, lg: 6 }}>
                <EngagementMetrics shopId={selectedShopId} />
              </Grid>

              {/* TrendCharts component - US4 */}
              <Grid size={{ xs: 12, lg: 6 }}>
                <TrendCharts shopId={selectedShopId} />
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
    </Container>
  );
}
