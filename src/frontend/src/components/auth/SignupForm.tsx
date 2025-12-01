'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { ApiError } from '@/lib/api';

const SHOP_TYPES = [
  { value: 'nail', label: '네일샵' },
  { value: 'hair', label: '헤어샵' },
  { value: 'skin', label: '피부관리' },
  { value: 'lash', label: '속눈썹' },
] as const;

export function SignupForm() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopType, setShopType] = useState<'nail' | 'hair' | 'skin' | 'lash' | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 유효성 검사
    if (password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.signup({
        name,
        email,
        password,
        ...(shopName && { shopName }),
        ...(shopType && { shopType }),
      });
      setAuth(response);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('회원가입 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: string) => {
    try {
      const { authUrl } = await authService.getOAuthURL(provider);
      window.location.href = authUrl;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('OAuth 로그인 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">이름</Label>
        <Input
          id="name"
          type="text"
          placeholder="이름을 입력하세요"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          type="email"
          placeholder="이메일을 입력하세요"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          type="password"
          placeholder="비밀번호를 입력하세요 (최소 8자)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="shopName">매장 이름 (선택)</Label>
        <Input
          id="shopName"
          type="text"
          placeholder="매장 이름을 입력하세요"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          disabled={isLoading}
        />
      </div>

      {shopName && (
        <div className="space-y-2">
          <Label htmlFor="shopType">매장 유형</Label>
          <select
            id="shopType"
            value={shopType}
            onChange={(e) => setShopType(e.target.value as typeof shopType)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            disabled={isLoading}
          >
            <option value="">선택하세요</option>
            {SHOP_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? '회원가입 중...' : '회원가입'}
      </Button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">또는</span>
        </div>
      </div>

      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => handleOAuthLogin('google')}
          disabled={isLoading}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google로 계속하기
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => handleOAuthLogin('kakao')}
          disabled={isLoading}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#FEE500"
              d="M12 3C6.48 3 2 6.58 2 11c0 2.85 1.89 5.35 4.72 6.76-.17.63-.62 2.27-.71 2.62-.12.44.16.43.34.31.14-.09 2.23-1.51 3.12-2.12.53.08 1.08.12 1.64.12 5.52 0 10-3.58 10-8s-4.48-8-10-8z"
            />
          </svg>
          Kakao로 계속하기
        </Button>
      </div>

      <p className="text-center text-sm text-gray-600">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="font-medium text-gray-900 underline">
          로그인
        </Link>
      </p>
    </form>
  );
}
