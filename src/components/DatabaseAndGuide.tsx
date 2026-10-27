import React, { useState, useEffect } from 'react';
import { Database, Download, Server, FileCode, CheckCircle2, Terminal, BookOpen, FileSpreadsheet, RefreshCw, AlertCircle, HardDrive, Settings2, Key, ShieldCheck, RotateCcw, Trash2, AlertTriangle, ShieldAlert, Sparkles, X, Layers } from 'lucide-react';
import * as XLSX from 'xlsx';

interface DatabaseAndGuideProps {
  currentRole?: string;
  onRefreshData?: () => Promise<void>;
}

export const DatabaseAndGuide: React.FC<DatabaseAndGuideProps> = ({ currentRole = 'Super Admin', onRefreshData }) => {
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

  // Production Handover & Reset Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetScope, setResetScope] = useState<'operational' | 'complete'>('operational');
  const [confirmInput, setConfirmInput] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ success: boolean; message: string; tablesPurged?: string[] } | null>(null);

  // Connection settings state
  const [showConfig, setShowConfig] = useState(false);
  const [configForm, setConfigForm] = useState({
    server: 'localhost',
    port: 1433,
    database: 'EAMS_AssetDB',
    user: 'sa',
    password: ''
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configMsg, setConfigMsg] = useState<{ success: boolean; text: string } | null>(null);

  const checkDbStatus = async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/db/status');
      const data = await res.json();
      setDbStatus(data);
    } catch (err: any) {
      setDbStatus({ connected: false, message: 'Could not fetch database status from server' });
    } finally {
      setIsChecking(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/db/mssql-config');
      const data = await res.json();
      if (data) {
        setConfigForm(prev => ({
          ...prev,
          server: data.server || 'localhost',
          port: data.port || 1433,
          database: data.database || 'EAMS_AssetDB',
          user: data.user || 'sa'
        }));
      }
    } catch (e) {}
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setConfigMsg(null);
    try {
      const res = await fetch('/api/db/mssql-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configForm)
      });
      const data = await res.json();
      if (data.connected) {
        setConfigMsg({ success: true, text: data.message || 'Connected successfully to SQL Server!' });
        setDbStatus(data);
        setTimeout(() => setShowConfig(false), 2000);
      } else {
        setConfigMsg({ success: false, text: data.message || 'Connection failed. Please check credentials or port.' });
        setDbStatus(data);
      }
    } catch (err: any) {
      setConfigMsg({ success: false, text: `Error: ${err?.message || err}` });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSyncToSQL = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/db/sync-all', { method: 'POST' });
      const data = await res.json();
      setSyncResult(data);
      if (data.success) {
        checkDbStatus();
      }
    } catch (err: any) {
      setSyncResult({ success: false, message: `Sync failed: ${err?.message || err}` });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExecuteReset = async () => {
    if (confirmInput.trim().toUpperCase() !== 'RESET') {
      return;
    }
    setIsResetting(true);
    setResetFeedback(null);
    try {
      const res = await fetch('/api/admin/reset-system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentRole || 'Super Admin'
        },
        body: JSON.stringify({ scope: resetScope })
      });
      const data = await res.json();
      if (data.success) {
        setResetFeedback({
          success: true,
          message: data.message,
          tablesPurged: data.sqlServerResult?.tablesPurged || []
        });
        if (onRefreshData) {
          await onRefreshData();
        }
        await checkDbStatus();
      } else {
        setResetFeedback({
          success: false,
          message: data.message || 'Reset failed'
        });
      }
    } catch (err: any) {
      setResetFeedback({
        success: false,
        message: `Reset failed: ${err?.message || err}`
      });
    } finally {
      setIsResetting(false);
    }
  };

  const [isRestoringDemo, setIsRestoringDemo] = useState(false);

  const handleRestoreDemoData = async () => {
    setIsRestoringDemo(true);
    try {
      const res = await fetch('/api/admin/restore-demo-data', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setResetFeedback({
          success: true,
          message: 'Initial sample demonstration data successfully restored.'
        });
        if (onRefreshData) {
          await onRefreshData();
        }
      }
    } catch (err: any) {
      setResetFeedback({
        success: false,
        message: `Failed to restore demo data: ${err?.message || err}`
      });
    } finally {
      setIsRestoringDemo(false);
    }
  };

  useEffect(() => {
    checkDbStatus();
    fetchConfig();
  }, []);

  const [isDownloadingSQL, setIsDownloadingSQL] = useState(false);

  const handleDownloadCompleteSQLBackup = async () => {
    setIsDownloadingSQL(true);
    try {
      const res = await fetch('/api/admin/export-sql-backup');
      if (!res.ok) throw new Error('Failed to download SQL backup');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `EAMS_Total_SQL_Backup_${dateStr}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Download error:', err);
      alert('Failed to download SQL backup: ' + (err?.message || err));
    } finally {
      setIsDownloadingSQL(false);
    }
  };

  const handleDownloadSQL = () => {
    const a = document.createElement('a');
    a.href = '/api/database/export-sql';
    a.download = 'amara_raja_eams_mysql8.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        Particulars: 'Dell PowerEdge R750 Server',
        'Asset Description': 'Core i7 13th Gen Laptops for High School Computer Teachers',
        'Asset Location Code': 'ARVD-DIG-ADM01-G-G05',
        'Purchase Date': '2024-04-12',
        Campus: 'Diguvamagham Campus',
        Division: 'Education Trust',
        'Place of Asset': 'Rack Row 1 Slot 4',
        Quantity: 1,
        'Asset Value': 485000,
        'Asset Allocation Number': 'ALLOC-IT-9921',
        'Asset Tag': 'ARG-ARVD-IT-2026-0001',
        'Asset Serial Number': 'SN-DELL-88392110',
        Remarks: 'Primary ERP & Biometric Attendance Database server',
        Building: 'Administration Block'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'EAMS_Import_Template');
    XLSX.writeFile(wb, 'Amara_Raja_EAMS_Excel_Template.xlsx');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-amber-400" />
            <span>Database Architect & Deployment Center</span>
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">Live SQL Server / SSMS persistence, database schema, and synchronization controls</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3.5 py-2 rounded-xl text-xs shadow-md cursor-pointer transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel Template</span>
          </button>

          <button
            onClick={handleDownloadSQL}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold px-3.5 py-2 rounded-xl text-xs shadow-md cursor-pointer transition-all"
            title="Download blank MySQL 8 table DDL schema"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>MySQL Schema</span>
          </button>

          <button
            onClick={handleDownloadCompleteSQLBackup}
            disabled={isDownloadingSQL}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
            title="Download full SQL backup (.sql) containing all tables and all current actual project entries"
          >
            <Database className={`w-4 h-4 ${isDownloadingSQL ? 'animate-bounce' : ''}`} />
            <span>{isDownloadingSQL ? 'Exporting SQL...' : 'Download Full SQL Backup (.sql)'}</span>
          </button>
        </div>
      </div>

      {/* SQL Server Express & SSMS Real-Time Persistence Hub */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">Microsoft SQL Server Express & SSMS Persistence</h2>
              <p className="text-[11px] text-slate-400">Target Database: <span className="text-indigo-300 font-mono font-semibold">{configForm.database}</span> / <span className="text-amber-300 font-mono">dbo.Assets</span></p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold px-3 py-1.5 rounded-lg text-xs border border-slate-700 cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{showConfig ? 'Hide Config' : 'Configure Connection'}</span>
            </button>

            <button
              onClick={checkDbStatus}
              disabled={isChecking}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3 py-1.5 rounded-lg text-xs border border-slate-700 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
              <span>Test Connection</span>
            </button>

            <button
              onClick={handleSyncToSQL}
              disabled={isSyncing}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50 transition-all"
            >
              <Database className={`w-3.5 h-3.5 ${isSyncing ? 'animate-pulse text-amber-300' : ''}`} />
              <span>{isSyncing ? 'Writing to SQL Server...' : 'Sync All Assets to SQL Server'}</span>
            </button>
          </div>
        </div>

        {/* Inline Configuration Box */}
        {showConfig && (
          <form onSubmit={handleSaveConfig} className="bg-slate-950 p-4 rounded-xl border border-indigo-500/40 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>SQL Server Express Credentials & Host</span>
              </span>
              <span className="text-[10px] text-slate-400">Settings save to local mssql_config.json</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">Server / Host</label>
                <input
                  type="text"
                  value={configForm.server}
                  onChange={e => setConfigForm({ ...configForm, server: e.target.value })}
                  placeholder="localhost or .\SQLEXPRESS"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">Port</label>
                <input
                  type="number"
                  value={configForm.port}
                  onChange={e => setConfigForm({ ...configForm, port: parseInt(e.target.value, 10) || 1433 })}
                  placeholder="1433"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">Database Name</label>
                <input
                  type="text"
                  value={configForm.database}
                  onChange={e => setConfigForm({ ...configForm, database: e.target.value })}
                  placeholder="EAMS_AssetDB"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">User ID</label>
                <input
                  type="text"
                  value={configForm.user}
                  onChange={e => setConfigForm({ ...configForm, user: e.target.value })}
                  placeholder="sa"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">Password</label>
                <input
                  type="password"
                  value={configForm.password}
                  onChange={e => setConfigForm({ ...configForm, password: e.target.value })}
                  placeholder="Your SQL Password"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {configMsg ? (
                <span className={`text-[11px] font-medium ${configMsg.success ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {configMsg.text}
                </span>
              ) : <span className="text-[10px] text-slate-500">Provide the SQL Server authentication password you set during installation.</span>}

              <button
                type="submit"
                disabled={isSavingConfig}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isSavingConfig ? 'Connecting...' : 'Save & Connect'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Sync notification banner */}
        {syncResult && (
          <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            syncResult.success 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
              : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
          }`}>
            {syncResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
            <span className="font-medium">{syncResult.message}</span>
          </div>
        )}

        {/* Connection status card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Database Status</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                dbStatus?.connected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {dbStatus?.connected ? 'SQL Server Connected' : 'Configuration Required'}
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {dbStatus?.message || 'SQL Server credentials not set. Click "Configure Connection" above to set your password.'}
            </p>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <span className="text-slate-400 font-medium">How to View Newly Added Assets in SSMS</span>
            <p className="text-[11px] text-slate-300">Run this query in SQL Server Management Studio to view your assets:</p>
            <div className="bg-slate-900 p-2 rounded text-[11px] font-mono text-amber-300 border border-slate-800 select-all">
              SELECT id, assetTag, name, purchaseCost, status, createdDate FROM dbo.Assets;
            </div>
          </div>
        </div>
      </div>

      {/* SUPER ADMIN PRODUCTION HANDOVER & DATA RESET HUB */}
      {currentRole === 'Super Admin' && (
        <div className="bg-gradient-to-br from-slate-900 via-rose-950/20 to-slate-900 border border-rose-500/40 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-rose-500/20 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-white text-sm">Customer Handover & Production Factory Reset</h2>
                  <span className="bg-rose-500/20 text-rose-300 text-[10px] px-2 py-0.5 rounded-full font-bold border border-rose-500/30">
                    Super Admin Only
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Purge all prefilled dummy records from project & SQL Server Express (<span className="text-rose-300 font-mono">dbo.Assets</span>, <span className="text-rose-300 font-mono">dbo.Vendors</span>, etc.) and reset reference sequences to start from 1.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadCompleteSQLBackup}
                disabled={isDownloadingSQL}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md border border-indigo-500/50 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
                title="Download full SQL backup of all actual project entries before running reset"
              >
                <Database className={`w-3.5 h-3.5 ${isDownloadingSQL ? 'animate-pulse text-amber-300' : 'text-amber-300'}`} />
                <span>{isDownloadingSQL ? 'Exporting SQL...' : 'Backup SQL Before Reset'}</span>
              </button>

              <button
                onClick={handleRestoreDemoData}
                disabled={isRestoringDemo}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3.5 py-2 rounded-xl text-xs border border-slate-700 cursor-pointer disabled:opacity-50 transition-all"
                title="Reload initial demo/sample data for testing or preview"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isRestoringDemo ? 'animate-spin text-amber-400' : 'text-amber-400'}`} />
                <span>{isRestoringDemo ? 'Restoring Demo...' : 'Reload Demo Data'}</span>
              </button>

              <button
                onClick={() => {
                  setShowResetModal(true);
                  setConfirmInput('');
                  setResetFeedback(null);
                }}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset for Customer Handover</span>
              </button>
            </div>
          </div>

          {/* Feedback banner if reset just executed */}
          {resetFeedback && (
            <div className={`p-4 rounded-xl border text-xs space-y-2 ${
              resetFeedback.success
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                {resetFeedback.success ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
                <span>{resetFeedback.message}</span>
              </div>
              {resetFeedback.tablesPurged && resetFeedback.tablesPurged.length > 0 && (
                <div className="text-[11px] text-slate-300">
                  <span className="font-semibold text-emerald-400">SQL Server Express Tables Cleared: </span>
                  <span className="font-mono">{resetFeedback.tablesPurged.join(', ')}</span>
                </div>
              )}
            </div>
          )}

          {/* Explanation cards for Customer Handover */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>1. Clean Production State</span>
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Clears all demo/sample assets, vendors, repairs, AMC contracts, tickets, and movement histories. Ready for the customer to enter their real assets and vendor details without any clutter.
              </p>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>2. Sequential Numbering Reset to 1</span>
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                All auto-generated codes restart from 1: Asset Tags start at <code className="text-amber-300 font-mono">0001</code>, Reference Numbers start at <code className="text-amber-300 font-mono">RF-YYYY-0001</code>, Vendor Codes start at <code className="text-amber-300 font-mono">VND-001</code>, and Ticket Numbers start at <code className="text-amber-300 font-mono">TKT-YYYY-0001</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUPER ADMIN PRODUCTION RESET CONFIRMATION */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Reset for Customer Handover</h3>
                  <p className="text-xs text-rose-400 font-medium">Production Database Purge & Re-index</p>
                </div>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-rose-950/30 border border-rose-500/30 p-3.5 rounded-xl space-y-2">
                <p className="text-rose-200 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Choose Reset Scope:</span>
                </p>

                <div className="space-y-2 pt-1">
                  <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    resetScope === 'operational'
                      ? 'bg-slate-900 border-amber-500/60 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="resetScope"
                      checked={resetScope === 'operational'}
                      onChange={() => setResetScope('operational')}
                      className="mt-0.5 text-amber-500 focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <p className="font-bold text-slate-100 text-xs">Operational Reset (Recommended)</p>
                      <p className="text-[11px] text-slate-400">
                        Purges all Assets, Vendors, Maintenance, AMCs, Tickets, Transfers, and Audits from both Project and SQL Server Express. Keeps Organization & Campus hierarchy.
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    resetScope === 'complete'
                      ? 'bg-slate-900 border-rose-500/60 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="resetScope"
                      checked={resetScope === 'complete'}
                      onChange={() => setResetScope('complete')}
                      className="mt-0.5 text-rose-500 focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <p className="font-bold text-slate-100 text-xs">Complete Clean Slate</p>
                      <p className="text-[11px] text-slate-400">
                        Purges ALL operational records PLUS dummy campuses, buildings, rooms, and extra users, keeping ONLY the Super Admin account and standard category taxonomies.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-[11px] text-slate-400">
                <span className="font-bold text-slate-300">What happens on reset:</span>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li>SQL Server Express tables (<code className="text-amber-300">dbo.Assets</code>, <code className="text-amber-300">dbo.Vendors</code>, etc.) will be cleared.</li>
                  <li>Local project cache (<code className="text-amber-300">eams_data.json</code>) will be emptied.</li>
                  <li>All serial numbers, reference numbers, asset tags, and vendor codes will restart at <strong className="text-emerald-400">#1</strong>.</li>
                </ul>
              </div>

              <div className="bg-indigo-950/40 border border-indigo-500/30 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Download Backup Snapshot First?</span>
                  </span>
                  <p className="text-[11px] text-slate-300">
                    Export all current live project entries to a <code className="text-amber-300">.sql</code> file before proceeding.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadCompleteSQLBackup}
                  disabled={isDownloadingSQL}
                  className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isDownloadingSQL ? 'Exporting...' : 'Export SQL Backup'}</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Type <span className="font-mono text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30">RESET</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder="RESET"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmInput.trim().toUpperCase() !== 'RESET' || isResetting}
                onClick={async () => {
                  await handleExecuteReset();
                  setShowResetModal(false);
                }}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-rose-600/30 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isResetting ? 'Purging All Data...' : 'Confirm Production Reset'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        
        {/* Architecture & DB Normalized Schema Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h2 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-2">
            <Server className="w-4 h-4 text-amber-400" />
            <span>Normalized MySQL 8 Database Architecture</span>
          </h2>

          <div className="space-y-2 text-slate-300">
            <p className="text-slate-400">The database features foreign key constraints and indexed columns for fast queries:</p>
            <ul className="space-y-1.5 list-disc list-inside text-slate-300">
              <li><strong className="text-amber-400 font-mono">organizations</strong> - Multi-org entity master (ARVD, ARVK, Corporate, PHC, Plant)</li>
              <li><strong className="text-amber-400 font-mono">campuses</strong> - Regional locations (Diguvamagham, Petamitta, Karakambadi, Tirupati)</li>
              <li><strong className="text-amber-400 font-mono">buildings</strong> - Building structures (Admin, High School, Hospital, Plant 1)</li>
              <li><strong className="text-amber-400 font-mono">floors & rooms</strong> - Room level granularity with room numbers & types</li>
              <li><strong className="text-amber-400 font-mono">assets</strong> - Asset master with 30+ fields, financial book values & barcode specs</li>
              <li><strong className="text-amber-400 font-mono">asset_transfers</strong> - Movement gate passes & approval workflows</li>
              <li><strong className="text-amber-400 font-mono">physical_verifications</strong> - Audit scans, GPS, photo proof</li>
              <li><strong className="text-amber-400 font-mono">audit_logs</strong> - System action logs</li>
            </ul>
          </div>
        </div>

        {/* cPanel / XAMPP Installation Guide */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h2 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>XAMPP / Linux cPanel Installation Steps</span>
          </h2>

          <div className="space-y-2.5 text-slate-300">
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 space-y-1">
              <p className="font-bold text-amber-400">Step 1: Database Setup in phpMyAdmin</p>
              <p className="text-[11px] text-slate-400">Create a database named <code className="text-slate-200">amara_raja_eams</code> in phpMyAdmin, then click "Import" and upload <code className="text-slate-200">amara_raja_eams_mysql8.sql</code>.</p>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 space-y-1">
              <p className="font-bold text-emerald-400">Step 2: Deployment Configuration</p>
              <p className="text-[11px] text-slate-400">Upload application build files into <code className="text-slate-200">public_html</code> or Apache webroot folder.</p>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 space-y-1">
              <p className="font-bold text-blue-400">Step 3: Verification & Mobile Camera</p>
              <p className="text-[11px] text-slate-400">Ensure SSL/HTTPS is enabled on domain so mobile browser camera permissions operate seamlessly for QR Code scanning.</p>
            </div>
          </div>
        </div>

        {/* Local Computer Execution Guide */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 md:col-span-2">
          <h2 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>How to Run this Project on your Local Computer</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-300 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded text-[10px]">Step 1</span>
              <p className="font-bold text-white text-sm">Prerequisites & Setup</p>
              <p className="text-slate-400">Install Node.js (v18+) and Git on your Windows, Mac, or Linux computer.</p>
              <pre className="bg-slate-900 p-2 rounded text-[11px] font-mono text-amber-300 border border-slate-800">node -v&#10;npm -v</pre>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded text-[10px]">Step 2</span>
              <p className="font-bold text-white text-sm">Install Dependencies</p>
              <p className="text-slate-400">Navigate to the project folder in terminal or command prompt and run:</p>
              <pre className="bg-slate-900 p-2 rounded text-[11px] font-mono text-emerald-300 border border-slate-800">npm install</pre>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded text-[10px]">Step 3</span>
              <p className="font-bold text-white text-sm">Start Local Dev Server</p>
              <p className="text-slate-400">Launch full-stack server (Express + React Vite with HMR):</p>
              <pre className="bg-slate-900 p-2 rounded text-[11px] font-mono text-blue-300 border border-slate-800">npm run dev</pre>
              <p className="text-[10px] text-slate-400">App will run live at: <code className="text-amber-400 font-bold">http://localhost:3000</code></p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
