import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  QrCode,
  Bell,
  Search,
  UserCheck,
  ChevronDown,
  ShieldCheck,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  LogOut,
  Palette,
  Check,
  Award,
  Sun,
  Moon,
  SlidersHorizontal,
  User as UserIcon
} from 'lucide-react';
import { Organization, UserRole, User, AppTheme, THEME_OPTIONS } from '../types';

interface HeaderProps {
  organizations: Organization[];
  selectedOrgId: string;
  onSelectOrg: (orgId: string) => void;
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  currentUser: User | null;
  onLogout: () => void;
  onOpenScanner: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  alertsCount: { amcDue: number; warrantyExpired: number; pendingTransfers: number };
  currentTheme: AppTheme;
  onOpenThemeModal: () => void;
  onSelectTheme?: (theme: AppTheme) => void;
}

export const Header: React.FC<HeaderProps> = ({
  organizations,
  selectedOrgId,
  onSelectOrg,
  currentRole,
  onChangeRole,
  currentUser,
  onLogout,
  onOpenScanner,
  searchQuery,
  onSearchChange,
  alertsCount,
  currentTheme,
  onOpenThemeModal,
  onSelectTheme
}) => {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showAlertsMenu, setShowAlertsMenu] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);

  const isSuperAdminUser = currentUser?.role === 'Super Admin';

  const rolesList: UserRole[] = isSuperAdminUser
    ? [
        'Super Admin',
        'Organization Admin',
        'Campus Admin',
        'Department Admin',
        'Store Keeper',
        'Asset Verifier',
        'Auditor',
        'Principal',
        'Viewer'
      ]
    : [
        'Organization Admin',
        'Campus Admin',
        'Department Admin',
        'Store Keeper',
        'Asset Verifier',
        'Auditor',
        'Principal',
        'Viewer'
      ];

  const totalAlerts = alertsCount.amcDue + alertsCount.warrantyExpired + alertsCount.pendingTransfers;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-bold p-2 rounded-xl shadow-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-100">AMARA RAJA</span>
                <span className="bg-amber-500/20 text-amber-400 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-semibold border border-amber-500/30">EAMS</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Enterprise Asset Management System</p>
            </div>
          </div>

          {/* Global Org Filter / Locked Badge */}
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/70 rounded-lg px-2.5 py-1.5 text-xs max-w-xs w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] text-slate-400 font-medium shrink-0 hidden md:inline">Org:</span>
            {isSuperAdminUser ? (
              <select
                value={selectedOrgId}
                onChange={(e) => onSelectOrg(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none w-full cursor-pointer pr-1"
              >
                <option value="ALL" className="bg-slate-800 text-white">All Organizations (Amara Raja Group)</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id} className="bg-slate-800 text-white">
                    {org.shortCode} - {org.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs truncate">
                <span className="bg-amber-500/20 px-2 py-0.5 rounded text-[11px] border border-amber-500/30">
                  {organizations[0]?.shortCode || currentUser?.organizationId || 'ORG'}
                </span>
                <span className="text-slate-200 text-[11px] truncate hidden sm:inline">
                  {organizations[0]?.name || currentUser?.organizationId}
                </span>
              </div>
            )}
          </div>

          {/* Quick Search */}
          <div className="hidden xl:flex items-center relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Tag, Asset ID, Serial #..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-slate-800 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-500 w-full transition-all"
            />
          </div>

          {/* Action Tools: Quick QR Scan, Alerts, Role Switcher, User Profile & Logout */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Quick QR Scan Mobile Button */}
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg text-xs transition-all shadow-md active:scale-95 cursor-pointer"
              title="Scan QR Code for Asset Verification"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Scan QR</span>
            </button>

            {/* Theme Selector Trigger Button & Quick Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors cursor-pointer group"
                title="Change Frontend Theme (16 Enterprise Themes)"
              >
                <Palette className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform shrink-0" />
                <span className="hidden xl:inline text-xs font-semibold text-slate-200 max-w-[110px] truncate">
                  {THEME_OPTIONS.find((t) => t.id === currentTheme)?.name.split(' ')[0] || 'Theme'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {showThemeDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 text-xs z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-amber-400" />
                        Official Theme Switcher
                      </p>
                      <p className="text-[10px] text-slate-400">Instant front-end visual change</p>
                    </div>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded border border-blue-500/30">
                      16 Themes
                    </span>
                  </div>

                  {/* Quick Official Presets */}
                  <div className="p-2 space-y-1 max-h-72 overflow-y-auto">
                    <p className="text-[10px] uppercase font-bold text-slate-400 px-2 pt-1 pb-1 tracking-wider">
                      Official & Enterprise Standards
                    </p>
                    {THEME_OPTIONS.filter((t) => t.isOfficial).map((t) => {
                      const isCurrent = currentTheme === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            if (onSelectTheme) onSelectTheme(t.id);
                            setShowThemeDropdown(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 font-bold'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="w-3 h-3 rounded-full border border-slate-600 shrink-0"
                              style={{ backgroundColor: t.accentColor }}
                            />
                            <div className="truncate">
                              <p className="truncate text-xs font-semibold leading-tight">{t.name}</p>
                              <p className="text-[10px] text-slate-400 truncate leading-tight">{t.badgeLabel}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-slate-800 text-slate-400">
                              {t.isDark ? 'Dark' : 'Light'}
                            </span>
                            {isCurrent && <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Footer Button: Open Complete Catalog */}
                  <div className="p-2 border-t border-slate-800 bg-slate-950/60">
                    <button
                      onClick={() => {
                        setShowThemeDropdown(false);
                        onOpenThemeModal();
                      }}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                      <span>Browse All 16 Themes Catalog...</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowAlertsMenu(!showAlertsMenu)}
                className="relative p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
                title="System Notifications"
              >
                <Bell className="w-3.5 h-3.5" />
                {totalAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {totalAlerts}
                  </span>
                )}
              </button>

              {showAlertsMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 text-xs z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                    <span className="font-bold text-slate-200">System Alerts & Expiries</span>
                    <span className="bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-semibold">{totalAlerts} Active</span>
                  </div>
                  <div className="space-y-2">
                    {alertsCount.amcDue > 0 && (
                      <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-800/50 p-2 rounded-lg text-amber-300">
                        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <p className="font-semibold">{alertsCount.amcDue} AMC Renewals Due Soon</p>
                          <p className="text-[10px] text-amber-400/80">Contracts expiring in &lt; 30 days</p>
                        </div>
                      </div>
                    )}
                    {alertsCount.warrantyExpired > 0 && (
                      <div className="flex items-center gap-2 bg-rose-950/40 border border-rose-800/50 p-2 rounded-lg text-rose-300">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <div>
                          <p className="font-semibold">{alertsCount.warrantyExpired} Warranties Expired</p>
                          <p className="text-[10px] text-rose-400/80">Requires AMC coverage review</p>
                        </div>
                      </div>
                    )}
                    {alertsCount.pendingTransfers > 0 && (
                      <div className="flex items-center gap-2 bg-blue-950/40 border border-blue-800/50 p-2 rounded-lg text-blue-300">
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                        <div>
                          <p className="font-semibold">{alertsCount.pendingTransfers} Pending Transfer Requests</p>
                          <p className="text-[10px] text-blue-400/80">Awaiting management approval</p>
                        </div>
                      </div>
                    )}
                    {totalAlerts === 0 && (
                      <p className="text-center text-slate-400 py-3">All system assets compliant & up to date!</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                title="Switch Role Perspective"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline">{currentRole}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 text-xs z-50">
                  <div className="px-3 py-2 border-b border-slate-800 text-slate-400 font-semibold">
                    Simulate Role Perspective:
                  </div>
                  {rolesList.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        onChangeRole(r);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800 cursor-pointer ${
                        currentRole === r ? 'text-amber-400 font-bold bg-slate-800/60' : 'text-slate-300'
                      }`}
                    >
                      <span>{r}</span>
                      {currentRole === r && <UserCheck className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Avatar & Profile Badge */}
            {currentUser && (
              <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-800">
                <img
                  src={
                    currentUser.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=0f172a&color=f59e0b`
                  }
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                />
                <div className="text-left hidden lg:block">
                  <p className="font-bold text-xs text-white leading-tight truncate max-w-[120px]">{currentUser.name}</p>
                  <p className="text-[10px] text-amber-400 font-semibold leading-tight">{currentUser.role}</p>
                </div>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer hover:border-rose-500/60"
              title="Logout & Switch Account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
