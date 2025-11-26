import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 px-4">
      <main className="flex max-w-4xl flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          SalonMate
        </h1>
        <p className="max-w-2xl text-lg text-gray-600">
          뷰티/살롱 사장님을 위한 AI 마케팅 자동화 플랫폼
        </p>

        <div className="grid gap-6 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>리뷰 AI 답변</CardTitle>
              <CardDescription>
                네이버/구글 리뷰에 맞춤형 답변 자동 생성
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                리뷰 답변 시간을 30분에서 1분으로 단축
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>인스타 포스팅</CardTitle>
              <CardDescription>
                사진 업로드로 캡션/해시태그 자동 생성
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                매일 포스팅으로 온라인 존재감 강화
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>마케팅 대시보드</CardTitle>
              <CardDescription>
                리뷰 현황, 포스팅 성과 한눈에 확인
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                데이터 기반 마케팅 의사결정 지원
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link href="/login">시작하기</Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href="/signup">회원가입</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
