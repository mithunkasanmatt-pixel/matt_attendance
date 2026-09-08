'use client';

import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { User, CheckCircle, XCircle, Clock, CalendarDays, History } from 'lucide-react';

type Employee = { id: string; name: string; permissionHours?: number };
type AttendanceRecord = { employeeId: string; date: string; status: 'Present' | 'Absent'; permissionHours?: number };

export default function AttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [todayDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);

  // Track modified attendance statuses and permission hours locally
  const [localChanges, setLocalChanges] = useState<Record<string, 'Present' | 'Absent'>>({});
  const [permissionChanges, setPermissionChanges] = useState<Record<string, number>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);

  const fetchData = async (currentDate: string) => {
    setLoading(true);
    try {
      const [empRes, attRes] = await Promise.all([
        fetch('/api/employees', { cache: 'no-store' }),
        fetch(`/api/attendance?date=${currentDate}`, { cache: 'no-store' }),
      ]);
      const empData = await empRes.json();
      const attData = await attRes.json();

      setEmployees(empData);
      setAttendanceRecords(attData);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (date) {
      fetchData(date);
    }
  }, [date]);

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    setLocalChanges({});
    setPermissionChanges({});
  };

  const markAttendance = (employeeId: string, status: 'Present' | 'Absent') => {
    setLocalChanges((prev) => ({ ...prev, [employeeId]: status }));
  };

  const handlePermissionChange = (employeeId: string, hours: number) => {
    setPermissionChanges((prev) => ({ ...prev, [employeeId]: hours }));
  };

  const getStatus = (employeeId: string) => {
    return localChanges[employeeId] || attendanceRecords.find((r) => r.employeeId === employeeId)?.status;
  };

  const getPermissionHours = (emp: Employee) => {
    if (permissionChanges[emp.id] !== undefined) {
      return permissionChanges[emp.id];
    }
    const record = attendanceRecords.find((r) => r.employeeId === emp.id);
    if (record && record.permissionHours !== undefined && record.permissionHours !== null) {
      return record.permissionHours;
    }
    return emp.permissionHours || 0;
  };

  const hasPendingChanges = Object.keys(localChanges).length > 0 || Object.keys(permissionChanges).length > 0;

  const handleSubmit = () => {
    if (!hasPendingChanges) return;
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Collect all affected employee IDs (either status changed or permission changed)
      const affectedEmployeeIds = Array.from(
        new Set([...Object.keys(localChanges), ...Object.keys(permissionChanges)])
      );

      // Save to database
      const promises = affectedEmployeeIds.map((employeeId) => {
        const currentStatus = getStatus(employeeId) || 'Present';
        const currentPermHours = getPermissionHours(
          employees.find((e) => e.id === employeeId) || { id: employeeId, name: '' }
        );

        // 1. Upsert attendance record in database with status and date permission hours
        const attPromise = fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId,
            date,
            status: currentStatus,
            permissionHours: currentPermHours,
          }),
        });

        // 2. Also update employee permission hours master in database
        const emp = employees.find((e) => e.id === employeeId);
        const empPromise = fetch(`/api/employees/${employeeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: emp?.name,
            permissionHours: currentPermHours,
          }),
        });

        return Promise.all([attPromise, empPromise]);
      });

      await Promise.all(promises);

      await fetchData(date);
      setLocalChanges({});
      setPermissionChanges({});
      setShowConfirm(false);
    } catch (error) {
      console.error('Failed to submit attendance', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return <div className="p-6 text-center text-gray-500">Loading...</div>;
  }

  const yesterdayDate = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const dayBeforeYesterdayDate = format(subDays(new Date(), 2), 'yyyy-MM-dd');

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Attendance Management</h2>

      {/* Date Picker & Preset Buttons for Previous Dates */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8 w-full max-w-3xl">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Date to Edit / Mark Attendance</label>
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium flex items-center mr-1">
              <History className="w-3.5 h-3.5 mr-1 text-gray-400" />
              Quick Presets:
            </span>
            <button
              onClick={() => handleDateChange(todayDate)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                date === todayDate ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handleDateChange(yesterdayDate)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                date === yesterdayDate ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Yesterday ({yesterdayDate})
            </button>
            <button
              onClick={() => handleDateChange(dayBeforeYesterdayDate)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                date === dayBeforeYesterdayDate ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Day Before Yesterday ({dayBeforeYesterdayDate})
            </button>
          </div>
        </div>
      </div>

      {/* Attendance & Permission List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full max-w-4xl">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="flex items-center">
            <CalendarDays className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-semibold text-gray-700">
              Attendance List for <span className="text-blue-700 font-bold">{date}</span>
            </h3>
          </div>
          {date !== todayDate && (
            <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-medium border border-amber-200">
              Editing Previous Date
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading attendance data...</div>
        ) : employees.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No employees found. Please add employees first.</div>
        ) : (
          <div>
            <ul className="divide-y divide-gray-200">
              {employees.map((emp) => {
                const status = getStatus(emp.id);
                return (
                  <li key={emp.id} className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-gray-50">
                    <div className="flex items-center min-w-[180px]">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4 shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <p className="font-medium text-gray-900">{emp.name}</p>
                    </div>

                    {/* Attendance Marking & Permission Field Section */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Permission Hours Field */}
                      <div className="flex items-center bg-amber-50/80 border border-amber-200 px-3 py-1.5 rounded-md">
                        <Clock className="w-4 h-4 text-amber-600 mr-1.5 shrink-0" />
                        <label className="text-xs font-semibold text-amber-900 mr-1.5 shrink-0">Permission:</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={getPermissionHours(emp)}
                          onChange={(e) => handlePermissionChange(emp.id, Number(e.target.value))}
                          className="w-16 rounded border border-amber-300 px-2 py-0.5 text-sm text-amber-900 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                          placeholder="0"
                        />
                        <span className="text-xs text-amber-700 ml-1 font-medium">hrs</span>
                      </div>

                      {/* Attendance Status Marking Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => markAttendance(emp.id, 'Present')}
                          className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            status === 'Present'
                              ? 'bg-green-100 text-green-700 border border-green-300 shadow-sm font-semibold'
                              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <CheckCircle
                            className={`w-4 h-4 mr-1.5 ${status === 'Present' ? 'text-green-600' : 'text-gray-400'}`}
                          />
                          Present
                        </button>
                        <button
                          onClick={() => markAttendance(emp.id, 'Absent')}
                          className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            status === 'Absent'
                              ? 'bg-red-100 text-red-700 border border-red-300 shadow-sm font-semibold'
                              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <XCircle
                            className={`w-4 h-4 mr-1.5 ${status === 'Absent' ? 'text-red-600' : 'text-gray-400'}`}
                          />
                          Absent
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={!hasPendingChanges}
                className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Save Attendance ({date})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Submission</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to save attendance and permission records for <span className="font-semibold text-gray-900">{date}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Yes, Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
