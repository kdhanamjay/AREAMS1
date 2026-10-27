import React from 'react';
import {
  LayoutDashboard,
  Box,
  Layers,
  Tags,
  ArrowRightLeft,
  ScanLine,
  Wrench,
  Clock,
  QrCode,
  FileText,
  History,
  Database,
  Building,
  Users,
  LifeBuoy,
  ChevronRight,
  Truck
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'assets'
  | 'hierarchy'
  | 'vendors'
  | 'tickets'
  | 'categories'
  | 'users'
  | 'transfers'
  | 'verification'
  | 'repairs'
  | 'amc'
  | 'qr_labels'
  | 'reports'
  | 'audit_logs'
  | 'database_guide';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  pendingTransfersCount: number;
  underRepairCount: number;
  openTicketsCount?: number;
  amcDueCount: number;
  allowedPages?: NavTab[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  pendingTransfersCount,
  underRepairCount,
  openTicketsCount = 0,
  amcDueCount,
  allowedPages
}) => {
  const allMenuItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'assets', label: 'Asset Master Register', icon: Box },
    { id: 'hierarchy', label: 'Org & Location Hierarchy', icon: Building },
    { id: 'vendors', label: 'Vendor Management', icon: Truck },
    {
      id: 'tickets',
      label: 'Ticket & Complaint Desk',
      icon: LifeBuoy,
      badge: openTicketsCount,
      badgeColor: 'bg-rose-500'
    },
    { id: 'categories', label: 'Categories & Subcategories', icon: Tags },
    { id: 'users', label: 'User & Access Control', icon: Users },
    {
      id: 'transfers',
      label: 'Asset Movements & Transfers',
      icon: ArrowRightLeft,
      badge: pendingTransfersCount,
      badgeColor: 'bg-blue-500'
    },
    { id: 'verification', label: 'Physical Verification (Scan)', icon: ScanLine },
    {
      id: 'repairs',
      label: 'Repair & Maintenance',
      icon: Wrench,
      badge: underRepairCount,
      badgeColor: 'bg-amber-500'
    },
    {
      id: 'amc',
      label: 'AMC & Warranty Tracking',
      icon: Clock,
      badge: amcDueCount,
      badgeColor: 'bg-rose-500'
    },
    { id: 'qr_labels', label: 'QR & Barcode Label Studio', icon: QrCode },
    { id: 'reports', label: 'Reports & Analytics', icon: FileText },
    { id: 'audit_logs', label: 'System Audit Logs', icon: History },
    { id: 'database_guide', label: 'Database & CPanel Guide', icon: Database }
  ];


  // Filter based on user allowedPages if provided
  const menuItems = allowedPages && allowedPages.length > 0
    ? allMenuItems.filter((item) => allowedPages.includes(item.id))
    : allMenuItems;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Main Modules</p>
        <span className="text-[10px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded border border-amber-500/20">
          {menuItems.length} Permitted
        </span>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`${item.badgeColor || 'bg-amber-500'} text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full`}>
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-400" />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-400">
        <p className="font-semibold text-slate-300">Amara Raja Group EAMS v2.4</p>
        <p className="text-slate-400">SAP-style Asset Master</p>
      </div>
    </aside>
  );
};
