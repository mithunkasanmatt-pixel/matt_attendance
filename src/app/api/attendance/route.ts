import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: { date },
    });

    return NextResponse.json(attendanceRecords);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { employeeId, date, status, permissionHours } = await request.json();

    if (!employeeId || !date || !status) {
      return NextResponse.json({ error: 'employeeId, date, and status are required' }, { status: 400 });
    }

    const record = await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId,
          date,
        },
      },
      update: {
        status,
        permissionHours: permissionHours !== undefined ? Number(permissionHours) || 0 : undefined,
      },
      create: {
        employeeId,
        date,
        status,
        permissionHours: permissionHours !== undefined ? Number(permissionHours) || 0 : 0,
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error marking attendance:', error);
    return NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 });
  }
}
