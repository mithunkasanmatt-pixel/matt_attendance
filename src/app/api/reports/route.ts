import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseISO, format, startOfMonth, endOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    const month = searchParams.get('month');
    const fromDateParam = searchParams.get('fromDate');
    const toDateParam = searchParams.get('toDate');

    let startDate: string;
    let endDate: string;
    let periodLabel: string;

    if (fromDateParam && toDateParam) {
      startDate = fromDateParam;
      endDate = toDateParam;
      periodLabel = `${startDate} to ${endDate}`;
    } else if (month) {
      const monthDate = parseISO(`${month}-01`);
      if (isNaN(monthDate.getTime())) {
        return NextResponse.json({ error: 'Invalid month format' }, { status: 400 });
      }
      startDate = format(startOfMonth(monthDate), 'yyyy-MM-dd');
      endDate = format(endOfMonth(monthDate), 'yyyy-MM-dd');
      periodLabel = format(monthDate, 'MMMM yyyy');
    } else {
      const now = new Date();
      startDate = format(startOfMonth(now), 'yyyy-MM-dd');
      endDate = format(endOfMonth(now), 'yyyy-MM-dd');
      periodLabel = format(now, 'MMMM yyyy');
    }

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
      const absentRecords = emp.attendances.filter((a) => a.status === 'Absent');
      const leaves = absentRecords.length;
      const leaveDates = absentRecords.map((a) => a.date).sort();
      const totalAttendancePermHours = emp.attendances.reduce((acc, a) => acc + (a.permissionHours || 0), 0);
      const permHours = totalAttendancePermHours > 0 ? totalAttendancePermHours : (emp.permissionHours || 0);

      return {
        sNo: index + 1,
        employeeId: emp.id,
        employeeName: emp.name,
        departmentName: emp.department?.name || 'Unassigned',
        numberOfLeaves: leaves,
        leaveDates,
        permissionHours: permHours,
      };
    });

    return NextResponse.json({
      departmentName,
      periodLabel,
      monthLabel: periodLabel,
      fromDate: startDate,
      toDate: endDate,
      month: month || '',
      departmentId: departmentId || 'all',
      records,
    });
  } catch (error) {
    console.error('Error fetching department report:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}
