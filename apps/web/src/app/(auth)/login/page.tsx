'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/shared/lib/stores/auth';

export default function LoginPage() {
  const router = useRouter();
  const { setRole } = useAuthStore();

  const handleLogin = (role: 'doctor' | 'clerk') => {
    setRole(role);
    router.push('/dashboard');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">ورود به سامانه</h1>
      <div className="flex gap-4">
        <button
          onClick={() => handleLogin('doctor')}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          ورود به عنوان پزشک
        </button>
        <button
          onClick={() => handleLogin('clerk')}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          ورود به عنوان منشی
        </button>
      </div>
    </div>
  );
}
