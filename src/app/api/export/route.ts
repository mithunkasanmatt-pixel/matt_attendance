import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type') || 'Custom'; // daily, weekly, monthly

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        employee: true,
      },
      orderBy: [
        { date: 'asc' },
        { employee: { name: 'asc' } },
      ],
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${type} Attendance`);

    worksheet.columns = [
      { header: 'Employee Name', key: 'name', width: 25 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true };

    attendanceRecords.forEach((record) => {
      worksheet.addRow({
        name: record.employee.name,
        date: record.date,
        status: record.status,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Attendance_${type}_${startDate}_to_${endDate}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error exporting attendance:', error);
    return NextResponse.json({ error: 'Failed to export attendance' }, { status: 500 });
  }
}
