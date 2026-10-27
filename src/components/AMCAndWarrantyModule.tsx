import React, { useState } from 'react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { Clock, ShieldCheck, AlertTriangle, Building2, CheckCircle2, Plus, Edit2, Trash2, X } from 'lucide-react';
import { Asset, AMCRecord } from '../types';
import { formatDate, calculateDaysRemaining, formatINR } from '../utils/formatters';

interface AMCAndWarrantyModuleProps {
  assets: Asset[];
  amcRecords: AMCRecord[];
  onSaveAMC?: (amc: AMCRecord) => Promise<void>;
  onDeleteAMC?: (id: string) => Promise<void>;
}

export const AMCAndWarrantyModule: React.FC<AMCAndWarrantyModuleProps> = ({
  assets,
  amcRecords,
  onSaveAMC,
  onDeleteAMC
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingAmc, setEditingAmc] = useState<Partial<AMCRecord> | null>(null);

  const handleOpenAdd = () => {
    const firstAsset = assets[0];
    const amcSeq = String((amcRecords?.length || 0) + 1).padStart(4, '0');
    setEditingAmc({
      id: `amc-${amcSeq}`,
      assetId: firstAsset?.id || '',
      assetTag: firstAsset?.assetTag || '',
      assetName: firstAsset?.particulars || '',
      vendorName: 'Voltas India Ltd',
      vendorContact: '+91 98480 12345',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      cost: 15000,
      status: 'Active',
      renewalNotes: 'Comprehensive maintenance with quarterly inspection'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (record: AMCRecord) => {
    setEditingAmc({ ...record });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAmc || !editingAmc.assetId || !editingAmc.vendorName) return;

    const selectedAsset = assets.find((a) => a.id === editingAmc.assetId);

    const fullRecord: AMCRecord = {
      id: editingAmc.id || `amc-${Date.now()}`,
      assetId: editingAmc.assetId,
      assetTag: selectedAsset?.assetTag || editingAmc.assetTag || '',
      assetName: selectedAsset?.particulars || editingAmc.assetName || '',
      vendorName: editingAmc.vendorName || '',
      vendorContact: editingAmc.vendorContact || '',
      startDate: editingAmc.startDate || new Date().toISOString().split('T')[0],
      endDate: editingAmc.endDate || new Date().toISOString().split('T')[0],
      cost: Number(editingAmc.cost) || 0,
      status: (editingAmc.status as any) || 'Active',
      renewalNotes: editingAmc.renewalNotes || ''
    };

    if (onSaveAMC) {
      await onSaveAMC(fullRecord);
    }
    setShowModal(false);
    setEditingAmc(null);
  };

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

  const handleDelete = (id: string) => {
    const amc = amcRecords.find(a => a.id === id);
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete AMC Contract Record',
      message: `Are you sure you want to delete AMC contract for "${amc?.assetName || amc?.assetTag || 'Asset'}" with vendor "${amc?.vendorName || 'Vendor'}"?`,
      onConfirm: async () => {
        if (onDeleteAMC) {
          await onDeleteAMC(id);
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
            <Clock className="w-6 h-6 text-rose-400" />
            <span>Annual Maintenance Contracts (AMC) & Warranty Tracking</span>
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">Automated compliance reminders for expiring equipment warranties and vendor service contracts</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New AMC Contract</span>
        </button>
      </div>

      {/* Logged AMC Contracts Master Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h2 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Active AMC Vendor Contracts ({amcRecords.length})</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-700/80">
                <th className="py-3 px-4">Asset Tag / Particulars</th>
                <th className="py-3 px-4">AMC Vendor & Contact</th>
                <th className="py-3 px-4">Contract Period</th>
                <th className="py-3 px-4">Annual Cost</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {amcRecords.map((amc) => {
                const days = calculateDaysRemaining(amc.endDate);
                return (
                  <tr key={amc.id} className="hover:bg-slate-800/50 transition-colors text-slate-300">
                    <td className="py-3 px-4 font-bold text-slate-100">
                      <p className="font-mono text-amber-400 text-[11px]">{amc.assetTag}</p>
                      <p>{amc.assetName}</p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-200">{amc.vendorName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{amc.vendorContact}</p>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <p className="text-slate-200">{formatDate(amc.startDate)} - {formatDate(amc.endDate)}</p>
                      <span className={`text-[10px] font-bold ${days.status === 'Expired' ? 'text-rose-400' : days.status === 'Urgent' ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {days.status === 'Expired' ? 'Contract Expired' : `${days.days} days remaining`}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {formatINR(amc.cost)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        amc.status === 'Active'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : amc.status === 'Expiring Soon'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {amc.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(amc)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer transition-colors"
                          title="Edit AMC Record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(amc.id)}
                          className="p-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg cursor-pointer transition-colors"
                          title="Delete AMC Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {amcRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No active AMC vendor contracts recorded. Click "New AMC Contract" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Warranty Compliance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 space-y-4">
        <h2 className="font-bold text-slate-100 text-sm flex items-center gap-2 border-b border-slate-800 pb-2">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>Asset Warranty Compliance Register</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-700/80">
                <th className="py-3 px-4">Asset Tag / Name</th>
                <th className="py-3 px-4">Warranty End Date</th>
                <th className="py-3 px-4">AMC Vendor</th>
                <th className="py-3 px-4">AMC End Date</th>
                <th className="py-3 px-4 text-center">Compliance Alert Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {assets.map((a) => {
                const wDays = calculateDaysRemaining(a.warrantyEnd);
                const amcDays = calculateDaysRemaining(a.amcEnd);

                return (
                  <tr key={a.id} className="hover:bg-slate-800/50 transition-colors text-slate-300">
                    <td className="py-3 px-4 font-bold text-slate-100">
                      <p className="font-mono text-amber-400 text-[11px]">{a.assetTag}</p>
                      <p>{a.particulars}</p>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <p className="text-slate-200">{formatDate(a.warrantyEnd)}</p>
                      <span className={`text-[10px] font-bold ${wDays.status === 'Expired' ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {wDays.status === 'Expired' ? 'Expired' : `${wDays.days} days left`}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-200">{a.amcVendor || 'Not Assigned'}</p>
                      {a.amcCost && <p className="font-mono text-slate-400 text-[10px]">{formatINR(a.amcCost)} / yr</p>}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <p className="text-slate-200">{formatDate(a.amcEnd)}</p>
                      <span className={`text-[10px] font-bold ${amcDays.status === 'Expired' ? 'text-rose-400' : amcDays.status === 'Urgent' ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {amcDays.status === 'Expired' ? 'Expired' : `${amcDays.days} days left`}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {amcDays.status === 'Urgent' || wDays.status === 'Expired' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Renewal Attention Required
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Covered & Valid
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT AMC MODAL */}
      {showModal && editingAmc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>{editingAmc.id ? 'Edit AMC Vendor Contract' : 'New AMC Vendor Contract'}</span>
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Select Target Asset *</label>
                <select
                  value={editingAmc.assetId || ''}
                  onChange={(e) => {
                    const sel = assets.find((a) => a.id === e.target.value);
                    setEditingAmc({
                      ...editingAmc,
                      assetId: e.target.value,
                      assetTag: sel?.assetTag || '',
                      assetName: sel?.particulars || ''
                    });
                  }}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.particulars} ({a.assetTag})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">AMC Vendor Name *</label>
                  <input
                    type="text"
                    required
                    value={editingAmc.vendorName || ''}
                    onChange={(e) => setEditingAmc({ ...editingAmc, vendorName: e.target.value })}
                    placeholder="Vendor Name"
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Vendor Contact Phone / Email</label>
                  <input
                    type="text"
                    value={editingAmc.vendorContact || ''}
                    onChange={(e) => setEditingAmc({ ...editingAmc, vendorContact: e.target.value })}
                    placeholder="+91 98480 00000"
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={editingAmc.startDate || ''}
                    onChange={(e) => setEditingAmc({ ...editingAmc, startDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">End Date *</label>
                  <input
                    type="date"
                    required
                    value={editingAmc.endDate || ''}
                    onChange={(e) => setEditingAmc({ ...editingAmc, endDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Annual Cost (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editingAmc.cost || 0}
                    onChange={(e) => setEditingAmc({ ...editingAmc, cost: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Status *</label>
                  <select
                    value={editingAmc.status || 'Active'}
                    onChange={(e) => setEditingAmc({ ...editingAmc, status: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2"
                  >
                    <option value="Active">Active</option>
                    <option value="Expiring Soon">Expiring Soon</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Renewal Notes</label>
                  <input
                    type="text"
                    value={editingAmc.renewalNotes || ''}
                    onChange={(e) => setEditingAmc({ ...editingAmc, renewalNotes: e.target.value })}
                    placeholder="Inspection frequency, terms..."
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer shadow-md"
                >
                  Save AMC Record
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

