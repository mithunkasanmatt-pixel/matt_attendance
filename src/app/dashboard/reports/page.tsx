'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Download, FileText, Building2, Calendar, Table as TableIcon } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Department = {
  id: string;
  name: string;
};

type ReportRecord = {
  sNo: number;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  numberOfLeaves: number;
  permissionHours: number;
};

type ReportData = {
  departmentName: string;
  monthLabel: string;
  month: string;
  departmentId: string;
  records: ReportRecord[];
};

export default function ReportsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [month, setMonth] = useState<string>(() => format(new Date(), 'yyyy-MM'));
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch('/api/departments', { cache: 'no-store' });
        const data = await res.json();
        if (Array.isArray(data)) {
          setDepartments(data);
        }
      } catch (error) {
        console.error('Failed to fetch departments', error);
      }
    };
    fetchDepartments();
  }, []);

  const handleFetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reports?departmentId=${selectedDepartment}&month=${month}`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      setReportData(data);
    } catch (error) {
      console.error('Failed to fetch report data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    const url = `/api/export/csv?departmentId=${selectedDepartment}&month=${month}`;
    window.open(url, '_blank');
  };

  const handleExportPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();

    // Report Header Title
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.text('Employee Attendance & Permission Report', 14, 20);

    // Metadata details at top of report
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105); // Slate 600
    doc.text(`Department Name: ${reportData.departmentName}`, 14, 30);
    doc.text(`Month: ${reportData.monthLabel}`, 14, 37);

    // Report Table
    autoTable(doc, {
      startY: 44,
      head: [['Serial No.', 'Employee Name', 'Number of Leaves', 'Permission Hours']],
      body: reportData.records.map((r) => [
        r.sNo,
        r.employeeName,
        r.numberOfLeaves,
        `${r.permissionHours} hrs`,
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: [37, 99, 235], // Blue-600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
    });

    const filename = `Attendance_Report_${reportData.departmentName.replace(/[^a-zA-Z0-9]/g, '_')}_${reportData.month}.pdf`;
    doc.save(filename);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Attendance & Permission Reports</h2>

      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 w-full max-w-4xl mb-8">
        <h3 className="text-lg font-semibold mb-6 text-gray-700">Generate Monthly Department Report</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Building2 className="w-4 h-4 mr-1.5 text-gray-500" />
              Select Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-1.5 text-gray-500" />
              Select Month
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={handleFetchReport}
          disabled={loading}
          className="w-full flex justify-center items-center bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          <TableIcon className="w-5 h-5 mr-2" />
          {loading ? 'Generating Report...' : 'Generate Report'}
        </button>
      </div>

      {reportData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full max-w-4xl overflow-hidden mb-8">
          {/* Top Metadata Header of Report */}
          <div className="px-6 py-5 border-b border-gray-200 bg-blue-50/60">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <p className="text-xs uppercase font-semibold text-blue-600 tracking-wider">Report Header</p>
                <div className="flex items-center gap-6 mt-1">
                  <div>
                    <span className="text-xs text-gray-500 block">Department Name</span>
                    <span className="text-base font-bold text-gray-900">{reportData.departmentName}</span>
                  </div>
                  <div className="h-8 w-px bg-blue-200"></div>
                  <div>
                    <span className="text-xs text-gray-500 block">Month</span>
                    <span className="text-base font-bold text-gray-900">{reportData.monthLabel}</span>
                  </div>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportCSV}
                  disabled={reportData.records.length === 0}
                  className="flex items-center bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50 shadow-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={reportData.records.length === 0}
                  className="flex items-center bg-rose-600 text-white py-2 px-4 rounded-md hover:bg-rose-700 transition-colors text-sm font-medium disabled:opacity-50 shadow-sm"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Export PDF
                </button>
              </div>
            </div>
          </div>

          {/* Report Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/70 border-b border-gray-200">
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Serial No.
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Employee Name
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Number of Leaves
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Permission Hours
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportData.records.length > 0 ? (
                  reportData.records.map((record) => (
                    <tr key={record.employeeId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-500">{record.sNo}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.employeeName}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          record.numberOfLeaves > 0 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {record.numberOfLeaves} {record.numberOfLeaves === 1 ? 'day' : 'days'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {record.permissionHours} hrs
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No employees or data found for this department and month.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
