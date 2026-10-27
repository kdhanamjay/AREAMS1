import React, { useState } from 'react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  ArrowRightLeft,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  MapPin,
  FileText,
  UserCheck,
  Trash2
} from 'lucide-react';
import { Asset, Organization, Campus, Building as BuildingType, Room, AssetTransfer } from '../types';
import { formatDate } from '../utils/formatters';
import { LocationCascadingSelect } from './common/LocationCascadingSelect';
import { SearchableSelect, SelectOption } from './common/SearchableSelect';

interface AssetTransferModuleProps {
  transfers: AssetTransfer[];
  assets: Asset[];
  organizations: Organization[];
  campuses: Campus[];
  buildings: BuildingType[];
  rooms: Room[];
  preSelectedAsset?: Asset | null;
  onRequestTransfer: (transfer: AssetTransfer) => Promise<void>;
  onUpdateTransferStatus: (id: string, status: 'Approved' | 'Rejected', approvedBy: string) => Promise<void>;
  onDeleteTransfer?: (id: string) => Promise<void>;
}

export const AssetTransferModule: React.FC<AssetTransferModuleProps> = ({
  transfers,
  assets,
  organizations,
  campuses,
  buildings,
  rooms,
  preSelectedAsset,
  onRequestTransfer,
  onUpdateTransferStatus,
  onDeleteTransfer
}) => {
  const [showModal, setShowModal] = useState(!!preSelectedAsset);
  const [selectedAssetId, setSelectedAssetId] = useState(preSelectedAsset?.id || assets[0]?.id || '');

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
  
  const targetAsset = assets.find((a) => a.id === selectedAssetId);

  const [toOrgId, setToOrgId] = useState(organizations[0]?.id || '');
  const [toCampusId, setToCampusId] = useState(campuses[0]?.id || '');
  const [toBuildingId, setToBuildingId] = useState(buildings[0]?.id || '');
  const [toRoomId, setToRoomId] = useState(rooms[0]?.id || '');
  const [transferReason, setTransferReason] = useState('');
  const [gatePassNotes, setGatePassNotes] = useState('');

  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAsset) return;

    const trfSeq = String((transfers?.length || 0) + 1).padStart(4, '0');
    const newTransfer: AssetTransfer = {
      id: `trf-${trfSeq}`,
      assetId: targetAsset.id,
      assetTag: targetAsset.assetTag,
      assetName: targetAsset.particulars,
      fromOrganizationId: targetAsset.organizationId,
      fromCampusId: targetAsset.campusId,
      fromBuildingId: targetAsset.buildingId,
      fromRoomId: targetAsset.roomId,
      toOrganizationId: toOrgId,
      toCampusId,
      toBuildingId,
      toRoomId,
      transferReason,
      requestedBy: 'Store Keeper',
      requestedDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
      notes: gatePassNotes
    };

    await onRequestTransfer(newTransfer);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-blue-400" />
            <span>Asset Movement & Inter-Org Transfer Requests</span>
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">Manage transfers between Rooms, Buildings, Campuses & Amara Raja Group Organizations</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Asset Transfer Request</span>
        </button>
      </div>

      {/* Transfer History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-700/80">
                <th className="py-3 px-4">Asset Tag / Name</th>
                <th className="py-3 px-4">Source Location</th>
                <th className="py-3 px-4">Destination Location</th>
                <th className="py-3 px-4">Reason & Notes</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {transfers.map((t) => {
                const fromOrg = organizations.find((o) => o.id === t.fromOrganizationId);
                const toOrg = organizations.find((o) => o.id === t.toOrganizationId);

                return (
                  <tr key={t.id} className="hover:bg-slate-800/50 transition-colors text-slate-300">
                    <td className="py-3 px-4 font-bold text-slate-100">
                      <p className="text-amber-400 font-mono text-[11px]">{t.assetTag}</p>
                      <p>{t.assetName}</p>
                      <p className="text-[10px] text-slate-400">Requested: {formatDate(t.requestedDate)} by {t.requestedBy}</p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-200">{fromOrg?.shortCode || 'ORG'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">From Room: {t.fromRoomId}</p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-blue-400">{toOrg?.shortCode || 'ORG'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">To Room: {t.toRoomId}</p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="text-slate-200">{t.transferReason}</p>
                      {t.notes && <p className="text-[10px] text-slate-400">Notes: {t.notes}</p>}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'Approved'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : t.status === 'Rejected'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {t.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {t.status === 'Pending' ? (
                          <>
                            <button
                              onClick={() => onUpdateTransferStatus(t.id, 'Approved', 'Super Admin')}
                              className="p-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 rounded-lg transition-colors cursor-pointer font-bold text-[10px] flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => onUpdateTransferStatus(t.id, 'Rejected', 'Super Admin')}
                              className="p-1.5 bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-colors cursor-pointer font-bold text-[10px] flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            {t.approvedBy ? `By ${t.approvedBy}` : 'Processed'}
                          </span>
                        )}

                        {onDeleteTransfer && (
                          <button
                            onClick={() => {
                              setDeleteConfirm({
                                isOpen: true,
                                title: 'Delete Transfer Request',
                                message: `Are you sure you want to delete this asset transfer request for ${t.assetTag}?`,
                                onConfirm: () => onDeleteTransfer(t.id)
                              });
                            }}
                            className="p-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Delete Transfer Request"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
              {transfers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No movement transfer requests recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW TRANSFER REQUEST MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-400" />
                <span>Request Asset Movement & Gate Pass</span>
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitTransfer} className="space-y-4 text-xs">
              
              {/* Select Asset via SearchableSelect */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Select Asset to Transfer *</label>
                <SearchableSelect
                  options={assets.map((a) => ({
                    value: a.id,
                    label: `${a.particulars} (${a.assetTag})`,
                    sublabel: `Current Location: ${a.assetLocationCode || 'Unassigned'}`,
                    badge: a.assetTag
                  }))}
                  value={selectedAssetId}
                  onChange={setSelectedAssetId}
                  placeholder="Type to search asset tag or name..."
                  searchPlaceholder="Search asset tag, particulars..."
                />
              </div>

              {/* Destination Hierarchy via LocationCascadingSelect */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                <p className="font-bold text-blue-400 text-[11px] uppercase tracking-wider">Destination Dependent Location Hierarchy</p>
                <LocationCascadingSelect
                  organizations={organizations}
                  campuses={campuses}
                  buildings={buildings}
                  rooms={rooms}
                  selectedOrgId={toOrgId}
                  selectedCampusId={toCampusId}
                  selectedBuildingId={toBuildingId}
                  selectedRoomId={toRoomId}
                  onChangeOrg={setToOrgId}
                  onChangeCampus={setToCampusId}
                  onChangeBuilding={setToBuildingId}
                  onChangeRoom={setToRoomId}
                  showAllOption={false}
                  layout="stacked"
                />
              </div>

              {/* Transfer Reason */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Reason for Asset Movement *</label>
                <input
                  type="text"
                  required
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. Temporary allocation for lab workshop, Permanent relocation..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Gate Pass / Dispatch Notes</label>
                <textarea
                  rows={2}
                  value={gatePassNotes}
                  onChange={(e) => setGatePassNotes(e.target.value)}
                  placeholder="Gate pass number, transport vehicle number, driver details..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
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
                  className="px-5 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-bold cursor-pointer shadow-md"
                >
                  Submit Transfer Request
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
