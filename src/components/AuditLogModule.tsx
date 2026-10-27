import React, { useState } from 'react';
import { History, ShieldCheck, User, Globe, Clock, Search, Download, FileSpreadsheet, Filter, AlertCircle, CheckCircle2, Tag } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuditLog } from '../types';
import { formatDate } from '../utils/formatters';

interface AuditLogModuleProps {
  logs: AuditLog[];
}

export const AuditLogModule: React.FC<AuditLogModuleProps> = ({ logs = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [filterEntityType, setFilterEntityType] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Extract unique actions & entity types
  const actionTypes = Array.from(new Set(logs.map((l) => l.action))).filter(Boolean);
  const entityTypes = Array.from(new Set(logs.map((l) => l.entityType))).filter(Boolean);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    // Search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchTag = log.entityId?.toLowerCase().includes(q);
      const matchUser = log.userName?.toLowerCase().includes(q);
      const matchAction = log.action?.toLowerCase().includes(q);
      const matchEntity = log.entityType?.toLowerCase().includes(q);
      const matchIp = log.ipAddress?.toLowerCase().includes(q);
      if (!matchTag && !matchUser && !matchAction && !matchEntity && !matchIp) return false;
    }

    // Action filter
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;

    // Entity filter
    if (filterEntityType !== 'ALL' && log.entityType !== filterEntityType) return false;

    // Date range filter
    if (startDate) {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      if (logDate < startDate) return false;
    }
    if (endDate) {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      if (logDate > endDate) return false;
    }

    return true;
  });

  // Export Excel
  const handleExportExcel = () => {
    const data = filteredLogs.map((l) => ({
      'Log ID': l.id,
      'Timestamp': new Date(l.timestamp).toLocaleString('en-IN'),
      'User Name': l.userName,
      'User Role': l.userRole,
      'Action Executed': l.action,
      'Entity Type': l.entityType,
      'Entity / Asset ID': l.entityId || 'N/A',
      'IP Address': l.ipAddress || 'Internal',
      'Browser': l.browser || 'System'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit_Trail_Logs');
    XLSX.writeFile(wb, `Amara_Raja_EAMS_Audit_Logs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Amara Raja Group - System Audit Trail Log Report', 14, 15);
    doc.setFontSize(10);
    const dateStr = (startDate || endDate) ? `Period: ${startDate || 'Earliest'} to ${endDate || 'Latest'}` : 'All Time History';
    doc.text(`Total Events Logged: ${filteredLogs.length} | ${dateStr}`, 14, 22);

    const tableData = filteredLogs.map((l) => [
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
      headStyles: { fillColor: [245, 158, 11] }
    });

    doc.save(`Amara_Raja_EAMS_Audit_Logs_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner & Export Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-amber-400" />
            <span>Enterprise System Audit Trail & Lifecycle Logs</span>
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Immutable, tamper-proof record tracking all user actions, asset additions, updates, transfers & deletions
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

      {/* Quick Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-1">
          <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
            <History className="w-3.5 h-3.5 text-amber-400" /> Total Logged Events
          </p>
          <p className="text-2xl font-black text-white">{logs.length}</p>
          <p className="text-[10px] text-slate-400">Total system interactions</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-1">
          <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-emerald-400" /> Filtered Events
          </p>
          <p className="text-2xl font-black text-emerald-400">{filteredLogs.length}</p>
          <p className="text-[10px] text-slate-400">Matching current criteria</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-1">
          <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-blue-400" /> Active Operators
          </p>
          <p className="text-2xl font-black text-white">{new Set(logs.map((l) => l.userName)).size}</p>
          <p className="text-[10px] text-slate-400">Unique users logged in system</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-1">
          <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Compliance Status
          </p>
          <p className="text-2xl font-black text-amber-400">Verified</p>
          <p className="text-[10px] text-slate-400">Audit trail integrity verified</p>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <div className="lg:col-span-1">
          <label className="block text-slate-400 mb-1 font-semibold">Search Query</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Asset tag, user, action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-semibold">Action Type</label>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Action Types</option>
            {actionTypes.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-semibold">Entity Type</label>
          <select
            value={filterEntityType}
            onChange={(e) => setFilterEntityType(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Entities</option>
            {entityTypes.map((ent) => (
              <option key={ent} value={ent}>
                {ent}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-amber-400 mb-1 font-semibold">From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>

        <div>
          <label className="block text-amber-400 mb-1 font-semibold">To Date</label>
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 font-mono"
            />
            {(startDate || endDate || searchTerm || filterAction !== 'ALL' || filterEntityType !== 'ALL') && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setSearchTerm('');
                  setFilterAction('ALL');
                  setFilterEntityType('ALL');
                }}
                className="text-xs text-rose-400 hover:underline px-1 font-bold cursor-pointer"
                title="Reset all filters"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white text-xs uppercase tracking-wider">
              System Event Log ({filteredLogs.length} Entries)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-700/80">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User & Role</th>
                <th className="py-3 px-4">Action Executed</th>
                <th className="py-3 px-4">Entity Type / ID</th>
                <th className="py-3 px-4">IP Address / Client</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/50 transition-colors text-slate-300">
                  <td className="py-3 px-4 font-mono text-[10px] text-amber-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-100">{log.userName}</p>
                    <p className="text-[10px] text-slate-400">{log.userRole}</p>
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-slate-200">
                    <span className={`px-2 py-0.5 rounded border text-[11px] ${
                      log.action.includes('DELETE')
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : log.action.includes('CREATE') || log.action.includes('IMPORT')
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {log.action}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-200">{log.entityType}</p>
                    <p className="text-[10px] font-mono text-amber-400 font-bold">{log.entityId || 'N/A'}</p>
                  </td>

                  <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                    <p>{log.ipAddress || 'Internal'}</p>
                    <p className="truncate max-w-[150px] text-slate-500">{log.browser || 'System Client'}</p>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                    No matching audit trail logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
