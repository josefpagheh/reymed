'use client';

import { Button } from '@/shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState('doctor');

  const handleLogin = () => {
    localStorage.setItem('role', role);
    if (role === 'doctor') {
      router.push('/doctor');
    } else {
      router.push('/clerk');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>ورود به سامانه</CardTitle>
          <CardDescription>
            لطفا نام کاربری، رمز عبور و نقش خود را انتخاب کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">نام کاربری</Label>
              <Input id="username" type="text" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">رمز عبور</Label>
              <Input id="password" type="password" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">نقش</Label>
              <Select onValueChange={setRole} defaultValue={role}>
                <SelectTrigger>
                  <SelectValue placeholder="نقش خود را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doctor">پزشک</SelectItem>
                  <SelectItem value="clerk">منشی</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleLogin} className="w-full">
              ورود
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
