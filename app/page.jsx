import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_NAME, isAuthenticated } from '@/lib/auth';

export default function Home() {
  const cookie = cookies().get(COOKIE_NAME)?.value;
  if (isAuthenticated(cookie)) redirect('/dashboard');
  redirect('/login');
}
