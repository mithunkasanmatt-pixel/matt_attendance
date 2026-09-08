export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-600">
          Welcome to the Attendance Management System. Use the sidebar to navigate to Employees,
          mark Attendance, or generate Reports.
        </p>
      </div>
    </div>
  );
}
