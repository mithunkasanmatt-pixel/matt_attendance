import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseISO, format, startOfMonth, endOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    const month = searchParams.get('month'); // Expected format: YYYY-MM

    if (!month) {
      return NextResponse.json({ error: 'month parameter (YYYY-MM) is required' }, { status: 400 });
    }

    const monthDate = parseISO(`${month}-01`);
    if (isNaN(monthDate.getTime())) {
      return NextResponse.json({ error: 'Invalid month format' }, { status: 400 });
    }

    const monthLabel = format(monthDate, 'MMMM yyyy');
    const startDate = format(startOfMonth(monthDate), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(monthDate), 'yyyy-MM-dd');

    let departmentName = 'All Departments';

    const employeeWhere: any = {};
    if (departmentId && departmentId !== 'all') {
      employeeWhere.departmentId = departmentId;
      const dept = await prisma.department.findUnique({
        where: { id: departmentId },
      });
      if (dept) {
        departmentName = dept.name;
      }
    }

    const employees = await prisma.employee.findMany({
      where: employeeWhere,
      include: {
        department: true,
        attendances: {
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const records = employees.map((emp, index) => {
      const leaves = emp.attendances.filter((a) => a.status === 'Absent').length;
      const totalAttendancePermHours = emp.attendances.reduce((acc, a) => acc + (a.permissionHours || 0), 0);
      const permHours = totalAttendancePermHours > 0 ? totalAttendancePermHours : (emp.permissionHours || 0);

      return {
        sNo: index + 1,
        employeeId: emp.id,
        employeeName: emp.name,
        departmentName: emp.department?.name || 'Unassigned',
        numberOfLeaves: leaves,
        permissionHours: permHours,
      };
    });

    return NextResponse.json({
      departmentName,
      monthLabel,
      month,
      departmentId: departmentId || 'all',
      records,
    });
  } catch (error) {
    console.error('Error fetching department report:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}
