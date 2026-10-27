import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  Lock,
  UserCheck,
  ArrowRight,
  Key,
  CheckCircle2,
  ArrowLeft,
  ChevronRight,
  Globe,
  Eye,
  EyeOff
} from 'lucide-react';
import { User, Organization } from '../types';

interface LoginModalProps {
  users?: User[];
  organizations?: Organization[];
  onLogin?: (user: User) => void;
  onSelectUser?: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  users = [],
  organizations = [],
  onLogin,
  onSelectUser
}) => {
  const userList = users || [];
  const orgList = organizations || [];

  // Stage 1: null (show Organization selection first)
  // Stage 2: selected Organization ID string
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Filter users based on selected organization
  const filteredUsers = React.useMemo(() => {
    if (!selectedOrgId) return [];
    if (selectedOrgId === 'GLOBAL_SUPERADMIN') {
      return userList.filter((u) => u.role === 'Super Admin');
    }
    return userList.filter(
      (u) => u.organizationId === selectedOrgId || u.role === 'Super Admin'
    );
  }, [selectedOrgId, userList]);

  // When an organization is selected
  const handleSelectOrganization = (orgId: string) => {
    setSelectedOrgId(orgId);
    let relevantUsers: User[] = [];
    if (orgId === 'GLOBAL_SUPERADMIN') {
      relevantUsers = userList.filter((u) => u.role === 'Super Admin');
    } else {
      relevantUsers = userList.filter(
        (u) => u.organizationId === orgId || u.role === 'Super Admin'
      );
    }
    const firstUser = relevantUsers[0] || userList[0];
    if (firstUser) {
      setSelectedUserId(firstUser.id);
      setPasswordInput(firstUser.password || 'SuperAdmin#2026!');
    }
  };

  // When a user card is selected
  const handleSelectUserCard = (usr: User) => {
    setSelectedUserId(usr.id);
    setPasswordInput(usr.password || 'SuperAdmin#2026!');
  };

  const selectedUser = userList.find((u) => u.id === selectedUserId) || filteredUsers[0];

  const handlePerformLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsLoggingIn(true);
    setTimeout(() => {
      if (onLogin) onLogin(selectedUser);
      if (onSelectUser) onSelectUser(selectedUser);
      setIsLoggingIn(false);
    }, 350);
  };

  const selectedOrgObj = orgList.find((o) => o.id === selectedOrgId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 p-2.5 rounded-2xl shadow-xl flex items-center justify-center font-black">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight">AMARA RAJA</span>
                <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
                  EAMS v2.4
                </span>
              </div>
              <p className="text-slate-400 text-xs">
                {selectedOrgId ? 'Organization Account Authentication' : 'Enterprise Portal - Select Organization'}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/70 text-slate-300">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit SSL Encrypted</span>
          </div>
        </div>

        {/* STAGE 1: ORGANIZATION SELECTION FIRST */}
        {!selectedOrgId ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" /> Select Organization to Enter Portal
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Choose your organization to view relevant role logins & credentials
                </p>
              </div>
              <span className="text-[10px] bg-slate-800 text-amber-300 px-2.5 py-1 rounded-lg font-mono border border-slate-700">
                {orgList.length} Organizations
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              
              {/* GLOBAL SUPER ADMIN CARD */}
              <div
                onClick={() => handleSelectOrganization('GLOBAL_SUPERADMIN')}
                className="p-4 rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 hover:border-amber-400 transition-all cursor-pointer flex items-center justify-between group shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-white group-hover:text-amber-300 transition-colors">
                      Super Admin / Global Access
                    </h4>
                    <p className="text-[10px] text-amber-400 font-semibold mt-0.5">
                      Full System Control Across All Organizations
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>

              {/* ORGANIZATION CARDS */}
              {orgList.map((org) => {
                const userCount = userList.filter((u) => u.organizationId === org.id).length;
                return (
                  <div
                    key={org.id}
                    onClick={() => handleSelectOrganization(org.id)}
                    className="p-4 rounded-2xl border border-slate-800 bg-slate-950/70 hover:bg-slate-800/80 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-extrabold text-xs shrink-0">
                        {org.shortCode}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-white truncate group-hover:text-amber-300 transition-colors">
                          {org.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {org.shortCode} &bull; {userCount} Role Logins
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                );
              })}

            </div>
          </div>
        ) : (
          /* STAGE 2: RELEVANT LOGINS FOR SELECTED ORGANIZATION */
          <form onSubmit={handlePerformLogin} className="p-6 space-y-5">
            
            {/* Back button & Selected Organization Title */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => setSelectedOrgId(null)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors bg-slate-800/60 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 cursor-pointer font-bold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Organization</span>
              </button>

              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-amber-400 font-extrabold">Active Portal</span>
                <p className="text-xs font-bold text-white">
                  {selectedOrgId === 'GLOBAL_SUPERADMIN' ? 'Super Admin Global Portal' : selectedOrgObj?.name || 'Selected Organization'}
                </p>
              </div>
            </div>

            {/* Relevant Logins List */}
            <div>
              <label className="block text-slate-300 text-xs font-bold mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" /> Available Roles & Logins
                </span>
                <span className="text-[11px] text-slate-500 font-normal">
                  {filteredUsers.length} Authorized Accounts
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {filteredUsers.map((usr) => {
                  const isSelected = usr.id === selectedUserId;

                  return (
                    <div
                      key={usr.id}
                      onClick={() => handleSelectUserCard(usr)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-lg'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <img
                        src={
                          usr.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(usr.name)}&background=0f172a&color=f59e0b`
                        }
                        alt={usr.name}
                        className="w-9 h-9 rounded-xl border border-slate-700 shrink-0 object-cover mt-0.5"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-white truncate">{usr.name}</p>
                        <p className="text-[10px] text-amber-400 font-bold">{usr.role}</p>
                        <p className="text-[9.5px] text-slate-400 font-mono truncate mt-0.5">
                          Login: <span className="text-slate-300 font-semibold">{usr.username || usr.email}</span>
                        </p>
                        <p className="text-[9.5px] text-slate-500 font-mono">
                          Password: <span className="text-amber-400/90 font-semibold">{usr.password || 'SuperAdmin#2026!'}</span>
                        </p>
                      </div>

                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 absolute top-3 right-3" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Password Input & Direct Login Action */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" /> Account Security Password
                </span>
                {selectedUser && (
                  <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Role: {selectedUser.role}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter User Password"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-3 pr-10 py-2 text-xs focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn || !selectedUser}
                  className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{isLoggingIn ? 'Authenticating...' : `Log In as ${selectedUser?.name || 'User'}`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </form>
        )}

        {/* Footer info */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Amara Raja EAMS Security Portal</span>
          <span className="text-amber-400 font-semibold">Secure Multi-Organization Access Engine</span>
        </div>

      </div>
    </div>
  );
};
