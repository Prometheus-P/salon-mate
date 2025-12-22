'use client';

import * as React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Star,
  MessageCircle,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ReviewAnalyticsResponse } from '@/lib/api/reviews';

interface ReviewAnalyticsProps {
  data: ReviewAnalyticsResponse;
  className?: string;
}

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  format = 'number',
}: {
  title: string;
  value: number;
  change: number;
  icon: React.ElementType;
  format?: 'number' | 'rating' | 'percent';
}) {
  const isPositive = change >= 0;

  const formatValue = () => {
    switch (format) {
      case 'rating':
        return value.toFixed(1);
      case 'percent':
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{formatValue()}</p>
              {format === 'rating' && (
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              )}
            </div>
            <div
              className={cn(
                'flex items-center gap-1 text-xs',
                isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>
                {isPositive ? '+' : ''}
                {change.toFixed(1)}%
              </span>
              <span className="text-muted-foreground">전월 대비</span>
            </div>
          </div>
          <div className="rounded-full bg-primary/10 p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RatingDistributionChart({
  distribution,
}: {
  distribution: ReviewAnalyticsResponse['ratingDistribution'];
}) {
  const maxPercent = Math.max(...distribution.map((d) => d.percent));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">평점 분포</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {distribution.map((item) => (
          <div key={item.rating} className="flex items-center gap-3">
            <div className="flex items-center gap-1 w-16">
              {Array.from({ length: item.rating }).map((_, i) => (
                <Star
                  key={i}
                  className="h-3 w-3 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
            <div className="flex-1">
              <div className="h-4 w-full rounded-full bg-muted">
                <div
                  className="h-4 rounded-full bg-primary transition-all"
                  style={{
                    width: `${maxPercent > 0 ? (item.percent / maxPercent) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <span className="w-12 text-right text-sm text-muted-foreground">
              {item.percent.toFixed(0)}%
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SentimentCard({
  sentiment,
}: {
  sentiment: ReviewAnalyticsResponse['sentiment'];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">감성 분석</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex h-4 w-full overflow-hidden rounded-full">
          <div
            className="bg-green-500 transition-all"
            style={{ width: `${sentiment.positivePercent}%` }}
          />
          <div
            className="bg-gray-400 transition-all"
            style={{ width: `${sentiment.neutralPercent}%` }}
          />
          <div
            className="bg-red-500 transition-all"
            style={{ width: `${sentiment.negativePercent}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">
              {sentiment.positivePercent.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">긍정</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-500">
              {sentiment.neutralPercent.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">중립</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">
              {sentiment.negativePercent.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">부정</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KeywordsCard({
  keywords,
}: {
  keywords: ReviewAnalyticsResponse['keywords'];
}) {
  if (keywords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">자주 언급되는 키워드</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            분석할 리뷰가 충분하지 않습니다
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...keywords.map((k) => k.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">자주 언급되는 키워드</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword) => {
            const size = Math.max(0.75, (keyword.count / maxCount) * 1.25);
            return (
              <span
                key={keyword.keyword}
                className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/20 cursor-pointer transition-colors"
                style={{ fontSize: `${size}rem` }}
              >
                {keyword.keyword}
              </span>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function TrendChart({
  trendData,
}: {
  trendData: ReviewAnalyticsResponse['trendData'];
}) {
  if (trendData.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="text-base">리뷰 트렌드</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            표시할 데이터가 없습니다
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...trendData.map((d) => d.reviewCount));

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-base">리뷰 트렌드</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48 flex items-end gap-1">
          {trendData.map((point, index) => (
            <div
              key={point.date}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div
                className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                style={{
                  height: `${maxCount > 0 ? (point.reviewCount / maxCount) * 100 : 0}%`,
                  minHeight: point.reviewCount > 0 ? '4px' : '0',
                }}
                title={`${point.date}: ${point.reviewCount}개`}
              />
              {index % 5 === 0 && (
                <span className="text-[10px] text-muted-foreground -rotate-45 origin-left">
                  {new Date(point.date).toLocaleDateString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ReviewAnalytics({ data, className }: ReviewAnalyticsProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="총 리뷰"
          value={data.totalReviews.current}
          change={data.totalReviews.changePercent}
          icon={MessageCircle}
        />
        <MetricCard
          title="평균 평점"
          value={data.averageRating.current}
          change={data.averageRating.changePercent}
          icon={Star}
          format="rating"
        />
        <MetricCard
          title="응답률"
          value={data.responseRate.current}
          change={data.responseRate.changePercent}
          icon={BarChart3}
          format="percent"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <RatingDistributionChart distribution={data.ratingDistribution} />
        <SentimentCard sentiment={data.sentiment} />
      </div>

      {/* Trend Chart */}
      <TrendChart trendData={data.trendData} />

      {/* Keywords */}
      <KeywordsCard keywords={data.keywords} />
    </div>
  );
}
