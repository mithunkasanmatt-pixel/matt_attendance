'use client';

import { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, Check, X, Users, User } from 'lucide-react';

type Employee = {
  id: string;
  name: string;
  permissionHours: number;
};

type Department = {
  id: string;
  name: string;
  createdAt: string;
  employees: Employee[];
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setDepartments(data);
      }
    } catch (error) {
      console.error('Failed to fetch departments', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setErrorMsg('');

    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) {
        setName('');
        fetchDepartments();
      } else {
        setErrorMsg(data.error || 'Failed to add department');
      }
    } catch (error) {
      console.error('Failed to add department', error);
      setErrorMsg('Failed to add department');
    }
  };

  const handleDelete = async (id: string, empCount: number) => {
    const confirmMsg = empCount > 0
      ? `This department has ${empCount} employee(s). Deleting it will unassign these employees. Are you sure?`
      : 'Are you sure you want to delete this department?';

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/departments/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchDepartments();
      }
    } catch (error) {
      console.error('Failed to delete department', error);
    }
  };

  const startEditing = (dept: Department) => {
    setEditingId(dept.id);
    setEditName(dept.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;

    try {
      const res = await fetch(`/api/departments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditingId(null);
        fetchDepartments();
      } else {
        alert(data.error || 'Failed to update department');
      }
    } catch (error) {
      console.error('Failed to update department', error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Department Management</h2>

      {/* Add Department Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8 w-full max-w-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Add New Department</h3>
        <form onSubmit={handleAddDepartment} className="flex gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter department name (e.g. IT, HR)"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
            required
          />
          <button
            type="submit"
            className="flex items-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </button>
        </form>
        {errorMsg && <p className="text-sm text-red-600 mt-2">{errorMsg}</p>}
      </div>

      {/* Departments List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full max-w-4xl">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-700">Departments List</h3>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading departments...</div>
        ) : departments.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No departments found. Add one above.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {departments.map((dept) => (
              <div key={dept.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center flex-1">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
                      <Building2 className="w-5 h-5" />
                    </div>

                    {editingId === dept.id ? (
                      <div className="flex items-center gap-2 flex-1 max-w-md">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 rounded-md border border-blue-300 px-3 py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdate(dept.id)}
                          className="p-1.5 text-green-600 hover:bg-green-100 rounded-md transition-colors"
                          title="Save"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-md transition-colors"
                          title="Cancel"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">{dept.name}</h4>
                        <p className="text-xs text-gray-500">
                          {dept.employees.length} {dept.employees.length === 1 ? 'Employee' : 'Employees'}
                        </p>
                      </div>
                    )}
                  </div>

                  {editingId !== dept.id && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(dept)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                        title="Edit Department"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(dept.id, dept.employees.length)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                        title="Delete Department"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Associated Employees */}
                <div className="mt-4 pl-14">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    Associated Employees ({dept.employees.length})
                  </h5>
                  {dept.employees.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No employees assigned to this department yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {dept.employees.map((emp) => (
                        <div
                          key={emp.id}
                          className="flex items-center p-2.5 bg-gray-50 rounded-md border border-gray-100"
                        >
                          <div className="h-7 w-7 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center mr-2 text-xs font-semibold">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-800 truncate">{emp.name}</p>
                            <p className="text-xs text-gray-500">Permission: {emp.permissionHours} hrs</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
