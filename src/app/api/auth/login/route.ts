import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { login } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const user = await prisma.user.findUnique({
      where: { username },
    });

    // In a real app, verify hashed password. Here it's plain text.
    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await login(user.username);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
