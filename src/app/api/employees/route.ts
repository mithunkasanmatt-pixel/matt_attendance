import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        department: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, departmentId, permissionHours } = await request.json();
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const employee = await prisma.employee.create({
      data: {
        name: name.trim(),
        departmentId: departmentId || null,
        permissionHours: permissionHours !== undefined ? Number(permissionHours) || 0 : 0,
      },
      include: {
        department: true,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}
