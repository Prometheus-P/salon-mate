'use client';

/**
 * TrendCharts - Display review trends over time
 * Implements FR-010, FR-011
 */

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTrendData } from '../hooks/useDashboard';
import { CardSkeleton, ErrorState } from './EmptyState';

interface TrendChartsProps {
  shopId: string;
}

type Period = 'week' | 'month' | 'year';

const periodLabels: Record<Period, string> = {
  week: '7일',
  month: '30일',
  year: '365일',
};

function formatDate(dateStr: string, period: Period): string {
  const date = new Date(dateStr);

  if (period === 'year') {
    return date.toLocaleDateString('ko-KR', { month: 'short' });
  }

  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function EmptyTrends() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <svg
        className="h-12 w-12 text-gray-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
        />
      </svg>
      <h3 className="mt-4 text-sm font-medium text-gray-900">No trend data</h3>
      <p className="mt-1 text-sm text-gray-500">
        선택한 기간에 리뷰 데이터가 없습니다.
      </p>
    </div>
  );
}

interface TooltipPayloadEntry {
  color: string;
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
      <p className="mb-2 text-sm font-medium text-gray-900">{label}</p>
      {payload.map((entry, index: number) => (
        <p
          key={index}
          className="text-sm"
          style={{ color: entry.color }}
        >
          {entry.name}: {entry.value.toLocaleString()}
          {entry.name === 'Response Rate' && '%'}
        </p>
      ))}
    </div>
  );
}

export function TrendCharts({ shopId }: TrendChartsProps) {
  const [period, setPeriod] = useState<Period>('week');
  const { data, isLoading, error, refetch } = useTrendData(shopId, period);

  if (isLoading) {
    return (
      <div data-testid="trend-charts-loading">
        <CardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load trend data"
        onRetry={() => refetch()}
      />
    );
  }

  // Format data for Recharts
  const chartData = data?.data_points.map((point) => ({
    date: formatDate(point.date, period),
    'Review Count': point.review_count,
    'Average Rating': point.average_rating,
    'Response Rate': point.response_rate,
  })) || [];

  const isEmpty = !chartData || chartData.length === 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      {/* Header with Period Selector */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Trend Charts</h2>

        {/* Period Toggle */}
        <div className="flex rounded-md border border-gray-300">
          {(['week', 'month', 'year'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-sm ${
                period === p
                  ? 'bg-gray-100 font-medium text-gray-900'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {isEmpty ? (
        <EmptyTrends />
      ) : (
        <div className="space-y-6">
          {/* Review Count Chart */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-700">리뷰 수</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="Review Count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rating & Response Rate Chart */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-700">평점 & 응답률</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="rating"
                    domain={[0, 5]}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="rate"
                    orientation="right"
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                  <Line
                    yAxisId="rating"
                    type="monotone"
                    dataKey="Average Rating"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', strokeWidth: 0, r: 4 }}
                  />
                  <Line
                    yAxisId="rate"
                    type="monotone"
                    dataKey="Response Rate"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-gray-500">리뷰 수</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-gray-500">평균 평점</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-gray-500">응답률</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
