import React, { useState } from 'react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  Building2,
  Building,
  MapPin,
  Layers,
  Home,
  Plus,
  Users,
  CheckCircle2,
  Edit,
  Trash2
} from 'lucide-react';
import { Organization, Campus, Building as BuildingType, Floor, Room, Department } from '../types';

interface OrgMasterProps {
  organizations: Organization[];
  campuses: Campus[];
  buildings: BuildingType[];
  floors: Floor[];
  rooms: Room[];
  departments: Department[];
  onSaveOrg: (org: Organization) => Promise<void>;
  onDeleteOrg?: (id: string) => Promise<void>;
  onSaveCampus: (cmp: Campus) => Promise<void>;
  onSaveBuilding: (bld: BuildingType) => Promise<void>;
  onSaveRoom: (rm: Room) => Promise<void>;
  onSaveDepartment: (dept: Department) => Promise<void>;
}

export const OrgMaster: React.FC<OrgMasterProps> = ({
  organizations,
  campuses,
  buildings,
  floors,
  rooms,
  departments,
  onSaveOrg,
  onDeleteOrg,
  onSaveCampus,
  onSaveBuilding,
  onSaveRoom,
  onSaveDepartment
}) => {
  const [activeTab, setActiveTab] = useState<'orgs' | 'campuses' | 'buildings' | 'rooms' | 'departments'>('orgs');

  const [showOrgModal, setShowOrgModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

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
  const [newOrg, setNewOrg] = useState<Partial<Organization>>({
    name: '',
    shortCode: '',
    address: '',
    gstNumber: '37AAAAA0000A1Z5',
    email: 'info@amararaja.com',
    phone: '+91 8572 273201',
    status: 'Active'
  });

  const handleAddOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOrg) {
      const updatedOrg: Organization = {
        ...editingOrg,
        name: newOrg.name || editingOrg.name,
        shortCode: newOrg.shortCode || editingOrg.shortCode,
        address: newOrg.address || editingOrg.address,
        gstNumber: newOrg.gstNumber || editingOrg.gstNumber,
        email: newOrg.email || editingOrg.email,
        phone: newOrg.phone || editingOrg.phone,
        status: (newOrg.status as 'Active' | 'Inactive') || editingOrg.status
      };
      await onSaveOrg(updatedOrg);
    } else {
      const fullOrg: Organization = {
        ...(newOrg as Organization),
        id: `org-${Date.now()}`,
        createdDate: new Date().toISOString().split('T')[0]
      };
      await onSaveOrg(fullOrg);
    }
    setShowOrgModal(false);
    setEditingOrg(null);
  };

  const openEditOrgModal = (org: Organization) => {
    setEditingOrg(org);
    setNewOrg({
      name: org.name,
      shortCode: org.shortCode,
      address: org.address,
      gstNumber: org.gstNumber,
      email: org.email,
      phone: org.phone,
      status: org.status
    });
    setShowOrgModal(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-400" />
            <span>Organizational & Location Hierarchy Master</span>
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">Manage Organizations, Campuses, Buildings, Floors, Rooms & Departments dynamically</p>
        </div>

        <button
          onClick={() => {
            setEditingOrg(null);
            setNewOrg({
              name: '',
              shortCode: '',
              address: '',
              gstNumber: '37AAAAA0000A1Z5',
              email: 'info@amararaja.com',
              phone: '+91 8572 273201',
              status: 'Active'
            });
            setShowOrgModal(true);
          }}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Organization</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 text-xs">
        {[
          { id: 'orgs', label: `Organizations (${organizations.length})`, icon: Building2 },
          { id: 'campuses', label: `Campuses (${campuses.length})`, icon: MapPin },
          { id: 'buildings', label: `Buildings (${buildings.length})`, icon: Building },
          { id: 'rooms', label: `Rooms & Labs (${rooms.length})`, icon: Home },
          { id: 'departments', label: `Departments (${departments.length})`, icon: Users }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 font-bold border-b-2 transition-all cursor-pointer ${
                isActive ? 'border-amber-500 text-amber-400 bg-slate-900/50' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ORGANIZATIONS TAB */}
      {activeTab === 'orgs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((org) => (
            <div key={org.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 relative group">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                  {org.shortCode}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                    {org.status}
                  </span>
                  <button
                    onClick={() => openEditOrgModal(org)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                    title="Edit Organization Name & Details"
                  >
                    <Edit className="w-3.5 h-3.5 text-amber-400" />
                    <span>Edit</span>
                  </button>
                  {onDeleteOrg && (
                    <button
                      onClick={() => {
                        setDeleteConfirm({
                          isOpen: true,
                          title: `Delete Organization "${org.name}"`,
                          message: `Are you sure you want to delete organization "${org.name}" (${org.shortCode})? This action cannot be undone.`,
                          onConfirm: () => onDeleteOrg(org.id)
                        });
                      }}
                      className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg border border-rose-500/30 cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                      title="Delete Organization"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
              <h3 className="font-bold text-white text-base">{org.name}</h3>
              <p className="text-slate-400 text-xs">{org.address}</p>

              <div className="text-[11px] text-slate-300 pt-2 border-t border-slate-800 space-y-1">
                <p><strong className="text-slate-400">GST #:</strong> {org.gstNumber}</p>
                <p><strong className="text-slate-400">Email:</strong> {org.email}</p>
                <p><strong className="text-slate-400">Phone:</strong> {org.phone}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CAMPUSES TAB */}
      {activeTab === 'campuses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campuses.map((cmp) => {
            const parentOrg = organizations.find((o) => o.id === cmp.organizationId);
            return (
              <div key={cmp.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-blue-400 text-xs">{cmp.code}</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">{parentOrg?.shortCode}</span>
                </div>
                <h3 className="font-bold text-white text-sm">{cmp.name}</h3>
                <p className="text-slate-400 text-xs">{cmp.address}, {cmp.city}, {cmp.state}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* BUILDINGS TAB */}
      {activeTab === 'buildings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buildings.map((bld) => (
            <div key={bld.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
              <span className="font-mono font-bold text-emerald-400 text-xs">{bld.code}</span>
              <h3 className="font-bold text-white text-sm">{bld.name}</h3>
              <p className="text-slate-400 text-xs">Type: {bld.buildingType}</p>
            </div>
          ))}
        </div>
      )}

      {/* ROOMS TAB */}
      {activeTab === 'rooms' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {rooms.map((rm) => (
            <div key={rm.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-1">
              <span className="text-amber-400 font-mono font-bold text-xs">{rm.roomNumber}</span>
              <p className="font-bold text-white text-xs">{rm.name}</p>
              <p className="text-[10px] text-slate-400">Type: {rm.roomType} (Capacity: {rm.capacity || 0})</p>
            </div>
          ))}
        </div>
      )}

      {/* DEPARTMENTS TAB */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div key={dept.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
              <span className="font-mono font-bold text-amber-400 text-xs">{dept.code}</span>
              <h3 className="font-bold text-white text-sm">{dept.name}</h3>
              <p className="text-slate-400 text-xs">HOD: <strong className="text-slate-200">{dept.hodName}</strong></p>
            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT ORG MODAL */}
      {showOrgModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <span>{editingOrg ? `Edit Organization: ${editingOrg.name}` : 'Create New Organization'}</span>
              </h2>
              <button onClick={() => setShowOrgModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddOrg} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Organization Name *</label>
                <input
                  type="text"
                  required
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  placeholder="e.g. Amara Raja Vidya Niketan (ARVD)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Short Code *</label>
                  <input
                    type="text"
                    required
                    value={newOrg.shortCode}
                    onChange={(e) => setNewOrg({ ...newOrg, shortCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. ARVD"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Status *</label>
                  <select
                    value={newOrg.status || 'Active'}
                    onChange={(e) => setNewOrg({ ...newOrg, status: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">GST Number</label>
                <input
                  type="text"
                  value={newOrg.gstNumber || ''}
                  onChange={(e) => setNewOrg({ ...newOrg, gstNumber: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Email</label>
                  <input
                    type="email"
                    value={newOrg.email || ''}
                    onChange={(e) => setNewOrg({ ...newOrg, email: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Phone</label>
                  <input
                    type="text"
                    value={newOrg.phone || ''}
                    onChange={(e) => setNewOrg({ ...newOrg, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Address *</label>
                <textarea
                  rows={2}
                  required
                  value={newOrg.address}
                  onChange={(e) => setNewOrg({ ...newOrg, address: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOrgModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {editingOrg ? 'Save Organization Changes' : 'Create Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
