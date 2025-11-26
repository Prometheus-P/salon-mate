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

export default function SignupPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">회원가입</CardTitle>
        <CardDescription>SalonMate 계정을 생성하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            이름
          </label>
          <Input id="name" type="text" placeholder="이름을 입력하세요" />
        </div>
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
        <div className="space-y-2">
          <label htmlFor="shopName" className="text-sm font-medium">
            매장 이름 (선택)
          </label>
          <Input
            id="shopName"
            type="text"
            placeholder="매장 이름을 입력하세요"
          />
        </div>
        <Button className="w-full">회원가입</Button>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-gray-600">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="font-medium text-gray-900 underline">
            로그인
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
