import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseISO, format, startOfMonth, endOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    const month = searchParams.get('month') || format(new Date(), 'yyyy-MM');

    const monthDate = parseISO(`${month}-01`);
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

    const csvLines: string[] = [];
    csvLines.push(`"Department Name","${departmentName.replace(/"/g, '""')}"`);
    csvLines.push(`"Month","${monthLabel.replace(/"/g, '""')}"`);
    csvLines.push('');
    csvLines.push('"Serial No.","Employee Name","Number of Leaves","Permission Hours"');

    employees.forEach((emp, index) => {
      const leaves = emp.attendances.filter((a) => a.status === 'Absent').length;
      const sNo = index + 1;
      const empName = `"${emp.name.replace(/"/g, '""')}"`;
      const totalAttendancePermHours = emp.attendances.reduce((acc, a) => acc + (a.permissionHours || 0), 0);
      const permHours = totalAttendancePermHours > 0 ? totalAttendancePermHours : (emp.permissionHours || 0);

      csvLines.push(`${sNo},${empName},${leaves},${permHours}`);
    });

    const csvData = csvLines.join('\n');
    const filename = `Attendance_Report_${departmentName.replace(/[^a-zA-Z0-9]/g, '_')}_${month}.csv`;

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return NextResponse.json({ error: 'Failed to export CSV' }, { status: 500 });
  }
}
