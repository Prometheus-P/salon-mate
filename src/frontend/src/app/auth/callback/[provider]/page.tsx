'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { ApiError } from '@/lib/api';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const provider = params.provider as string;

      if (!code || !state) {
        setError('인증 코드가 없습니다.');
        return;
      }

      try {
        const response = await authService.handleOAuthCallback(
          provider,
          code,
          state
        );
        setAuth(response);
        router.push('/dashboard');
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('OAuth 인증 중 오류가 발생했습니다.');
        }
      }
    };

    handleCallback();
  }, [searchParams, params, setAuth, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-600">인증 실패</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-800"
          >
            로그인 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-gray-900 rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  );
}
