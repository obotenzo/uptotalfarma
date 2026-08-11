import { NextResponse } from 'next/server';
import { createSessionValue, getAuthConfig, sessionMaxAge } from '@/lib/auth';

export async function POST(request) {
  const form = await request.formData();
  const username = String(form.get('username') || '');
  const password = String(form.get('password') || '');
  const { username: expectedUser, password: expectedPass } = getAuthConfig();

  if (username !== expectedUser || password !== expectedPass) {
    return NextResponse.json({ error: 'Login ou senha inválidos.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: 'uptf_session',
    value: createSessionValue(expectedUser),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: sessionMaxAge(),
  });
  return res;
}
