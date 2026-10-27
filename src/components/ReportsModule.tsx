import React, { useState } from 'react';
import { FileText, Download, FileSpreadsheet, Calendar, IndianRupee, Tag, Trash2, PlusCircle, AlertCircle, ShieldAlert, History, ShieldCheck } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Asset, Organization, Campus, AssetCategory, DeletedAsset, AuditLog } from '../types';
import { formatINR, formatDate, calculateDaysRemaining } from '../utils/formatters';

interface ReportsModuleProps {
  assets: Asset[];
  deletedAssets?: DeletedAsset[];
  auditLogs?: AuditLog[];
  organizations: Organization[];
  campuses: Campus[];
  categories: AssetCategory[];
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  assets,
  deletedAssets = [],
  auditLogs = [],
  organizations,
  campuses,
  categories
}) => {
  const [reportType, setReportType] = useState<
    'purchase_date' | 'addition_date' | 'warranty_expiry' | 'deletion_date' | 'audit_trail' | 'register' | 'valuation' | 'status' | 'amc'
  >('purchase_date');
  const [filterOrg, setFilterOrg] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');

  React.useEffect(() => {
    if (organizations.length === 1) {
      setFilterOrg(organizations[0].id);
    } else {
      setFilterOrg('ALL');
    }
  }, [organizations]);

  // Date Range Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const isDeletedReport = reportType === 'deletion_date';
  const isAuditTrailReport = reportType === 'audit_trail';
  const isWarrantyReport = reportType === 'warranty_expiry';

  // Filtered Active Assets
  const filteredAssets = assets.filter((a) => {
    if (filterOrg !== 'ALL' && a.organizationId !== filterOrg) return false;
    if (filterCategory !== 'ALL' && a.categoryId !== filterCategory) return false;

    if (reportType === 'addition_date') {
      const dateVal = a.createdDate;
      if (startDate && (!dateVal || new Date(dateVal) < new Date(startDate))) return false;
      if (endDate && (!dateVal || new Date(dateVal) > new Date(endDate))) return false;
    } else if (reportType === 'warranty_expiry') {
      const dateVal = a.warrantyEnd;
      if (startDate && (!dateVal || new Date(dateVal) < new Date(startDate))) return false;
      if (endDate && (!dateVal || new Date(dateVal) > new Date(endDate))) return false;
    } else {
      const dateVal = a.purchaseDate;
      if (startDate && (!dateVal || new Date(dateVal) < new Date(startDate))) return false;
      if (endDate && (!dateVal || new Date(dateVal) > new Date(endDate))) return false;
    }

    return true;
  });

  // Filtered Deleted Assets
  const filteredDeletedAssets = deletedAssets.filter((d) => {
    if (filterOrg !== 'ALL' && d.organizationId !== filterOrg) return false;

    const dateVal = d.deletedDate;
    if (startDate && (!dateVal || new Date(dateVal) < new Date(startDate))) return false;
    if (endDate && (!dateVal || new Date(dateVal) > new Date(endDate))) return false;

    return true;
  });

  // Filtered Audit Trail Logs
  const filteredAuditLogs = auditLogs.filter((l) => {
    if (filterOrg !== 'ALL' && l.organizationId && l.organizationId !== filterOrg) return false;

    const dateVal = new Date(l.timestamp).toISOString().split('T')[0];
    if (startDate && dateVal < startDate) return false;
    if (endDate && dateVal > endDate) return false;

    return true;
  });

  // Sorting Active Assets
  const sortedAssets = [...filteredAssets].sort((a, b) => {
    if (reportType === 'warranty_expiry') {
      if (!a.warrantyEnd) return 1;
      if (!b.warrantyEnd) return -1;
      return new Date(a.warrantyEnd).getTime() - new Date(b.warrantyEnd).getTime();
    }
    const key = reportType === 'addition_date' ? a.createdDate : a.purchaseDate;
    const keyB = reportType === 'addition_date' ? b.createdDate : b.purchaseDate;
    if (!key) return 1;
    if (!keyB) return -1;
    return new Date(keyB).getTime() - new Date(key).getTime();
  });

  const sortedDeletedAssets = [...filteredDeletedAssets].sort((a, b) => {
    if (!a.deletedDate) return 1;
    if (!b.deletedDate) return -1;
    return new Date(b.deletedDate).getTime() - new Date(a.deletedDate).getTime();
  });

  const sortedAuditLogs = [...filteredAuditLogs].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // Analytics
  const totalPurchaseValue = sortedAssets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
  const totalCurrentValue = sortedAssets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
  const totalDeletedCount = sortedDeletedAssets.length;
  const totalDeletedPurchaseValue = sortedDeletedAssets.reduce((sum, d) => sum + (d.purchaseCost || 0), 0);
  
  const nowMs = Date.now();
  const warrantyExpiredCount = sortedAssets.filter(a => a.warrantyEnd && new Date(a.warrantyEnd).getTime() < nowMs).length;
  const warrantyExpiringSoonCount = sortedAssets.filter(a => {
    if (!a.warrantyEnd) return false;
    const diff = (new Date(a.warrantyEnd).getTime() - nowMs) / (1000 * 3600 * 24);
    return diff >= 0 && diff <= 30;
  }).length;

  // Excel Export
  const handleExportExcel = () => {
    let exportData: any[] = [];
    let sheetName = 'Asset_Report';

    if (isDeletedReport) {
      sheetName = 'Deleted_Assets_Report';
      exportData = sortedDeletedAssets.map((d) => ({
        'Deletion Date': d.deletedDate ? formatDate(d.deletedDate) : 'N/A',
        'Asset Addition Date': d.createdDate ? formatDate(d.createdDate) : 'N/A',
        'Date of Purchase': d.purchaseDate ? formatDate(d.purchaseDate) : 'N/A',
        'Asset Tag': d.assetTag,
        'Particulars (Asset Name)': d.particulars,
        'Organization': d.organizationId,
        'Location Code': d.assetLocationCode || 'N/A',
        'Purchase Cost (₹)': d.purchaseCost || 0,
        'Deletion Reason': d.reason || 'Asset Disposed',
        'Deleted By User': d.deletedBy || 'Admin'
      }));
    } else if (isAuditTrailReport) {
      sheetName = 'System_Audit_Trail_Report';
      exportData = sortedAuditLogs.map((l) => ({
        'Timestamp': new Date(l.timestamp).toLocaleString('en-IN'),
        'User Name': l.userName,
        'User Role': l.userRole,
        'Action Executed': l.action,
        'Entity Type': l.entityType,
        'Entity / Asset ID': l.entityId || 'N/A',
        'IP Address': l.ipAddress || 'Internal',
        'Browser / Client': l.browser || 'System'
      }));
    } else if (isWarrantyReport) {
      sheetName = 'Warranty_Expiry_Report';
      exportData = sortedAssets.map((a) => {
        const days = calculateDaysRemaining(a.warrantyEnd);
        return {
          'Asset Tag': a.assetTag,
          'Particulars': a.particulars,
          'Manufacturer': a.manufacturer || 'N/A',
          'Date of Purchase': a.purchaseDate ? formatDate(a.purchaseDate) : 'N/A',
          'Warranty End Date': a.warrantyEnd ? formatDate(a.warrantyEnd) : 'No Warranty',
          'Days Left / Status': days.status === 'Expired' ? 'EXPIRED' : `${days.days} Days Left`,
          'Serial Number': a.serialNumber || 'N/A',
          'Purchase Cost (₹)': a.purchaseCost || 0,
          'Asset Location': a.assetLocationCode || 'N/A'
        };
      });
    } else {
      sheetName = `${reportType}_Report`;
      exportData = sortedAssets.map((a) => ({
        'Asset Tag': a.assetTag,
        'Particulars': a.particulars,
        'Date of Purchase': a.purchaseDate ? formatDate(a.purchaseDate) : 'N/A',
        'Asset Addition Date': a.createdDate ? formatDate(a.createdDate) : 'N/A',
        'Warranty End Date': a.warrantyEnd ? formatDate(a.warrantyEnd) : 'N/A',
        'Location Code': a.assetLocationCode,
        'Organization': a.organizationId,
        'Purchase Cost (₹)': a.purchaseCost || 0,
        'Current Value (₹)': a.currentValue || 0,
        'Status': a.assetStatus,
        'Condition': a.currentCondition
      }));
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `Amara_Raja_EAMS_${sheetName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // PDF Export
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Amara Raja Group - Enterprise Asset Management Report', 14, 15);
    doc.setFontSize(10);
    const dateRangeStr = (startDate || endDate) ? `Period: ${startDate || 'Start'} to ${endDate || 'End'}` : 'All Time';
    doc.text(`Report Type: ${reportType.toUpperCase().replace('_', ' ')} | Scope: ${filterOrg} | ${dateRangeStr}`, 14, 22);

    if (isDeletedReport) {
      const tableData = sortedDeletedAssets.map((d) => [
        d.deletedDate ? formatDate(d.deletedDate) : 'N/A',
        d.createdDate ? formatDate(d.createdDate) : 'N/A',
        d.purchaseDate ? formatDate(d.purchaseDate) : 'N/A',
        d.assetTag,
        d.particulars,
        d.reason || 'Disposed',
        d.deletedBy || 'Admin'
      ]);

      autoTable(doc, {
        startY: 28,
        head: [['Deletion Date', 'Addition Date', 'Purchase Date', 'Tag', 'Particulars', 'Reason', 'Deleted By']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [225, 29, 72] }
      });
    } else if (isAuditTrailReport) {
      const tableData = sortedAuditLogs.map((l) => [
        new Date(l.timestamp).toLocaleString('en-IN'),
        `${l.userName} (${l.userRole})`,
        l.action,
        `${l.entityType}: ${l.entityId || 'N/A'}`,
        l.ipAddress || 'Internal'
      ]);

      autoTable(doc, {
        startY: 28,
        head: [['Timestamp', 'User & Role', 'Action Executed', 'Entity Target', 'IP Address']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }
      });
    } else if (isWarrantyReport) {
      const tableData = sortedAssets.map((a) => {
        const days = calculateDaysRemaining(a.warrantyEnd);
        return [
          a.assetTag,
          a.particulars,
          a.manufacturer || 'N/A',
          a.warrantyEnd ? formatDate(a.warrantyEnd) : 'N/A',
          days.status === 'Expired' ? 'EXPIRED' : `${days.days} Days Left`,
          a.assetLocationCode || 'N/A'
        ];
      });

      autoTable(doc, {
        startY: 28,
        head: [['Asset Tag', 'Particulars', 'Manufacturer', 'Warranty End', 'Status', 'Location']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [217, 119, 6] }
      });
    } else {
      const tableData = sortedAssets.map((a) => [
        a.assetTag,
        a.particulars,
        a.purchaseDate ? formatDate(a.purchaseDate) : 'N/A',
        a.createdDate ? formatDate(a.createdDate) : 'N/A',
        a.assetLocationCode,
        formatINR(a.purchaseCost),
        a.assetStatus
      ]);

      autoTable(doc, {
        startY: 28,
        head: [['Asset Tag', 'Particulars', 'Purchase Date', 'Addition Date', 'Location', 'Cost (INR)', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [245, 158, 11] }
      });
    }

    doc.save(`Amara_Raja_EAMS_Report_${reportType}.pdf`);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-400" />
            <span>Enterprise Asset Lifecycle, Audit & Warranty Reports</span>
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Purchase Date reports, Asset Addition Date logs, Warranty Expiry statements, Audit Logs & Deleted Asset tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-4 py-2 rounded-xl text-xs shadow-md cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel Export</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>PDF Export</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <div>
          <label className="block text-slate-400 mb-1 font-semibold">Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="w-full bg-slate-800 border border-slate-700 text-white font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="purchase_date">📅 Purchase Date Wise Report</option>
            <option value="addition_date">➕ Asset Addition Date-Wise Report</option>
            <option value="warranty_expiry">🛡️ Warranty Expiry & Compliance Report</option>
            <option value="deletion_date">🗑️ Deleted Assets Lifecycle Report</option>
            <option value="audit_trail">📜 System Audit Trail & Event Log Report</option>
            <option value="register">Full Master Asset Register</option>
            <option value="valuation">Asset Valuation & Capital Statement</option>
            <option value="status">Asset Status & Condition Audit</option>
            <option value="amc">AMC & Maintenance Expiry Statement</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-semibold">Organization Scope</label>
          <select
            value={filterOrg}
            onChange={(e) => setFilterOrg(e.target.value)}
            disabled={organizations.length === 1}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {organizations.length > 1 && (
              <option value="ALL">All Organizations (Amara Raja Group)</option>
            )}
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.shortCode} - {o.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-semibold">Category Scope</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            disabled={isDeletedReport || isAuditTrailReport}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 disabled:opacity-50 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={`block mb-1 font-semibold ${
            isDeletedReport ? 'text-rose-400' : isWarrantyReport ? 'text-amber-400' : isAuditTrailReport ? 'text-blue-400' : reportType === 'addition_date' ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            From {isDeletedReport ? 'Deletion' : isWarrantyReport ? 'Warranty' : isAuditTrailReport ? 'Log' : reportType === 'addition_date' ? 'Addition' : 'Purchase'} Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>

        <div>
          <label className={`block mb-1 font-semibold ${
            isDeletedReport ? 'text-rose-400' : isWarrantyReport ? 'text-amber-400' : isAuditTrailReport ? 'text-blue-400' : reportType === 'addition_date' ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            To {isDeletedReport ? 'Deletion' : isWarrantyReport ? 'Warranty' : isAuditTrailReport ? 'Log' : reportType === 'addition_date' ? 'Addition' : 'Purchase'} Date
          </label>
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 font-mono"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-rose-400 hover:underline px-1 font-bold cursor-pointer"
                title="Clear date range"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Date Presets */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span className="font-semibold text-slate-300">Quick Date Presets:</span>
        <button
          onClick={() => { setStartDate(''); setEndDate(''); }}
          className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium cursor-pointer ${
            !startDate && !endDate ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-slate-800 border-slate-700 hover:text-white'
          }`}
        >
          All Time
        </button>
        <button
          onClick={() => { setStartDate('2026-01-01'); setEndDate('2026-12-31'); }}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-[11px] font-medium cursor-pointer"
        >
          Year 2026
        </button>
        <button
          onClick={() => { setStartDate('2025-01-01'); setEndDate('2025-12-31'); }}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-[11px] font-medium cursor-pointer"
        >
          Year 2025
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isDeletedReport ? (
          <>
            <div className="bg-slate-900 border border-rose-900/40 p-4 rounded-xl shadow-lg space-y-1">
              <p className="text-[10px] text-rose-400 uppercase font-bold flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Total Deleted Assets
              </p>
              <p className="text-2xl font-black text-rose-400">{totalDeletedCount}</p>
              <p className="text-[10px] text-slate-400">Disposed or deleted in scope</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-amber-400" /> Capital Disposed
              </p>
              <p className="text-2xl font-black text-amber-400">{formatINR(totalDeletedPurchaseValue)}</p>
              <p className="text-[10px] text-slate-400">Original purchase cost of deleted assets</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" /> Addition Dates Recorded
              </p>
              <p className="text-2xl font-black text-white">{sortedDeletedAssets.filter(d => d.createdDate).length}</p>
              <p className="text-[10px] text-slate-400">Full lifecycle history logged</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Audit Logged
              </p>
              <p className="text-2xl font-black text-emerald-400">100%</p>
              <p className="text-[10px] text-slate-400">Recorded with deletion reason & user</p>
            </div>
          </>
        ) : isAuditTrailReport ? (
          <>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <History className="w-3.5 h-3.5 text-amber-400" /> Audit Log Events
              </p>
              <p className="text-2xl font-black text-white">{sortedAuditLogs.length}</p>
              <p className="text-[10px] text-slate-400">System interactions logged</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-blue-400" /> Asset Operations
              </p>
              <p className="text-2xl font-black text-blue-400">
                {sortedAuditLogs.filter(l => l.entityType === 'Asset').length}
              </p>
              <p className="text-[10px] text-slate-400">Direct asset modifications</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Audit Users Count
              </p>
              <p className="text-2xl font-black text-emerald-400">
                {new Set(sortedAuditLogs.map(l => l.userName)).size}
              </p>
              <p className="text-[10px] text-slate-400">Distinct system operators</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Deletions Logged
              </p>
              <p className="text-2xl font-black text-rose-400">
                {sortedAuditLogs.filter(l => l.action.includes('DELETE')).length}
              </p>
              <p className="text-[10px] text-slate-400">Disposal and deletion actions</p>
            </div>
          </>
        ) : isWarrantyReport ? (
          <>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Assets with Warranty
              </p>
              <p className="text-2xl font-black text-white">{sortedAssets.filter(a => a.warrantyEnd).length}</p>
              <p className="text-[10px] text-slate-400">Out of {sortedAssets.length} active assets</p>
            </div>

            <div className="bg-slate-900 border border-rose-900/40 p-4 rounded-xl shadow-lg space-y-1">
              <p className="text-[10px] text-rose-400 uppercase font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Warranty Expired
              </p>
              <p className="text-2xl font-black text-rose-400">{warrantyExpiredCount}</p>
              <p className="text-[10px] text-slate-400">Requires AMC / extended cover</p>
            </div>

            <div className="bg-slate-900 border border-amber-900/40 p-4 rounded-xl shadow-lg space-y-1">
              <p className="text-[10px] text-amber-400 uppercase font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Expiring Within 30 Days
              </p>
              <p className="text-2xl font-black text-amber-400">{warrantyExpiringSoonCount}</p>
              <p className="text-[10px] text-slate-400">Action required soon</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Valid Covered Warranty
              </p>
              <p className="text-2xl font-black text-emerald-400">
                {sortedAssets.filter(a => a.warrantyEnd && new Date(a.warrantyEnd).getTime() > nowMs + 30 * 86400000).length}
              </p>
              <p className="text-[10px] text-slate-400">Active manufacturer warranty</p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-amber-400" /> Total Active Assets
              </p>
              <p className="text-2xl font-black text-white">{sortedAssets.length}</p>
              <p className="text-[10px] text-slate-400">Assets matched in selected range</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-400" /> Capital Investment
              </p>
              <p className="text-2xl font-black text-emerald-400">{formatINR(totalPurchaseValue)}</p>
              <p className="text-[10px] text-slate-400">Total initial purchase outlay</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-blue-400" /> Current Net Book Value
              </p>
              <p className="text-2xl font-black text-blue-400">{formatINR(totalCurrentValue)}</p>
              <p className="text-[10px] text-slate-400">After depreciation</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> Addition Dates Preserved
              </p>
              <p className="text-2xl font-black text-white">{sortedAssets.filter(a => a.createdDate).length}</p>
              <p className="text-[10px] text-slate-400">Assets with system addition timestamp</p>
            </div>
          </>
        )}
      </div>

      {/* Live Table Report Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white text-xs uppercase tracking-wider">
              {isDeletedReport
                ? `Deleted Assets Register (${sortedDeletedAssets.length} Records)`
                : isAuditTrailReport
                ? `System Audit Trail & Event Logs (${sortedAuditLogs.length} Records)`
                : isWarrantyReport
                ? `Warranty Expiry & Compliance Register (${sortedAssets.length} Records)`
                : reportType === 'addition_date'
                ? `Asset Addition Date-Wise Register (${sortedAssets.length} Records)`
                : `Purchase Date-Wise Asset Register (${sortedAssets.length} Records)`}
            </span>
          </div>
          {(startDate || endDate) && (
            <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
              Filtered: {startDate || 'Earliest'} → {endDate || 'Latest'}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          {isDeletedReport ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-rose-950/40 text-rose-300 font-bold uppercase text-[10px] border-b border-rose-900/50">
                  <th className="py-3 px-4">Deletion Date</th>
                  <th className="py-3 px-4">Addition Date</th>
                  <th className="py-3 px-4">Purchase Date</th>
                  <th className="py-3 px-4">Asset Tag</th>
                  <th className="py-3 px-4">Particulars</th>
                  <th className="py-3 px-4 text-right">Purchase Cost (₹)</th>
                  <th className="py-3 px-4">Deletion Reason</th>
                  <th className="py-3 px-4">Deleted By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {sortedDeletedAssets.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/50 transition-colors text-slate-300">
                    <td className="py-3 px-4 font-mono font-bold text-rose-400">
                      {d.deletedDate ? formatDate(d.deletedDate) : 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-400">
                      {d.createdDate ? formatDate(d.createdDate) : 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-400">
                      {d.purchaseDate ? formatDate(d.purchaseDate) : 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-100">{d.assetTag}</td>
                    <td className="py-3 px-4 font-bold text-slate-100">{d.particulars}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">{formatINR(d.purchaseCost)}</td>
                    <td className="py-3 px-4 text-slate-300 italic">{d.reason || 'Asset Disposed / Written Off'}</td>
                    <td className="py-3 px-4 text-slate-400 font-semibold">{d.deletedBy || 'Admin'}</td>
                  </tr>
                ))}
                {sortedDeletedAssets.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      No deleted asset records found matching the specified date range or scope.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : isAuditTrailReport ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-700/80">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User & Role</th>
                  <th className="py-3 px-4">Action Executed</th>
                  <th className="py-3 px-4">Entity Target</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {sortedAuditLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/50 transition-colors text-slate-300">
                    <td className="py-3 px-4 font-mono text-amber-400 text-[11px] whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-100">
                      <p>{l.userName}</p>
                      <p className="text-[10px] text-slate-400 font-normal">{l.userRole}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-200">
                      <span className="bg-slate-800 text-amber-300 px-2 py-0.5 rounded border border-slate-700 text-[11px]">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-200">{l.entityType}</p>
                      <p className="text-[10px] font-mono text-amber-400">{l.entityId || 'N/A'}</p>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                      {l.ipAddress || 'Internal'}
                    </td>
                  </tr>
                ))}
                {sortedAuditLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      No audit logs found matching the selected range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : isWarrantyReport ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-700/80">
                  <th className="py-3 px-4">Asset Tag</th>
                  <th className="py-3 px-4">Particulars</th>
                  <th className="py-3 px-4">Manufacturer</th>
                  <th className="py-3 px-4">Purchase Date</th>
                  <th className="py-3 px-4">Warranty End Date</th>
                  <th className="py-3 px-4 text-center">Warranty Status</th>
                  <th className="py-3 px-4">Location Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {sortedAssets.map((a) => {
                  const days = calculateDaysRemaining(a.warrantyEnd);
                  return (
                    <tr key={a.id} className="hover:bg-slate-800/50 transition-colors text-slate-300">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">{a.assetTag}</td>
                      <td className="py-3 px-4 font-bold text-slate-100">{a.particulars}</td>
                      <td className="py-3 px-4 text-slate-300">{a.manufacturer || 'N/A'}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{a.purchaseDate ? formatDate(a.purchaseDate) : 'N/A'}</td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        {a.warrantyEnd ? formatDate(a.warrantyEnd) : 'No Warranty'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          days.status === 'Expired'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : days.status === 'Urgent'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {days.status === 'Expired' ? 'EXPIRED' : `${days.days} Days Left`}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-400">{a.assetLocationCode || 'N/A'}</td>
                    </tr>
                  );
                })}
                {sortedAssets.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      No warranty records found matching the specified date range or scope.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-700/80">
                  <th className="py-3 px-4">{reportType === 'addition_date' ? 'Asset Addition Date' : 'Date of Purchase'}</th>
                  <th className="py-3 px-4">{reportType === 'addition_date' ? 'Date of Purchase' : 'Asset Addition Date'}</th>
                  <th className="py-3 px-4">Asset Tag</th>
                  <th className="py-3 px-4">Particulars (Asset Name)</th>
                  <th className="py-3 px-4">Location Code</th>
                  <th className="py-3 px-4 text-right">Purchase Cost (₹)</th>
                  <th className="py-3 px-4 text-right">Book Value (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {sortedAssets.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/50 transition-colors text-slate-300">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {reportType === 'addition_date'
                        ? (a.createdDate ? formatDate(a.createdDate) : 'N/A')
                        : (a.purchaseDate ? formatDate(a.purchaseDate) : 'N/A')}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-400">
                      {reportType === 'addition_date'
                        ? (a.purchaseDate ? formatDate(a.purchaseDate) : 'N/A')
                        : (a.createdDate ? formatDate(a.createdDate) : 'N/A')}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-100">{a.assetTag}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-100">{a.particulars}</p>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{a.description}</p>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-300">{a.assetLocationCode}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">{formatINR(a.purchaseCost)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">{formatINR(a.currentValue)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        a.assetStatus === 'Active' || a.assetStatus === 'In Use'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {a.assetStatus}
                      </span>
                    </td>
                  </tr>
                ))}
                {sortedAssets.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      No asset records found matching the specified date range or scope filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};
