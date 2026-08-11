import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_NAME, isAuthenticated } from '@/lib/auth';

export default async function Home() {
  const cookie = (await cookies()).get(COOKIE_NAME)?.value;
  if (isAuthenticated(cookie)) redirect('/dashboard');
  redirect('/login');
}
