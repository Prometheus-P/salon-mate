'use client';

/**
 * Marketing Dashboard Page
 * Main dashboard view for salon owners to monitor marketing metrics
 */

import { Suspense, useState } from 'react';
import { ShopSelector } from './components/ShopSelector';
import { ReviewStats } from './components/ReviewStats';
import { PostingCalendar } from './components/PostingCalendar';
import { EngagementMetrics } from './components/EngagementMetrics';
import { TrendCharts } from './components/TrendCharts';
import { PendingReviews } from './components/PendingReviews';
import { CardSkeleton } from './components/EmptyState';

// Material UI imports
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid'; // Using Grid with v2 API (size prop)

export default function DashboardPage() {
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ flexGrow: 1 }}>
        {/* Header with Shop Selector - M3 Typography */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { sm: 'center' }, justifyContent: { sm: 'space-between' }, mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              대시보드
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              마케팅 현황을 한눈에 확인하세요
            </Typography>
          </Box>
          <Suspense fallback={<Box sx={{ height: 40, width: 192, bgcolor: 'grey.300', animation: 'pulse 1.5s infinite', borderRadius: 1 }} />}>
            <ShopSelector
              selectedShopId={selectedShopId}
              onShopChange={setSelectedShopId}
            />
          </Suspense>
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
