import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">대시보드</h1>
        <p className="text-gray-600">마케팅 현황을 한눈에 확인하세요</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>리뷰</CardTitle>
            <CardDescription>이번 주 리뷰 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-sm text-gray-500">답변 대기 중</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>포스팅</CardTitle>
            <CardDescription>이번 주 포스팅</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-sm text-gray-500">예약됨</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI 사용량</CardTitle>
            <CardDescription>이번 달 사용량</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0%</div>
            <p className="text-sm text-gray-500">0 / 100 요청</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
