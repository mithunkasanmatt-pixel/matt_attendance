import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        employees: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    const existing = await prisma.department.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json({ error: 'Department name already exists' }, { status: 400 });
    }

    const department = await prisma.department.create({
      data: { name: name.trim() },
      include: { employees: true },
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
  }
}
