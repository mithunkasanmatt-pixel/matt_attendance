import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { name } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    const existing = await prisma.department.findFirst({
      where: {
        name: name.trim(),
        NOT: { id },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Department name already exists' }, { status: 400 });
    }

    const department = await prisma.department.update({
      where: { id },
      data: { name: name.trim() },
      include: { employees: true },
    });

    return NextResponse.json(department);
  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json({ error: 'Failed to update department' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    await prisma.department.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json({ error: 'Failed to delete department' }, { status: 500 });
  }
}
