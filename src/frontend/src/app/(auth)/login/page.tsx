import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">로그인</CardTitle>
        <CardDescription>SalonMate에 오신 것을 환영합니다</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            이메일
          </label>
          <Input id="email" type="email" placeholder="이메일을 입력하세요" />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            비밀번호
          </label>
          <Input
            id="password"
            type="password"
            placeholder="비밀번호를 입력하세요"
          />
        </div>
        <Button className="w-full">로그인</Button>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-gray-600">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="font-medium text-gray-900 underline">
            회원가입
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
