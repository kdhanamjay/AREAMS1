import React, { useState } from 'react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  Wrench,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  FileText,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import { Asset, RepairRecord } from '../types';
import { formatINR, formatDate } from '../utils/formatters';

interface RepairMaintenanceModuleProps {
  repairs: RepairRecord[];
  assets: Asset[];
  onSaveRepair: (repair: RepairRecord) => Promise<void>;
  onDeleteRepair?: (id: string) => Promise<void>;
}

export const RepairMaintenanceModule: React.FC<RepairMaintenanceModuleProps> = ({
  repairs,
  assets,
  onSaveRepair,
  onDeleteRepair
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingRepair, setEditingRepair] = useState<Partial<RepairRecord> | null>(null);

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

  const handleOpenAdd = () => {
    const firstAsset = assets[0];
    const repSeq = String((repairs?.length || 0) + 1).padStart(4, '0');
    setEditingRepair({
      id: `rep-${repSeq}`,
      assetId: firstAsset?.id || '',
      assetTag: firstAsset?.assetTag || '',
      assetName: firstAsset?.particulars || '',
      complaintDate: new Date().toISOString().split('T')[0],
      issueDescription: '',
      vendorName: 'Daikin Service / Dell Care',
      estimatedCost: 5000,
      actualCost: 5000,
      repairStatus: 'In Progress',
      technicianNotes: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (record: RepairRecord) => {
    setEditingRepair({ ...record });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRepair || !editingRepair.assetId || !editingRepair.issueDescription) return;

    const targetAsset = assets.find((a) => a.id === editingRepair.assetId);

    const fullRecord: RepairRecord = {
      id: editingRepair.id || `rep-${Date.now()}`,
      assetId: editingRepair.assetId,
      assetTag: targetAsset?.assetTag || editingRepair.assetTag || '',
      assetName: targetAsset?.particulars || editingRepair.assetName || '',
      complaintDate: editingRepair.complaintDate || new Date().toISOString().split('T')[0],
      issueDescription: editingRepair.issueDescription || '',
      vendorName: editingRepair.vendorName || 'General Maintenance',
      estimatedCost: Number(editingRepair.estimatedCost) || 0,
      actualCost: Number(editingRepair.actualCost) || Number(editingRepair.estimatedCost) || 0,
      repairStatus: (editingRepair.repairStatus as any) || 'In Progress',
      technicianNotes: editingRepair.technicianNotes || '',
      repairedDate: editingRepair.repairStatus === 'Repaired' ? (editingRepair.repairedDate || new Date().toISOString().split('T')[0]) : undefined
    };

    await onSaveRepair(fullRecord);
    setShowModal(false);
    setEditingRepair(null);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Repair Record',
      message: 'Are you sure you want to delete this repair record?',
      onConfirm: async () => {
        if (onDeleteRepair) {
          await onDeleteRepair(id);
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-amber-400" />
            <span>Asset Repair & Maintenance Management</span>
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">Track breakdown complaints, repair costs, vendor performance & maintenance history</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Log Repair Complaint</span>
        </button>
      </div>

      {/* Repairs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-700/80">
                <th className="py-3 px-4">Asset Tag / Name</th>
                <th className="py-3 px-4">Complaint Date</th>
                <th className="py-3 px-4">Issue Description</th>
                <th className="py-3 px-4">Vendor & Cost</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {repairs.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/50 transition-colors text-slate-300">
                  <td className="py-3 px-4 font-bold text-slate-100">
                    <p className="font-mono text-amber-400 text-[11px]">{r.assetTag}</p>
                    <p>{r.assetName}</p>
                  </td>

                  <td className="py-3 px-4 text-slate-300">
                    {formatDate(r.complaintDate)}
                  </td>

                  <td className="py-3 px-4">
                    <p className="text-slate-200">{r.issueDescription}</p>
                    {r.technicianNotes && <p className="text-[10px] text-slate-400">Notes: {r.technicianNotes}</p>}
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-200">{r.vendorName}</p>
                    <p className="font-mono font-bold text-emerald-400">{formatINR(r.actualCost || r.estimatedCost)}</p>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      r.repairStatus === 'Repaired'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : r.repairStatus === 'In Progress'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {r.repairStatus}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(r)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer transition-colors"
                        title="Edit Repair Record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg cursor-pointer transition-colors"
                        title="Delete Repair Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {repairs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No active repair complaints logged.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT REPAIR MODAL */}
      {showModal && editingRepair && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" />
                <span>{editingRepair.id ? 'Edit Repair Complaint' : 'Log Repair Complaint Ticket'}</span>
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Select Asset *</label>
                <select
                  value={editingRepair.assetId || ''}
                  onChange={(e) => {
                    const target = assets.find(a => a.id === e.target.value);
                    setEditingRepair({
                      ...editingRepair,
                      assetId: e.target.value,
                      assetTag: target?.assetTag || '',
                      assetName: target?.particulars || ''
                    });
                  }}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.assetTag} - {a.particulars}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Issue Description *</label>
                <textarea
                  rows={2}
                  required
                  value={editingRepair.issueDescription || ''}
                  onChange={(e) => setEditingRepair({ ...editingRepair, issueDescription: e.target.value })}
                  placeholder="Describe breakdown symptoms, noise, component failure..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Assigned Vendor</label>
                  <input
                    type="text"
                    value={editingRepair.vendorName || ''}
                    onChange={(e) => setEditingRepair({ ...editingRepair, vendorName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Repair Status</label>
                  <select
                    value={editingRepair.repairStatus || 'In Progress'}
                    onChange={(e) => setEditingRepair({ ...editingRepair, repairStatus: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Repaired">Repaired</option>
                    <option value="Unrepairable">Unrepairable</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Estimated Cost (₹)</label>
                  <input
                    type="number"
                    value={editingRepair.estimatedCost || 0}
                    onChange={(e) => setEditingRepair({ ...editingRepair, estimatedCost: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Actual Cost (₹)</label>
                  <input
                    type="number"
                    value={editingRepair.actualCost || 0}
                    onChange={(e) => setEditingRepair({ ...editingRepair, actualCost: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Technician Notes</label>
                <input
                  type="text"
                  value={editingRepair.technicianNotes || ''}
                  onChange={(e) => setEditingRepair({ ...editingRepair, technicianNotes: e.target.value })}
                  placeholder="Parts replaced, warranty invoice ref..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Save Repair Record
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
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

