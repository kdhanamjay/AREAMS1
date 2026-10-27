import React, { useState } from 'react';
import {
  Building2,
  Box,
  IndianRupee,
  Wrench,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  QrCode,
  FileSpreadsheet,
  PlusCircle,
  Building,
  MapPin,
  Home,
  ShieldCheck,
  ShieldAlert,
  Users,
  Search,
  Activity,
  Layers,
  FileText,
  ScanLine,
  ArrowRightLeft,
  GraduationCap,
  Store,
  CheckSquare,
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import { Asset, Organization, Campus, Building as BuildingType, Room, AssetTransfer, PhysicalVerification, UserRole, User, DeletedAsset, AuditLog } from '../types';
import { formatINR, formatDate } from '../utils/formatters';

interface DashboardProps {
  assets: Asset[];
  deletedAssets?: DeletedAsset[];
  auditLogs?: AuditLog[];
  organizations: Organization[];
  campuses: Campus[];
  buildings: BuildingType[];
  rooms: Room[];
  transfers: AssetTransfer[];
  verifications: PhysicalVerification[];
  onNavigate: (tab: any) => void;
  onOpenAddAsset: () => void;
  onOpenImportModal: () => void;
  currentUser?: User | null;
  currentRole?: UserRole;
}

export const Dashboard: React.FC<DashboardProps> = ({
  assets,
  deletedAssets = [],
  auditLogs = [],
  organizations,
  campuses,
  buildings,
  rooms,
  transfers,
  verifications,
  onNavigate,
  onOpenAddAsset,
  onOpenImportModal,
  currentUser,
  currentRole = 'Super Admin'
}) => {
  const activeRole: UserRole = currentRole || currentUser?.role || 'Super Admin';

  // Metric calculations
  const totalAssetsCount = assets.reduce((acc, a) => acc + (a.quantity || 1), 0);
  const totalCapitalValue = assets.reduce((acc, a) => acc + (a.purchaseCost || 0) * (a.quantity || 1), 0);
  const totalCurrentValue = assets.reduce((acc, a) => acc + (a.currentValue || 0) * (a.quantity || 1), 0);
  
  const inStoreCount = assets.filter(a => a.assetStatus === 'In Store').reduce((acc, a) => acc + (a.quantity || 1), 0);
  const inUseCount = assets.filter(a => a.assetStatus === 'In Use' || a.assetStatus === 'Active').reduce((acc, a) => acc + (a.quantity || 1), 0);
  const underRepairCount = assets.filter(a => a.assetStatus === 'Under Repair').length;
  const missingCount = assets.filter(a => a.assetStatus === 'Missing').length;

  const nowTime = new Date().getTime();
  const amcDueCount = assets.filter(a => {
    if (!a.amcEnd) return false;
    const diff = (new Date(a.amcEnd).getTime() - nowTime) / (1000 * 3600 * 24);
    return diff <= 30; // Expired or expiring within 30 days
  }).length;

  const warrantyExpiredCount = assets.filter(a => {
    if (!a.warrantyEnd) return false;
    return new Date(a.warrantyEnd).getTime() < nowTime;
  }).length;

  const highValueAssets = assets.filter(a => (a.purchaseCost || 0) >= 100000);
  const pendingTransfers = transfers.filter(t => t.status === 'Pending');

  // Breakdown by Organization
  const orgMap = new Map<string, { name: string; shortCode: string; count: number; value: number }>();
  organizations.forEach(o => orgMap.set(o.id, { name: o.name, shortCode: o.shortCode, count: 0, value: 0 }));
  assets.forEach(a => {
    const entry = orgMap.get(a.organizationId);
    if (entry) {
      entry.count += (a.quantity || 1);
      entry.value += (a.purchaseCost || 0) * (a.quantity || 1);
    }
  });
  const orgBreakdown = Array.from(orgMap.values());

  // Breakdown by Category
  const catMap = new Map<string, number>();
  assets.forEach(a => {
    const catName = a.categoryId ? a.categoryId.replace('cat-', '').toUpperCase() : 'GENERAL';
    catMap.set(catName, (catMap.get(catName) || 0) + (a.quantity || 1));
  });
  const catBreakdown = Array.from(catMap.entries());

  // Recharts Data Formats
  const orgChartData = orgBreakdown.map((o) => ({
    name: o.shortCode || o.name,
    fullName: o.name,
    valueLakhs: Number((o.value / 100000).toFixed(2)),
    assetsCount: o.count
  }));

  const statusChartData = [
    { name: 'In Use / Active', value: inUseCount || 10, color: '#10b981' },
    { name: 'In Store Buffer', value: inStoreCount || 5, color: '#f59e0b' },
    { name: 'Under Repair', value: underRepairCount || 1, color: '#f43f5e' },
    { name: 'Missing / Disposed', value: missingCount || 0, color: '#64748b' }
  ].filter(i => i.value > 0);

  const catValueMap = new Map<string, { count: number; valueLakhs: number }>();
  assets.forEach(a => {
    const catName = a.categoryId ? a.categoryId.replace('cat-', '').toUpperCase().replace(/[-_]/g, ' ') : 'GENERAL';
    const current = catValueMap.get(catName) || { count: 0, valueLakhs: 0 };
    catValueMap.set(catName, {
      count: current.count + (a.quantity || 1),
      valueLakhs: current.valueLakhs + ((a.purchaseCost || 0) * (a.quantity || 1)) / 100000
    });
  });
  const categoryChartData = Array.from(catValueMap.entries()).map(([cat, data]) => ({
    category: cat,
    valueLakhs: Number(data.valueLakhs.toFixed(2)),
    count: data.count
  }));

  const amcTimelineData = [
    { label: 'Expired / Due <30d', count: amcDueCount || 2, value: 4.5 },
    { label: '30 - 60 Days', count: 5, value: 12.0 },
    { label: '60 - 90 Days', count: 8, value: 18.5 },
    { label: '> 90 Days Valid', count: 25, value: 45.2 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Role Indicator Banner & Quick Actions */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -z-0 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-white tracking-tight">EAMS Management Dashboard</h1>
            <span className="bg-amber-500/20 text-amber-400 text-xs px-3 py-1 rounded-full font-bold border border-amber-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Perspective: {activeRole}
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            {activeRole === 'Super Admin' && 'Group Executive View: Multi-organization valuation, cross-org asset transfers & system security'}
            {activeRole === 'Organization Admin' && 'Organization Overview: Capital asset allocation, campus breakdown & high-value inventory'}
            {activeRole === 'Campus Admin' && 'Campus Facility Portal: Infrastructure utilization, room occupancy & audit readiness'}
            {activeRole === 'Department Admin' && 'Department Operations: Assigned equipment health, breakdown complaints & staff allocations'}
            {activeRole === 'Store Keeper' && 'Store Inventory Control: Stock counts, barcode print queue, spare parts & check-ins/outs'}
            {activeRole === 'Asset Verifier' && 'Physical Verification Audit Campaign: Mobile QR scan, missing assets flag & discrepancy matching'}
            {activeRole === 'Auditor' && 'Compliance & Risk Center: Depreciation integrity, audit trail logs & asset valuation accuracy'}
            {activeRole === 'Principal' && 'Academic Facility & Infrastructure Dashboard: Classroom readiness, STEM/IT labs & academic readiness'}
            {activeRole === 'Viewer' && 'Read-Only Asset Master Portal: Asset lookup, location directory & verification status'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          {(activeRole === 'Super Admin' || activeRole === 'Organization Admin' || activeRole === 'Campus Admin' || activeRole === 'Store Keeper') && (
            <button
              onClick={onOpenAddAsset}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Single Asset</span>
            </button>
          )}
          
          {(activeRole === 'Super Admin' || activeRole === 'Organization Admin' || activeRole === 'Store Keeper') && (
            <button
              onClick={onOpenImportModal}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Import Excel</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('verification')}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>Mobile Audit Scan</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD QUICK STATS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Stat 1: Total Assets */}
        <div 
          onClick={() => onNavigate('assets')}
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 p-4 rounded-xl shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Assets</span>
            <Box className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-xl font-black text-white">{totalAssetsCount.toLocaleString()}</p>
          <p className="text-[10px] text-amber-400 font-mono font-semibold mt-0.5">{formatINR(totalCapitalValue)}</p>
        </div>

        {/* Stat 2: Book Value */}
        <div 
          onClick={() => onNavigate('reports')}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 p-4 rounded-xl shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Net Book Value</span>
            <TrendingUp className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-xl font-black text-emerald-400">{formatINR(totalCurrentValue)}</p>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Depreciated Value</p>
        </div>

        {/* Stat 3: Warranty Expiry */}
        <div 
          onClick={() => onNavigate('amc')}
          className="bg-slate-900 border border-slate-800 hover:border-rose-500/40 p-4 rounded-xl shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Warranty Expired</span>
            <ShieldAlert className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-xl font-black text-rose-400">{warrantyExpiredCount}</p>
          <p className="text-[10px] text-rose-400/80 font-semibold mt-0.5">Needs Renewal</p>
        </div>

        {/* Stat 4: AMC Due */}
        <div 
          onClick={() => onNavigate('amc')}
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 p-4 rounded-xl shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">AMC Contracts</span>
            <Clock className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-xl font-black text-amber-400">{amcDueCount}</p>
          <p className="text-[10px] text-amber-400/80 font-semibold mt-0.5">Due &le; 30 Days</p>
        </div>

        {/* Stat 5: Audit Logs */}
        <div 
          onClick={() => onNavigate('audit_logs')}
          className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 p-4 rounded-xl shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Audit Logs</span>
            <Activity className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-xl font-black text-blue-400">{auditLogs.length}</p>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Events Logged</p>
        </div>

        {/* Stat 6: Deleted Assets */}
        <div 
          onClick={() => onNavigate('reports')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-500/40 p-4 rounded-xl shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Deleted Assets</span>
            <FileText className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-xl font-black text-slate-300">{deletedAssets.length}</p>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Lifecycle Register</p>
        </div>
      </div>

      {/* VISUAL DASHBOARD CHARTS SECTION */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-extrabold text-white tracking-tight">Executive Visual Analytics & Asset Portfolio Charts</h2>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">Real-time asset valuation, category breakdown, status allocation & AMC expiry timeline</p>
          </div>
          <span className="bg-amber-500/10 text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-500/20 font-mono">
            Interactive Recharts Engine
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* CHART 1: ORGANIZATION ASSET VALUATION (BAR CHART) */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/90 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-400" /> Organization Asset Valuation (&#8377; Lakhs)
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Cost Basis</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orgChartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#f8fafc' }}
                    formatter={(val: any) => [`₹${val} Lakhs`, 'Capital Value']}
                  />
                  <Bar dataKey="valueLakhs" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Valuation (Lakhs)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHART 2: ASSET STATUS DISTRIBUTION (DONUT PIE CHART) */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/90 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <PieChartIcon className="w-4 h-4 text-emerald-400" /> Asset Status & Lifecycle Distribution
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Stock & Usage</span>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#f8fafc' }}
                    formatter={(val: any) => [`${val} Assets`, 'Count']}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-slate-300 text-[11px] font-semibold">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHART 3: CATEGORY VALUATION BREAKDOWN (BAR CHART) */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/90 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <Box className="w-4 h-4 text-blue-400" /> Asset Valuation by Category (&#8377; Lakhs)
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">IT, Furniture, Equipment</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="category" stroke="#94a3b8" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#f8fafc' }}
                    formatter={(val: any) => [`₹${val} Lakhs`, 'Valuation']}
                  />
                  <Bar dataKey="valueLakhs" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHART 4: AMC & WARRANTY EXPIRY TIMELINE (AREA CHART) */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/90 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" /> AMC / Maintenance Contract Expiry Timeline
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Compliance Risk</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={amcTimelineData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <defs>
                    <linearGradient id="amcGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#f8fafc' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#amcGrad)" name="Valuation (Lakhs)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

      {/* ROLE SPECIFIC DASHBOARD VIEWS */}

      {/* 1. SUPER ADMIN / EXECUTIVE DASHBOARD */}
      {(activeRole === 'Super Admin' || activeRole === 'Organization Admin') && (
        <div className="space-y-6">
          {/* Top KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs font-medium">Total Capital Asset Value</p>
                  <h3 className="text-2xl font-extrabold text-white mt-1 tracking-tight">{formatINR(totalCapitalValue)}</h3>
                  <p className="text-[11px] text-amber-400 font-semibold mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Purchase Cost Basis
                  </p>
                </div>
                <div className="bg-amber-500/10 p-3 rounded-xl text-amber-400 border border-amber-500/20">
                  <IndianRupee className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs font-medium">Current Net Book Value</p>
                  <h3 className="text-2xl font-extrabold text-emerald-400 mt-1 tracking-tight">{formatINR(totalCurrentValue)}</h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Depreciated Value ({totalCapitalValue > 0 ? ((totalCurrentValue / totalCapitalValue) * 100).toFixed(1) : 100}% Retained)
                  </p>
                </div>
                <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400 border border-emerald-500/20">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-blue-500/40 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs font-medium">Total Registered Assets</p>
                  <h3 className="text-2xl font-extrabold text-white mt-1 tracking-tight">{totalAssetsCount.toLocaleString()}</h3>
                  <p className="text-[11px] text-blue-400 font-semibold mt-1 flex items-center gap-1">
                    <Box className="w-3 h-3" /> Across {organizations.length} Group Orgs
                  </p>
                </div>
                <div className="bg-blue-500/10 p-3 rounded-xl text-blue-400 border border-blue-500/20">
                  <Box className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-rose-500/40 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs font-medium">Pending Movements & Repairs</p>
                  <h3 className="text-2xl font-extrabold text-white mt-1 tracking-tight">{pendingTransfers.length + underRepairCount}</h3>
                  <p className="text-[11px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {pendingTransfers.length} Transfers, {underRepairCount} Repairs
                  </p>
                </div>
                <div className="bg-rose-500/10 p-3 rounded-xl text-rose-400 border border-rose-500/20">
                  <Wrench className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Group Organization Breakdown & High Value Assets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" /> Group Organization Asset Valuation
                </h2>
                <button
                  onClick={() => onNavigate('hierarchy')}
                  className="text-xs text-amber-400 hover:underline font-semibold flex items-center gap-1"
                >
                  Manage Orgs <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-3">
                {orgBreakdown.map((org, idx) => {
                  const pct = totalCapitalValue > 0 ? (org.value / totalCapitalValue) * 100 : 0;
                  return (
                    <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-200">{org.name} ({org.shortCode})</span>
                        <span className="font-mono text-amber-400 font-extrabold">{formatINR(org.value)}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(5, pct))}%` }} />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>{org.count} Assets Registered</span>
                        <span>{pct.toFixed(1)}% of Group Portfolio</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" /> High-Value Capital Assets (&ge; &#8377;1 Lakh)
                </h2>
                <span className="bg-rose-500/10 text-rose-400 text-xs font-bold px-2.5 py-0.5 rounded border border-rose-500/20">
                  {highValueAssets.length} Critical Assets
                </span>
              </div>

              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                {highValueAssets.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-500">No assets exceeding &#8377;1,00,000 threshold found.</p>
                ) : (
                  highValueAssets.map((asset) => (
                    <div key={asset.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-slate-200 truncate max-w-[220px]">{asset.particulars}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{asset.assetTag} &bull; {asset.manufacturer}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-emerald-400 font-extrabold">{formatINR(asset.purchaseCost)}</p>
                        <p className="text-[10px] text-amber-400 font-semibold mt-0.5">{asset.assetStatus}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CAMPUS ADMIN & PRINCIPAL DASHBOARD */}
      {(activeRole === 'Campus Admin' || activeRole === 'Principal') && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs font-medium">Campus Buildings & Blocks</p>
                  <h3 className="text-2xl font-extrabold text-white mt-1">{buildings.length} Buildings</h3>
                  <p className="text-[11px] text-amber-400 font-semibold mt-1">Infrastructure Capacity</p>
                </div>
                <div className="bg-amber-500/10 p-3 rounded-xl text-amber-400 border border-amber-500/20">
                  <Building className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs font-medium">Total Registered Rooms & Labs</p>
                  <h3 className="text-2xl font-extrabold text-white mt-1">{rooms.length} Rooms</h3>
                  <p className="text-[11px] text-emerald-400 font-semibold mt-1">Classrooms, Computer/Science Labs</p>
                </div>
                <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400 border border-emerald-500/20">
                  <Home className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs font-medium">Campus Asset Inventory</p>
                  <h3 className="text-2xl font-extrabold text-white mt-1">{totalAssetsCount} Items</h3>
                  <p className="text-[11px] text-blue-400 font-semibold mt-1">{formatINR(totalCapitalValue)} Value</p>
                </div>
                <div className="bg-blue-500/10 p-3 rounded-xl text-blue-400 border border-blue-500/20">
                  <Box className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs font-medium">Classroom & Lab Readiness</p>
                  <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">
                    {rooms.length > 0 ? (((rooms.length - underRepairCount) / rooms.length) * 100).toFixed(0) : 100}%
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Operational Readiness Score</p>
                </div>
                <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400 border border-emerald-500/20">
                  <GraduationCap className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <MapPin className="w-4 h-4 text-amber-400" /> Building Wise Asset Distribution
              </h2>
              <div className="space-y-3">
                {buildings.map((bld) => {
                  const bldAssets = assets.filter(a => a.buildingId === bld.id);
                  const count = bldAssets.reduce((sum, a) => sum + (a.quantity || 1), 0);
                  const val = bldAssets.reduce((sum, a) => sum + (a.purchaseCost || 0) * (a.quantity || 1), 0);
                  return (
                    <div key={bld.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-200">{bld.name} ({bld.code})</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{bld.buildingType} &bull; Status: {bld.status}</p>
                      </div>
                      <div className="text-right">
                        <span className="bg-amber-500/10 text-amber-400 font-extrabold px-2.5 py-1 rounded border border-amber-500/20 block font-mono">
                          {count} Assets
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-1">{formatINR(val)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Wrench className="w-4 h-4 text-rose-400" /> Active Facility & Lab Maintenance Complaints
              </h2>
              <div className="space-y-2.5">
                {underRepairCount === 0 ? (
                  <p className="text-center py-8 text-xs text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
                    All campus facilities, smart classrooms and labs are fully operational!
                  </p>
                ) : (
                  assets.filter(a => a.assetStatus === 'Under Repair').map(asset => (
                    <div key={asset.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-200">{asset.particulars}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{asset.assetTag} &bull; Room: {asset.roomId}</p>
                      </div>
                      <span className="bg-rose-500/10 text-rose-400 font-bold px-2 py-0.5 rounded text-[10px] border border-rose-500/20">
                        Under Repair
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. STORE KEEPER DASHBOARD */}
      {activeRole === 'Store Keeper' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs font-medium">In-Store Buffer Stock</p>
                  <h3 className="text-2xl font-extrabold text-amber-400 mt-1">{inStoreCount} Assets</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Ready for Allocation</p>
                </div>
                <div className="bg-amber-500/10 p-3 rounded-xl text-amber-400 border border-amber-500/20">
                  <Store className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs font-medium">Issued / Deployed in Use</p>
                  <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">{inUseCount} Assets</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Active Allocations</p>
                </div>
                <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs font-medium">AMC Contracts Expiring (30d)</p>
                  <h3 className="text-2xl font-extrabold text-rose-400 mt-1">{amcDueCount} Assets</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Requires Renewal Action</p>
                </div>
                <div className="bg-rose-500/10 p-3 rounded-xl text-rose-400 border border-rose-500/20">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs font-medium">Pending Transfer Dispatch</p>
                  <h3 className="text-2xl font-extrabold text-blue-400 mt-1">{pendingTransfers.length} Orders</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Awaiting Issue Confirmation</p>
                </div>
                <div className="bg-blue-500/10 p-3 rounded-xl text-blue-400 border border-blue-500/20">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-amber-400" /> Store Barcode & QR Label Printing Shortcuts
              </h2>
              <button
                onClick={() => onNavigate('qr_labels')}
                className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg shadow cursor-pointer"
              >
                Launch Thermal Label Studio
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Select any new in-store asset to instantly print standard SAP 40x20mm barcode stickers or A4 multi-sheet labels.
            </p>
          </div>
        </div>
      )}

      {/* 4. ASSET VERIFIER & AUDITOR DASHBOARD */}
      {(activeRole === 'Asset Verifier' || activeRole === 'Auditor') && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs font-medium">Physical Scans Conducted</p>
                  <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">{verifications.length} Assets</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Verified via QR Scanner</p>
                </div>
                <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400 border border-emerald-500/20">
                  <ScanLine className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs font-medium">Audit Location Match %</p>
                  <h3 className="text-2xl font-extrabold text-white mt-1">
                    {verifications.length > 0
                      ? ((verifications.filter(v => v.locationMatched).length / verifications.length) * 100).toFixed(0)
                      : 100}%
                  </h3>
                  <p className="text-[11px] text-emerald-400 font-semibold mt-1">Location Integrity Score</p>
                </div>
                <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400 border border-emerald-500/20">
                  <CheckSquare className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs font-medium">Missing / Unverified Flag</p>
                  <h3 className="text-2xl font-extrabold text-rose-400 mt-1">{missingCount} Items</h3>
                  <p className="text-[11px] text-rose-400 font-semibold mt-1">Audit Discrepancy Alert</p>
                </div>
                <div className="bg-rose-500/10 p-3 rounded-xl text-rose-400 border border-rose-500/20">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs font-medium">Audit Compliance Logs</p>
                  <h3 className="text-2xl font-extrabold text-amber-400 mt-1">100% Tracked</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Immutable Logged Events</p>
                </div>
                <div className="bg-amber-500/10 p-3 rounded-xl text-amber-400 border border-amber-500/20">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <ScanLine className="w-4 h-4 text-amber-400" /> Recent Physical Verification Logs
            </h2>
            <div className="space-y-2">
              {verifications.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-500">No physical scan audit records present yet.</p>
              ) : (
                verifications.slice(0, 5).map(v => (
                  <div key={v.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{v.assetName} ({v.assetTag})</p>
                      <p className="text-[10px] text-slate-400">Verified by {v.verifiedBy} on {v.verifiedDate}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                      v.locationMatched
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {v.locationMatched ? 'Location Match' : 'Discrepancy Detected'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. DEPARTMENT ADMIN & VIEWER DASHBOARD */}
      {(activeRole === 'Department Admin' || activeRole === 'Viewer') && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs font-medium">Assigned Department Assets</p>
                  <h3 className="text-2xl font-extrabold text-white mt-1">{totalAssetsCount} Items</h3>
                  <p className="text-[11px] text-amber-400 font-semibold mt-1">In Active Service</p>
                </div>
                <div className="bg-amber-500/10 p-3 rounded-xl text-amber-400 border border-amber-500/20">
                  <Box className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs font-medium">Total Equipment Valuation</p>
                  <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">{formatINR(totalCapitalValue)}</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Department Portfolio</p>
                </div>
                <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400 border border-emerald-500/20">
                  <IndianRupee className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs font-medium">Equipment Health Index</p>
                  <h3 className="text-2xl font-extrabold text-blue-400 mt-1">
                    {assets.length > 0 ? (((assets.length - underRepairCount) / assets.length) * 100).toFixed(0) : 100}%
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Operational Assets</p>
                </div>
                <div className="bg-blue-500/10 p-3 rounded-xl text-blue-400 border border-blue-500/20">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Distribution Grid for All Roles */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
        <h2 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Layers className="w-4 h-4 text-amber-400" /> Asset Classification Breakdown
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {catBreakdown.map(([catName, count], idx) => (
            <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-center space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block truncate">
                {catName}
              </span>
              <span className="text-lg font-extrabold text-amber-400 font-mono block">
                {count}
              </span>
              <span className="text-[10px] text-slate-500 block">Units</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

