import React, { useEffect, useRef } from 'react';
import {
  X,
  QrCode,
  Building2,
  MapPin,
  Calendar,
  IndianRupee,
  ShieldCheck,
  Clock,
  Printer,
  FileText,
  User,
  ExternalLink,
  History,
  CheckCircle2
} from 'lucide-react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { Asset, Organization, Campus, Building, Room, Department, AssetCategory, AssetSubCategory, AssetTransfer, PhysicalVerification, AuditLog, Vendor } from '../types';
import { formatINR, formatDate, calculateDaysRemaining } from '../utils/formatters';

interface AssetDetailModalProps {
  asset: Asset | null;
  organizations: Organization[];
  campuses: Campus[];
  buildings: Building[];
  rooms: Room[];
  departments: Department[];
  categories?: AssetCategory[];
  subCategories?: AssetSubCategory[];
  vendors?: Vendor[];
  transfers: AssetTransfer[];
  verifications: PhysicalVerification[];
  auditLogs?: AuditLog[];
  onClose: () => void;
  onOpenLabelPrint: (asset: Asset) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  organizations,
  campuses,
  buildings,
  rooms,
  departments,
  categories = [],
  subCategories = [],
  vendors = [],
  transfers,
  verifications,
  auditLogs = [],
  onClose,
  onOpenLabelPrint
}) => {
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!asset) return;

    // Render QR Code Data
    if (qrCanvasRef.current) {
      const qrData = JSON.stringify({
        assetTag: asset.assetTag,
        particulars: asset.particulars,
        location: asset.assetLocationCode,
        org: asset.organizationId,
        serial: asset.assetSerialNumber
      });
      QRCode.toCanvas(qrCanvasRef.current, qrData, { width: 140, margin: 1 });
    }

    // Render Barcode
    if (barcodeSvgRef.current) {
      try {
        JsBarcode(barcodeSvgRef.current, asset.assetTag, {
          format: asset.barcodeType || 'CODE128',
          width: 1.5,
          height: 40,
          displayValue: true,
          fontOptions: 'bold',
          fontSize: 10,
          background: '#ffffff',
          lineColor: '#000000'
        });
      } catch (err) {
        console.warn('Barcode render error:', err);
      }
    }
  }, [asset]);

  if (!asset) return null;

  const org = organizations.find((o) => o.id === asset.organizationId);
  const campus = campuses.find((c) => c.id === asset.campusId);
  const building = buildings.find((b) => b.id === asset.buildingId);
  const room = rooms.find((r) => r.id === asset.roomId);
  const dept = departments.find((d) => d.id === asset.departmentId);
  const cat = categories.find((c) => c.id === asset.categoryId);
  const subCat = subCategories.find((s) => s.id === asset.subCategoryId);
  const vendorObj = vendors.find((v) => v.id === asset.vendorId || v.name.toLowerCase() === (asset.vendorName || '').toLowerCase());
  const displayVendorName = vendorObj ? `${vendorObj.name} (${vendorObj.code})` : (asset.vendorName || 'Not Assigned');

  const assetTransfers = transfers.filter((t) => t.assetId === asset.id);
  const assetVerifications = verifications.filter((v) => v.assetId === asset.id);
  const assetAuditLogs = auditLogs.filter(
    (l) => l.entityId === asset.id || l.entityId === asset.assetTag
  );

  const warrantyDays = calculateDaysRemaining(asset.warrantyEnd);
  const amcDays = calculateDaysRemaining(asset.amcEnd);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl space-y-6 my-8">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl font-extrabold text-amber-400">{asset.assetTag}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                asset.assetStatus === 'Active' || asset.assetStatus === 'In Use'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {asset.assetStatus}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">{asset.particulars}</h2>
            <p className="text-slate-400 text-xs">{org?.name} • {campus?.name}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenLabelPrint(asset)}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Label</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column: QR Code & Barcode & Photo */}
          <div className="space-y-4 bg-slate-850 border border-slate-800 p-4 rounded-xl text-center">
            
            {/* Asset Photo */}
            <div className="w-full h-40 bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center border border-slate-700">
              {asset.assetPhoto ? (
                <img src={asset.assetPhoto} alt={asset.particulars} className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-500 text-xs flex flex-col items-center gap-1">
                  <Building2 className="w-8 h-8 text-slate-600" />
                  <span>No Photo Attached</span>
                </div>
              )}
            </div>

            {/* QR Code Canvas */}
            <div className="bg-white p-3 rounded-xl inline-block shadow-md">
              <canvas ref={qrCanvasRef} className="mx-auto" />
              <p className="text-[10px] text-slate-800 font-bold font-mono mt-1">SCAN FOR ASSET PROFILE</p>
            </div>

            {/* Barcode SVG */}
            <div className="bg-white p-2 rounded-xl inline-block shadow-md w-full">
              <svg ref={barcodeSvgRef} className="mx-auto w-full" />
            </div>

            <div className="text-left text-xs space-y-1 text-slate-400 pt-2 border-t border-slate-800">
              <p><strong className="text-slate-200">Condition:</strong> {asset.currentCondition}</p>
              <p><strong className="text-slate-200">Serial #:</strong> {asset.assetSerialNumber}</p>
              <p><strong className="text-slate-200">RFID Tag:</strong> {asset.rfidNumber || 'None'}</p>
            </div>
          </div>

          {/* Right Column: Tabbed Specification Details */}
          <div className="md:col-span-2 space-y-4">
            
            {/* Location Hierarchy Box */}
            <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-xl space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> Location & Division Hierarchy
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
                <div>
                  <p className="text-slate-400 text-[10px]">Asset Category</p>
                  <p className="font-bold text-amber-400">{cat?.name || 'General Category'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">Asset Subcategory</p>
                  <p className="font-bold text-emerald-400">{subCat?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">Division / Wing</p>
                  <p className="font-bold text-white">{asset.division || 'General Division'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">Place of Asset</p>
                  <p className="font-bold text-white">{asset.placeOfAsset || 'Unspecified Place'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">Organization & Campus</p>
                  <p className="font-bold text-white">{org?.shortCode} ({campus?.name || 'Main'})</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">Building & Room</p>
                  <p className="font-bold text-white">{building?.name || 'Main Block'} - {room?.name || 'Office'}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-750 font-mono text-[11px]">
                <span className="text-amber-300">Loc Code: {asset.assetLocationCode}</span>
                <span className="text-emerald-400">Alloc #: {asset.assetAllocationNumber || 'N/A'}</span>
              </div>
            </div>

            {/* Financials & Warranties */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/60 border border-slate-700/80 p-3 rounded-xl space-y-1">
                <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-400" /> Capital & Asset Value
                </p>
                <p className="text-sm font-black text-white">{formatINR(asset.purchaseCost)}</p>
                {asset.isBulkAsset ? (
                  <p className="text-[10px] text-amber-300 font-semibold">
                    Quantity: <strong className="text-white">{asset.quantity || 1} units</strong> @ {formatINR(asset.unitCost || 0)} / unit
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400">Quantity: <strong className="text-slate-200">{asset.quantity || 1} Unit</strong></p>
                )}
                <p className="text-[10px] text-slate-400">Purchased: <strong className="text-amber-400">{formatDate(asset.purchaseDate)}</strong></p>
                <p className="text-[10px] text-slate-400">Added to System: <strong className="text-emerald-400">{formatDate(asset.createdDate)}</strong></p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/80 p-3 rounded-xl space-y-1">
                <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Vendor & Coverage
                </p>
                <div className="text-xs">
                  <span className="text-slate-400 block text-[10px]">Supplier / Vendor:</span>
                  <span className="font-bold text-amber-300 truncate block">{displayVendorName}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">Warranty:</span>
                  <span className={`font-bold ${warrantyDays.status === 'Expired' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {warrantyDays.status === 'Expired' ? 'Expired' : `${warrantyDays.days} days left`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">AMC Vendor:</span>
                  <span className="font-semibold text-slate-200 truncate">{asset.amcVendor || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Manufacturer, Reference & Remarks */}
            <div className="bg-slate-800/60 border border-slate-700/80 p-3 rounded-xl text-xs space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Reference & Serial Identifiers</p>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div><span className="text-slate-400">Reference No:</span> <strong className="font-mono text-amber-400">{asset.referenceNumber || 'N/A'}</strong></div>
                <div><span className="text-slate-400">Serial No:</span> <strong className="font-mono text-white">{asset.isBulkAsset ? '(Bulk Asset / Furniture)' : (asset.assetSerialNumber || 'N/A')}</strong></div>
                <div><span className="text-slate-400">Allocation No:</span> <strong className="font-mono text-white">{asset.assetAllocationNumber || 'N/A'}</strong></div>
                <div><span className="text-slate-400">Manufacturer:</span> <strong className="text-white">{asset.manufacturer || 'N/A'}</strong></div>
              </div>
              {asset.remarks && (
                <p className="text-[10px] text-slate-400 pt-1">
                  Remarks: <strong className="text-slate-200">{asset.remarks}</strong>
                </p>
              )}
            </div>

            {/* History Timelines */}
            <div className="bg-slate-800/60 border border-slate-700/80 p-3 rounded-xl text-xs space-y-2">
              <p className="font-bold text-amber-400 text-[11px] flex items-center gap-1">
                <History className="w-3.5 h-3.5" /> Recent Verification & Transfer Activity
              </p>
              <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                {assetVerifications.map((v) => (
                  <div key={v.id} className="flex items-center justify-between bg-slate-900 p-2 rounded text-[10px]">
                    <span>Audit Status: <strong className="text-emerald-400">{v.verificationStatus}</strong> by {v.verifiedBy}</span>
                    <span className="text-slate-400">{formatDate(v.verifiedDate)}</span>
                  </div>
                ))}
                {assetTransfers.map((t) => (
                  <div key={t.id} className="flex items-center justify-between bg-slate-900 p-2 rounded text-[10px]">
                    <span>Transfer ({t.status}): {t.transferReason}</span>
                    <span className="text-slate-400">{formatDate(t.requestedDate)}</span>
                  </div>
                ))}
                {assetVerifications.length === 0 && assetTransfers.length === 0 && (
                  <p className="text-slate-400 text-[10px]">No historical transfers or audits logged for this asset.</p>
                )}
              </div>
            </div>

            {/* Asset Specific Audit Trail */}
            <div className="bg-slate-800/60 border border-slate-700/80 p-3 rounded-xl text-xs space-y-2">
              <p className="font-bold text-emerald-400 text-[11px] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Immutable Asset Audit Trail ({assetAuditLogs.length} Events)
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {assetAuditLogs.map((log) => (
                  <div key={log.id} className="bg-slate-900 p-2 rounded text-[10px] space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-300">{log.action}</span>
                      <span className="text-slate-400 font-mono">{new Date(log.timestamp).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>By: <strong className="text-slate-100">{log.userName}</strong> ({log.userRole})</span>
                      <span className="font-mono text-slate-400">{log.ipAddress || 'System'}</span>
                    </div>
                  </div>
                ))}
                {assetAuditLogs.length === 0 && (
                  <p className="text-slate-400 text-[10px]">Initial creation log recorded in system database master logs.</p>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
