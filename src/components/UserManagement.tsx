import React, { useState } from 'react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Upload,
  Edit2,
  Trash2,
  Shield,
  Building,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  X,
  Lock,
  UserCheck,
  Layers,
  CheckSquare,
  Square
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { User, UserRole, Organization, Campus, Department } from '../types';
import { ALL_PAGES, getDefaultPagesForRole, getUserAllowedPages } from '../utils/permissions';
import { NavTab } from './Sidebar';

interface UserManagementProps {
  users: User[];
  organizations: Organization[];
  campuses: Campus[];
  departments: Department[];
  onSaveUser: (user: User) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onBulkImportUsers: (users: User[]) => Promise<void>;
}

const USER_ROLES: UserRole[] = [
  'Super Admin',
  'Organization Admin',
  'Campus Admin',
  'Department Admin',
  'Store Keeper',
  'Asset Verifier',
  'Auditor',
  'Principal',
  'Viewer'
];

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  organizations,
  campuses,
  departments,
  onSaveUser,
  onDeleteUser,
  onBulkImportUsers
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [orgFilter, setOrgFilter] = useState<string>('ALL');

  React.useEffect(() => {
    if (organizations.length === 1) {
      setOrgFilter(organizations[0].id);
    } else {
      setOrgFilter('ALL');
    }
  }, [organizations]);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<User[]>([]);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Open Form for Create / Edit
  const handleOpenCreate = () => {
    const defaultRole: UserRole = 'Store Keeper';
    setEditingUser({
      id: `usr-${Date.now()}`,
      name: '',
      email: '',
      role: defaultRole,
      organizationId: organizations[0]?.id || '',
      campusId: campuses[0]?.id || '',
      departmentId: departments[0]?.id || '',
      allowedPages: getDefaultPagesForRole(defaultRole)
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser({
      ...user,
      allowedPages: getUserAllowedPages(user)
    });
    setIsModalOpen(true);
  };

  const togglePagePermission = (pageId: NavTab) => {
    if (!editingUser) return;
    const current = (editingUser.allowedPages as NavTab[]) || getDefaultPagesForRole(editingUser.role || 'Viewer');
    const updated = current.includes(pageId)
      ? current.filter((p) => p !== pageId)
      : [...current, pageId];
    setEditingUser({ ...editingUser, allowedPages: updated });
  };

  const handleSelectAllPages = () => {
    if (!editingUser) return;
    setEditingUser({ ...editingUser, allowedPages: ALL_PAGES.map((p) => p.id) });
  };

  const handleClearAllPages = () => {
    if (!editingUser) return;
    setEditingUser({ ...editingUser, allowedPages: [] });
  };

  const handleResetRoleDefaults = () => {
    if (!editingUser) return;
    setEditingUser({ ...editingUser, allowedPages: getDefaultPagesForRole(editingUser.role || 'Viewer') });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editingUser.name || !editingUser.email) return;

    await onSaveUser(editingUser as User);
    setIsModalOpen(false);
    setEditingUser(null);
  };

  // Excel Bulk Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json<any>(ws);

        const parsedUsers: User[] = rawData.map((row: any, idx: number) => {
          const matchedOrg = organizations.find(
            (o) => o.shortCode.toLowerCase() === (row.Organization || '').toLowerCase() || o.name.toLowerCase().includes((row.Organization || '').toLowerCase())
          );
          return {
            id: `usr-imp-${Date.now()}-${idx}`,
            name: row.Name || row.FullName || 'Unnamed User',
            email: row.Email || `user${idx}@amararaja.com`,
            role: (USER_ROLES.includes(row.Role as UserRole) ? row.Role : 'Viewer') as UserRole,
            organizationId: matchedOrg?.id || organizations[0]?.id || '',
            avatar: row.Avatar || undefined
          };
        });

        setImportPreview(parsedUsers);
      } catch (err) {
        alert('Failed to parse Excel file. Please ensure valid format.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    if (importPreview.length === 0) return;
    await onBulkImportUsers(importPreview);
    setIsImportModalOpen(false);
    setImportFile(null);
    setImportPreview([]);
  };

  // Export Users to Excel
  const handleExportUsers = () => {
    const exportData = users.map((u) => {
      const org = organizations.find((o) => o.id === u.organizationId);
      const cmp = campuses.find((c) => c.id === u.campusId);
      const dpt = departments.find((d) => d.id === u.departmentId);

      return {
        'User ID': u.id,
        'Full Name': u.name,
        'Email Address': u.email,
        'System Role': u.role,
        'Organization': org ? `${org.name} (${org.shortCode})` : 'All Orgs',
        'Campus': cmp ? cmp.name : 'N/A',
        'Department': dpt ? dpt.name : 'N/A'
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'System Users');
    XLSX.writeFile(wb, `Amara_Raja_EAMS_Users_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesOrg = orgFilter === 'ALL' || u.organizationId === orgFilter;

    return matchesSearch && matchesRole && matchesOrg;
  });

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'Organization Admin':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Campus Admin':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Department Admin':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'Store Keeper':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Asset Verifier':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
      case 'Auditor':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">User Management & Security Access Control</h1>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Manage multi-tenant SAP-style Enterprise roles, organization access, store keepers, and asset auditors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Import Users (Excel)</span>
          </button>

          <button
            onClick={handleExportUsers}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export Users</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* Role Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Users</p>
          <p className="text-xl font-extrabold text-white mt-0.5">{users.length}</p>
        </div>
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
          <p className="text-[11px] font-semibold text-rose-400 uppercase">Super Admins</p>
          <p className="text-xl font-extrabold text-white mt-0.5">{users.filter((u) => u.role === 'Super Admin').length}</p>
        </div>
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
          <p className="text-[11px] font-semibold text-amber-400 uppercase">Org Admins</p>
          <p className="text-xl font-extrabold text-white mt-0.5">{users.filter((u) => u.role === 'Organization Admin').length}</p>
        </div>
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
          <p className="text-[11px] font-semibold text-emerald-400 uppercase">Store Keepers</p>
          <p className="text-xl font-extrabold text-white mt-0.5">{users.filter((u) => u.role === 'Store Keeper').length}</p>
        </div>
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
          <p className="text-[11px] font-semibold text-purple-400 uppercase">Asset Verifiers</p>
          <p className="text-xl font-extrabold text-white mt-0.5">{users.filter((u) => u.role === 'Asset Verifier').length}</p>
        </div>
      </div>

      {/* Controls Bar: Search & Filters */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search user name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Roles</option>
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Building className="w-3.5 h-3.5" />
            <span>Org Scope:</span>
            <select
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              disabled={organizations.length === 1}
              className="bg-slate-950 border border-slate-800 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {organizations.length > 1 && <option value="ALL">All Organizations</option>}
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.shortCode} - {org.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* User Master Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-4">User Details</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">Organization Scope</th>
                <th className="p-4">Module Permissions</th>
                <th className="p-4">System ID</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                    No matching users found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const org = organizations.find((o) => o.id === user.organizationId);
                  const campus = campuses.find((c) => c.id === user.campusId);
                  const allowedList = getUserAllowedPages(user);

                  return (
                    <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              user.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0f172a&color=f59e0b`
                            }
                            alt={user.name}
                            className="w-9 h-9 rounded-full border border-slate-700 object-cover"
                          />
                          <div>
                            <p className="font-bold text-white text-sm">{user.name}</p>
                            <p className="text-slate-400 text-[11px]">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${getRoleBadgeColor(user.role)}`}>
                          <Shield className="w-3 h-3" />
                          {user.role}
                        </span>
                      </td>

                      <td className="p-4">
                        {org ? (
                          <div>
                            <p className="font-semibold text-amber-300">{org.name}</p>
                            <p className="text-slate-400 text-[10px]">
                              {campus ? campus.name : 'All Campuses'}
                            </p>
                          </div>
                        ) : (
                          <span className="text-emerald-400 font-bold text-[11px]">Global Scope (All Orgs)</span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-slate-800 border border-slate-700 text-amber-300 font-extrabold px-2 py-0.5 rounded text-[11px]">
                            {allowedList.length} / {ALL_PAGES.length} Modules
                          </span>
                          {allowedList.length === ALL_PAGES.length && (
                            <span className="text-[10px] text-emerald-400 font-bold">Full Access</span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-slate-400 font-mono text-[11px]">{user.id}</td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Edit User & Permissions"
                          >
                            <Edit2 className="w-4 h-4 text-amber-400" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteConfirm({
                                isOpen: true,
                                title: `Delete User "${user.name}"`,
                                message: `Are you sure you want to remove user "${user.name}" (${user.email})?`,
                                onConfirm: () => onDeleteUser(user.id)
                              });
                            }}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4 text-rose-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT USER MODAL */}
      {isModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950 shrink-0">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">
                  {users.some((u) => u.id === editingUser.id) ? 'Edit User Profile & Module Access' : 'Create New System User'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editingUser.name || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    placeholder="E.g. S. Ramakrishna"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    placeholder="E.g. ramakrishna@amararaja.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">System Role *</label>
                  <select
                    value={editingUser.role || 'Store Keeper'}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
                      setEditingUser({
                        ...editingUser,
                        role: newRole,
                        allowedPages: getDefaultPagesForRole(newRole)
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {USER_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Organization Scope</label>
                  <select
                    value={editingUser.organizationId || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, organizationId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">All Organizations (Global Admin)</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.shortCode} - {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {editingUser.organizationId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Campus Scope</label>
                  <select
                    value={editingUser.campusId || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, campusId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">All Campuses in Org</option>
                    {campuses
                      .filter((c) => c.organizationId === editingUser.organizationId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* MODULE PERMISSIONS & PAGE ACCESSIBILITY SELECTION */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-2">
                  <div>
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Layers className="w-4 h-4" /> Custom Page Access & Module Permissions
                    </span>
                    <p className="text-[10px] text-slate-400">
                      Select which navigation pages this user is allowed to access in EAMS.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetRoleDefaults}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-300 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
                    >
                      Reset Role Defaults
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectAllPages}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-emerald-400 px-2 py-1 rounded-lg border border-slate-700 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllPages}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-rose-400 px-2 py-1 rounded-lg border border-slate-700 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {ALL_PAGES.map((pg) => {
                    const allowedList = (editingUser.allowedPages as NavTab[]) || [];
                    const isChecked = allowedList.includes(pg.id);

                    return (
                      <div
                        key={pg.id}
                        onClick={() => togglePagePermission(pg.id)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-start gap-2.5 transition-all ${
                          isChecked
                            ? 'bg-amber-500/10 border-amber-500/50 text-white'
                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="mt-0.5">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                        <div>
                          <p className={`font-bold ${isChecked ? 'text-amber-300' : 'text-slate-300'}`}>
                            {pg.label}
                          </p>
                          <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                            {pg.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Avatar Image URL (Optional)</label>
                <input
                  type="text"
                  value={editingUser.avatar || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, avatar: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  Save User Profile & Permissions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXCEL IMPORT USER MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">Import Users from Excel File</h2>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-6 text-center bg-slate-950/50 transition-colors">
                <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-300 mb-1">
                  Upload Excel (.xlsx / .csv) file with Columns: <span className="text-amber-400">Name, Email, Role, Organization</span>
                </p>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="excel-user-upload"
                />
                <label
                  htmlFor="excel-user-upload"
                  className="mt-3 inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Browse File
                </label>
                {importFile && (
                  <p className="text-xs text-emerald-400 font-mono mt-2">{importFile.name}</p>
                )}
              </div>

              {importPreview.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-300">
                    Preview Parsed Users ({importPreview.length} found):
                  </p>
                  <div className="max-h-40 overflow-y-auto border border-slate-800 rounded-lg p-2 bg-slate-950 space-y-1">
                    {importPreview.map((u, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] p-1.5 hover:bg-slate-900 rounded">
                        <span className="font-bold text-white">{u.name}</span>
                        <span className="text-slate-400 font-mono">{u.email}</span>
                        <span className="text-amber-400 font-semibold">{u.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={importPreview.length === 0}
                  onClick={handleConfirmImport}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Import {importPreview.length} Users
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        onConfirm={deleteConfirm.onConfirm}
        onClose={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
