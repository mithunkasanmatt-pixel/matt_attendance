'use client';

import { useState, useEffect } from 'react';
import { UserPlus, User, Edit2, Trash2, Check, X, Building2, Clock } from 'lucide-react';

type Department = {
  id: string;
  name: string;
};

type Employee = {
  id: string;
  name: string;
  permissionHours: number;
  departmentId?: string | null;
  department?: Department | null;
  createdAt: string;
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [permissionHours, setPermissionHours] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState('');
  const [editPermissionHours, setEditPermissionHours] = useState<number>(0);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees', { cache: 'no-store' });
      const data = await res.json();
      setEmployees(data);
    } catch (error) {
      console.error('Failed to fetch employees', error);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          departmentId: departmentId || null,
          permissionHours: Number(permissionHours) || 0,
        }),
      });
      if (res.ok) {
        setName('');
        setDepartmentId('');
        setPermissionHours(0);
        fetchEmployees();
      }
    } catch (error) {
      console.error('Failed to add employee', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchEmployees();
      }
    } catch (error) {
      console.error('Failed to delete employee', error);
    }
  };

  const startEditing = (emp: Employee) => {
    setEditingId(emp.id);
    setEditName(emp.name);
    setEditDepartmentId(emp.departmentId || '');
    setEditPermissionHours(emp.permissionHours || 0);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
    setEditDepartmentId('');
    setEditPermissionHours(0);
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;

    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          departmentId: editDepartmentId || null,
          permissionHours: Number(editPermissionHours) || 0,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchEmployees();
      }
    } catch (error) {
      console.error('Failed to update employee', error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Employee Management</h2>

      {/* Add New Employee Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8 w-full max-w-2xl">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Add New Employee</h3>
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Employee Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter employee name"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Permission Hours</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={permissionHours}
                onChange={(e) => setPermissionHours(Number(e.target.value))}
                placeholder="0"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center bg-blue-600 text-white py-2 px-5 rounded-md text-sm hover:bg-blue-700 transition-colors font-medium"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Employee
            </button>
          </div>
        </form>
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full max-w-4xl">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">Employee List</h3>
          <span className="text-xs text-gray-500 font-medium">Total: {employees.length}</span>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading employees...</div>
        ) : employees.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No employees found. Add one above.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {employees.map((emp) => (
              <li key={emp.id} className="p-5 flex items-center justify-between group hover:bg-gray-50">
                <div className="flex items-center flex-1">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4 shrink-0">
                    <User className="w-5 h-5" />
                  </div>

                  {editingId === emp.id ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1 mr-4">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Employee Name"
                        className="rounded-md border border-blue-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                        autoFocus
                      />
                      <select
                        value={editDepartmentId}
                        onChange={(e) => setEditDepartmentId(e.target.value)}
                        className="rounded-md border border-blue-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                      >
                        <option value="">No Department</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={editPermissionHours}
                        onChange={(e) => setEditPermissionHours(Number(e.target.value))}
                        placeholder="Permission Hours"
                        className="rounded-md border border-blue-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium text-gray-900">{emp.name}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          <Building2 className="w-3 h-3 mr-1 text-gray-500" />
                          {emp.department?.name || 'Unassigned'}
                        </span>
                        <span className="flex items-center text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
                          <Clock className="w-3 h-3 mr-1 text-amber-600" />
                          Permission: {emp.permissionHours || 0} hrs
                        </span>
                        <span>Added: {new Date(emp.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {editingId === emp.id ? (
                    <>
                      <button
                        onClick={() => handleUpdate(emp.id)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-md transition-colors"
                        title="Save"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="p-2 text-gray-500 hover:bg-gray-200 rounded-md transition-colors"
                        title="Cancel"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditing(emp)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
