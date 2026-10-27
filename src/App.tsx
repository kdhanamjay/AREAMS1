import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AssetMaster } from './components/AssetMaster';
import { AssetDetailModal } from './components/AssetDetailModal';
import { QRBarcodeModule } from './components/QRBarcodeModule';
import { MobileScannerVerification } from './components/MobileScannerVerification';
import { AssetTransferModule } from './components/AssetTransferModule';
import { OrgMaster } from './components/OrgMaster';
import { InfrastructureManagement } from './components/InfrastructureManagement';
import { CategoryMaster } from './components/CategoryMaster';
import { UserManagement } from './components/UserManagement';
import { RepairMaintenanceModule } from './components/RepairMaintenanceModule';
import { AMCAndWarrantyModule } from './components/AMCAndWarrantyModule';
import { TicketManagementModule } from './components/TicketManagementModule';
import { VendorManagement } from './components/VendorManagement';
import { ReportsModule } from './components/ReportsModule';
import { AuditLogModule } from './components/AuditLogModule';
import { DatabaseAndGuide } from './components/DatabaseAndGuide';
import { LoginModal } from './components/LoginModal';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { getUserAllowedPages, ALL_PAGES } from './utils/permissions';
import { Lock, ShieldAlert } from 'lucide-react';

import {
  Asset,
  Organization,
  Campus,
  Building,
  Floor,
  Room,
  Department,
  AssetCategory,
  AssetSubCategory,
  AssetTransfer,
  PhysicalVerification,
  RepairRecord,
  AMCRecord,
  AuditLog,
  User,
  UserRole,
  Ticket,
  AppTheme,
  DeletedAsset,
  Vendor
} from './types';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    organizations: Organization[];
    campuses: Campus[];
    buildings: Building[];
    floors: Floor[];
    rooms: Room[];
    departments: Department[];
    categories: AssetCategory[];
    subCategories: AssetSubCategory[];
    assets: Asset[];
    deletedAssets?: DeletedAsset[];
    transfers: AssetTransfer[];
    verifications: PhysicalVerification[];
    repairs: RepairRecord[];
    amcs: AMCRecord[];
    auditLogs: AuditLog[];
    users: User[];
    tickets: Ticket[];
    vendors?: Vendor[];
  }>({
    organizations: [],
    campuses: [],
    buildings: [],
    floors: [],
    rooms: [],
    departments: [],
    categories: [],
    subCategories: [],
    assets: [],
    deletedAssets: [],
    transfers: [],
    verifications: [],
    repairs: [],
    amcs: [],
    auditLogs: [],
    users: [],
    tickets: [],
    vendors: []
  });

  // App Navigation & Scope
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('eams_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    try {
      const savedRole = localStorage.getItem('eams_current_role');
      if (savedRole) return savedRole as UserRole;
      const savedUser = localStorage.getItem('eams_current_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u.role) return u.role;
      }
      return 'Super Admin';
    } catch {
      return 'Super Admin';
    }
  });

  const [selectedOrgId, setSelectedOrgId] = useState<string>(() => {
    try {
      const savedOrg = localStorage.getItem('eams_selected_org_id');
      if (savedOrg) return savedOrg;
      const savedUser = localStorage.getItem('eams_current_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u.role === 'Super Admin') return 'ALL';
        if (u.organizationId) return u.organizationId;
      }
      return 'ALL';
    } catch {
      return 'ALL';
    }
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Theme Management (16 Enterprise & Official Presets)
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('eams_app_theme') as AppTheme) || 'corporate-slate';
  });
  const [showThemeModal, setShowThemeModal] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.body.setAttribute('data-theme', currentTheme);
    localStorage.setItem('eams_app_theme', currentTheme);
  }, [currentTheme]);

  // Modals
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  const [labelPrintAsset, setLabelPrintAsset] = useState<Asset | null>(null);
  const [transferAsset, setTransferAsset] = useState<Asset | null>(null);
  const [showQuickScanner, setShowQuickScanner] = useState(false);

  // Fetch initial state
  const fetchData = async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const json = await res.json();
        setData(json);

        // Keep session synchronized with updated backend user record if exists
        const savedUserStr = localStorage.getItem('eams_current_user');
        if (savedUserStr) {
          try {
            const savedUser: User = JSON.parse(savedUserStr);
            const freshUser = json.users?.find((u: User) => u.id === savedUser.id);
            if (freshUser) {
              setCurrentUser(freshUser);
              localStorage.setItem('eams_current_user', JSON.stringify(freshUser));
            }
          } catch {
            // Keep existing state
          }
        }
      }
    } catch (err) {
      console.error('Failed to load EAMS backend data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    try {
      localStorage.setItem('eams_current_user', JSON.stringify(user));
      localStorage.setItem('eams_current_role', user.role);
    } catch (e) {
      console.error('Error saving user session:', e);
    }

    let targetOrg = 'ALL';
    if (user.role === 'Super Admin') {
      targetOrg = 'ALL';
    } else if (user.organizationId) {
      targetOrg = user.organizationId;
    }
    setSelectedOrgId(targetOrg);
    try {
      localStorage.setItem('eams_selected_org_id', targetOrg);
    } catch (e) {
      console.error('Error saving org selection:', e);
    }

    const allowed = getUserAllowedPages(user);
    if (!allowed.includes(activeTab)) {
      setActiveTab(allowed[0] || 'dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('eams_current_user');
      localStorage.removeItem('eams_current_role');
      localStorage.removeItem('eams_selected_org_id');
    } catch (e) {
      console.error('Error clearing user session:', e);
    }
  };

  const handleChangeRole = (role: UserRole) => {
    const isSuperAdminUser = currentUser?.role === 'Super Admin';
    if (!isSuperAdminUser && role === 'Super Admin') {
      return; // Non-SuperAdmin users cannot elevate to Super Admin
    }
    setCurrentRole(role);
    try {
      localStorage.setItem('eams_current_role', role);
    } catch (e) {
      console.error('Error saving role:', e);
    }

    if (currentUser) {
      const updatedUser = { ...currentUser, role };
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('eams_current_user', JSON.stringify(updatedUser));
      } catch (e) {
        console.error('Error saving updated user:', e);
      }

      if (role !== 'Super Admin' && currentUser.organizationId) {
        setSelectedOrgId(currentUser.organizationId);
        try {
          localStorage.setItem('eams_selected_org_id', currentUser.organizationId);
        } catch (e) {
          console.error('Error saving org:', e);
        }
      }
    }
  };

  // REST API Actions
  const handleSaveAsset = async (asset: Asset) => {
    const isUpdate = data.assets.some((a) => a.id === asset.id);
    const url = isUpdate ? `/api/assets/${asset.id}` : '/api/assets';
    const method = isUpdate ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'x-user-role': currentRole },
      body: JSON.stringify(asset)
    });

    if (res.ok) {
      await fetchData();
    }
  };

  const handleDeleteAsset = async (id: string, reason?: string) => {
    const res = await fetch(`/api/assets/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': currentRole,
        'x-user-name': currentUser?.name || 'Admin User'
      },
      body: JSON.stringify({
        reason: reason || 'Asset Disposed / Written Off',
        deletedBy: currentUser?.name || 'Admin User'
      })
    });
    if (res.ok) await fetchData();
  };

  const handleBulkImport = async (newAssets: Asset[]) => {
    const res = await fetch('/api/assets/bulk-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': currentRole },
      body: JSON.stringify({ assets: newAssets })
    });
    if (res.ok) await fetchData();
  };

  const handleRequestTransfer = async (transfer: AssetTransfer) => {
    const res = await fetch('/api/transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': currentRole },
      body: JSON.stringify(transfer)
    });
    if (res.ok) await fetchData();
  };

  const handleUpdateTransferStatus = async (id: string, status: 'Approved' | 'Rejected', approvedBy: string) => {
    const res = await fetch(`/api/transfers/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-role': currentRole },
      body: JSON.stringify({ status, approvedBy })
    });
    if (res.ok) await fetchData();
  };

  const handleSaveVerification = async (verification: PhysicalVerification) => {
    const res = await fetch('/api/verifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': currentRole },
      body: JSON.stringify(verification)
    });
    if (res.ok) await fetchData();
  };

  const handleSaveRepair = async (repair: RepairRecord) => {
    const res = await fetch('/api/repairs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': currentRole },
      body: JSON.stringify(repair)
    });
    if (res.ok) await fetchData();
  };

  const handleSaveOrganization = async (org: Organization) => {
    const res = await fetch('/api/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': currentRole },
      body: JSON.stringify(org)
    });
    if (res.ok) await fetchData();
  };

  const handleDeleteOrganization = async (id: string) => {
    const res = await fetch(`/api/organizations/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-role': currentRole }
    });
    if (res.ok) await fetchData();
  };

  const handleSaveCampus = async (cmp: Campus) => {
    const res = await fetch('/api/campuses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': currentRole },
      body: JSON.stringify(cmp)
    });
    if (res.ok) await fetchData();
  };

  const handleSaveBuilding = async (bld: Building) => {
    const res = await fetch('/api/buildings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': currentRole },
      body: JSON.stringify(bld)
    });
    if (res.ok) await fetchData();
  };

  const handleSaveRoom = async (rm: Room) => {
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': currentRole },
      body: JSON.stringify(rm)
    });
    if (res.ok) await fetchData();
  };

  const handleSaveDepartment = async (dept: Department) => {
    const res = await fetch('/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': currentRole },
      body: JSON.stringify(dept)
    });
    if (res.ok) await fetchData();
  };

  // Category & Subcategory Handlers
  const handleSaveCategory = async (cat: AssetCategory) => {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': currentRole },
      body: JSON.stringify({ category: cat })
    });
    if (res.ok) await fetchData();
  };

  const handleDeleteCategory = async (id: string) => {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-role': currentRole }
    });
    if (res.ok) await fetchData();
  };

  const handleSaveSubCategory = async (subCat: AssetSubCategory) => {
    const res = await fetch('/api/subcategories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': currentRole },
      body: JSON.stringify(subCat)
    });
    if (res.ok) await fetchData();
  };

  const handleDeleteSubCategory = async (id: string) => {
    const res = await fetch(`/api/subcategories/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-role': currentRole }
    });
    if (res.ok) await fetchData();
  };

  // User CRUD Handlers
  const handleSaveUser = async (user: User) => {
    const isUpdate = data.users.some((u) => u.id === user.id);
    const url = isUpdate ? `/api/users/${user.id}` : '/api/users';
    const method = isUpdate ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'x-user-role': currentRole },
      body: JSON.stringify(user)
    });
    if (res.ok) await fetchData();
  };

  const handleDeleteUser = async (id: string) => {
    const res = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-role': currentRole }
    });
    if (res.ok) await fetchData();
  };

  const handleBulkImportUsers = async (users: User[]) => {
    const res = await fetch('/api/users/bulk-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': currentRole },
      body: JSON.stringify({ users })
    });
    if (res.ok) await fetchData();
  };

  const handleDeleteCampus = async (id: string) => {
    const res = await fetch(`/api/campuses/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-role': currentRole }
    });
    if (res.ok) await fetchData();
  };

  const handleDeleteBuilding = async (id: string) => {
    const res = await fetch(`/api/buildings/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-role': currentRole }
    });
    if (res.ok) await fetchData();
  };

  const handleDeleteRoom = async (id: string) => {
    const res = await fetch(`/api/rooms/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-role': currentRole }
    });
    if (res.ok) await fetchData();
  };

  const handleDeleteDepartment = async (id: string) => {
    const res = await fetch(`/api/departments/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-role': currentRole }
    });
    if (res.ok) await fetchData();
  };

  const handleSaveAMC = async (amc: AMCRecord) => {
    const res = await fetch('/api/amcs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': currentRole },
      body: JSON.stringify(amc)
    });
    if (res.ok) await fetchData();
  };

  const handleDeleteAMC = async (id: string) => {
    const res = await fetch(`/api/amcs/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-role': currentRole }
    });
    if (res.ok) await fetchData();
  };

  const handleDeleteRepair = async (id: string) => {
    const res = await fetch(`/api/repairs/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-role': currentRole }
    });
    if (res.ok) await fetchData();
  };

  const handleDeleteTransfer = async (id: string) => {
    const res = await fetch(`/api/transfers/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-role': currentRole }
    });
    if (res.ok) await fetchData();
  };

  // Ticket CRUD Handlers
  const handleSaveTicket = async (ticket: Ticket) => {
    const isUpdate = (data.tickets || []).some((t) => t.id === ticket.id);
    const url = isUpdate ? `/api/tickets/${ticket.id}` : '/api/tickets';
    const method = isUpdate ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': currentRole,
        'x-user-name': currentUser?.name || 'Admin'
      },
      body: JSON.stringify(ticket)
    });
    if (res.ok) await fetchData();
  };

  const handleDeleteTicket = async (id: string) => {
    const res = await fetch(`/api/tickets/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-role': currentRole }
    });
    if (res.ok) await fetchData();
  };

  // Vendor CRUD Handlers
  const handleSaveVendor = async (vendor: Vendor) => {
    const isUpdate = (data.vendors || []).some((v) => v.id === vendor.id);
    const url = isUpdate ? `/api/vendors/${vendor.id}` : '/api/vendors';
    const method = isUpdate ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': currentRole,
        'x-user-name': currentUser?.name || 'Admin'
      },
      body: JSON.stringify(vendor)
    });
    if (res.ok) await fetchData();
  };

  const handleDeleteVendor = async (id: string) => {
    const res = await fetch(`/api/vendors/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-role': currentRole }
    });
    if (res.ok) await fetchData();
  };


  // Determine effective organization scope based on logged in user & role
  const isSuperAdminUser = currentUser?.role === 'Super Admin';
  const effectiveOrgId = (!isSuperAdminUser && currentUser?.organizationId)
    ? currentUser.organizationId
    : selectedOrgId;

  // Filter datasets based on effective organization ID
  const scopedOrganizations = data.organizations.filter((o) => {
    if (effectiveOrgId !== 'ALL' && o.id !== effectiveOrgId) return false;
    return true;
  });

  const scopedCampuses = data.campuses.filter((c) => {
    if (effectiveOrgId !== 'ALL' && c.organizationId !== effectiveOrgId) return false;
    return true;
  });

  const scopedBuildings = data.buildings.filter((b) => {
    if (effectiveOrgId !== 'ALL' && b.organizationId !== effectiveOrgId) return false;
    return true;
  });

  const scopedBuildingIds = new Set(scopedBuildings.map((b) => b.id));

  const scopedFloors = data.floors.filter((f) => {
    if (effectiveOrgId !== 'ALL' && !scopedBuildingIds.has(f.buildingId)) return false;
    return true;
  });

  const scopedRooms = data.rooms.filter((r) => {
    if (effectiveOrgId !== 'ALL' && !scopedBuildingIds.has(r.buildingId)) return false;
    return true;
  });

  const scopedDepartments = data.departments.filter((d) => {
    if (effectiveOrgId !== 'ALL' && d.organizationId !== effectiveOrgId) return false;
    return true;
  });

  const scopedAssets = data.assets.filter((a) => {
    if (effectiveOrgId !== 'ALL' && a.organizationId !== effectiveOrgId) return false;
    return true;
  });

  const scopedAssetIds = new Set(scopedAssets.map((a) => a.id));

  const scopedTickets = (data.tickets || []).filter((t) => {
    if (effectiveOrgId !== 'ALL' && t.organizationId !== effectiveOrgId) return false;
    return true;
  });

  const scopedTransfers = data.transfers.filter((t) => {
    if (effectiveOrgId !== 'ALL' && t.fromOrganizationId !== effectiveOrgId && t.toOrganizationId !== effectiveOrgId) return false;
    return true;
  });

  const scopedVerifications = data.verifications.filter((v) => {
    if (effectiveOrgId !== 'ALL' && !scopedAssetIds.has(v.assetId)) return false;
    return true;
  });

  const scopedRepairs = data.repairs.filter((r) => {
    if (effectiveOrgId !== 'ALL' && !scopedAssetIds.has(r.assetId)) return false;
    return true;
  });

  const scopedAMCs = data.amcs.filter((a) => {
    if (effectiveOrgId !== 'ALL' && !scopedAssetIds.has(a.assetId)) return false;
    return true;
  });

  const scopedUsers = data.users.filter((u) => {
    if (effectiveOrgId !== 'ALL' && u.organizationId !== effectiveOrgId && u.role !== 'Super Admin') return false;
    return true;
  });

  const scopedAuditLogs = data.auditLogs.filter((l) => {
    if (effectiveOrgId !== 'ALL' && l.organizationId && l.organizationId !== effectiveOrgId) return false;
    return true;
  });

  const scopedDeletedAssets = (data.deletedAssets || []).filter((d) => {
    if (effectiveOrgId !== 'ALL' && d.organizationId !== effectiveOrgId) return false;
    return true;
  });

  // Calculate system alerts count
  const nowTime = new Date().getTime();
  const amcDue = scopedAssets.filter((a) => {
    if (!a.amcEnd) return false;
    const diff = (new Date(a.amcEnd).getTime() - nowTime) / (1000 * 3600 * 24);
    return diff <= 30;
  }).length;

  const warrantyExpired = scopedAssets.filter((a) => {
    if (!a.warrantyEnd) return false;
    return new Date(a.warrantyEnd).getTime() < nowTime;
  }).length;

  const pendingTransfers = scopedTransfers.filter((t) => t.status === 'Pending').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-3 font-sans">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-sm text-slate-300">Loading Amara Raja Enterprise Asset Management System...</p>
      </div>
    );
  }

  // Compute allowed pages for current logged in user
  const allowedPages = currentUser ? getUserAllowedPages(currentUser) : ALL_PAGES.map((p) => p.id);
  const isTabAllowed = allowedPages.includes(activeTab);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <LoginModal
          users={data.users || []}
          organizations={data.organizations || []}
          onSelectUser={handleSelectUser}
          onLogin={handleSelectUser}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Header Bar */}
      <Header
        organizations={scopedOrganizations}
        selectedOrgId={effectiveOrgId}
        onSelectOrg={(orgId) => setSelectedOrgId(orgId)}
        currentRole={currentRole}
        onChangeRole={handleChangeRole}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenScanner={() => setShowQuickScanner(true)}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q.trim() && activeTab !== 'assets' && allowedPages.includes('assets')) {
            setActiveTab('assets');
          }
        }}
        alertsCount={{ amcDue, warrantyExpired, pendingTransfers }}
        currentTheme={currentTheme}
        onOpenThemeModal={() => setShowThemeModal(true)}
        onSelectTheme={(t) => setCurrentTheme(t)}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Responsive Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          pendingTransfersCount={pendingTransfers}
          underRepairCount={scopedAssets.filter((a) => a.assetStatus === 'Under Repair').length}
          openTicketsCount={scopedTickets.filter((t) => t.status === 'Open' || t.status === 'Assigned').length}
          amcDueCount={amcDue}
          allowedPages={allowedPages}
        />

        {/* Dynamic Content Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          
          {!isTabAllowed ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-lg mx-auto mt-12 shadow-2xl">
              <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-8 h-8 text-rose-400" />
              </div>
              <h2 className="text-xl font-extrabold text-white mb-2">Module Access Restricted</h2>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Your user account (<strong className="text-slate-200">{currentUser.name}</strong> - <span className="text-amber-400">{currentUser.role}</span>) does not have explicit permission to access the <span className="text-amber-300 font-bold uppercase">{activeTab}</span> module.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setActiveTab(allowedPages[0] || 'dashboard')}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  Go to Allowed Page ({ALL_PAGES.find((p) => p.id === allowedPages[0])?.label || 'Dashboard'})
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs border border-slate-700 transition-colors cursor-pointer"
                >
                  Switch User Account
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard
                  assets={scopedAssets}
                  deletedAssets={scopedDeletedAssets}
                  auditLogs={scopedAuditLogs}
                  organizations={scopedOrganizations}
                  campuses={scopedCampuses}
                  buildings={scopedBuildings}
                  rooms={scopedRooms}
                  transfers={scopedTransfers}
                  verifications={scopedVerifications}
                  onNavigate={(tab) => setActiveTab(tab)}
                  onOpenAddAsset={() => setActiveTab('assets')}
                  onOpenImportModal={() => setActiveTab('assets')}
                />
              )}

          {activeTab === 'assets' && (
            <AssetMaster
              assets={scopedAssets}
              organizations={scopedOrganizations}
              campuses={scopedCampuses}
              buildings={scopedBuildings}
              floors={scopedFloors}
              rooms={scopedRooms}
              departments={scopedDepartments}
              categories={data.categories}
              subCategories={data.subCategories}
              vendors={data.vendors || []}
              selectedOrgId={effectiveOrgId}
              onSaveAsset={handleSaveAsset}
              onDeleteAsset={handleDeleteAsset}
              onBulkImport={handleBulkImport}
              onViewAssetDetails={(asset) => setDetailAsset(asset)}
              onOpenTransferModal={(asset) => {
                setTransferAsset(asset);
                setActiveTab('transfers');
              }}
              onOpenLabelPrint={(asset) => {
                setLabelPrintAsset(asset);
                setActiveTab('qr_labels');
              }}
            />
          )}

          {activeTab === 'hierarchy' && (
            <InfrastructureManagement
              organizations={data.organizations}
              campuses={data.campuses}
              buildings={data.buildings}
              floors={data.floors}
              rooms={data.rooms}
              departments={data.departments}
              assets={data.assets}
              onSaveOrg={handleSaveOrganization}
              onDeleteOrg={handleDeleteOrganization}
              onSaveCampus={handleSaveCampus}
              onSaveBuilding={handleSaveBuilding}
              onSaveRoom={handleSaveRoom}
              onSaveDepartment={handleSaveDepartment}
              onDeleteCampus={handleDeleteCampus}
              onDeleteBuilding={handleDeleteBuilding}
              onDeleteRoom={handleDeleteRoom}
              onDeleteDepartment={handleDeleteDepartment}
            />
          )}

          {activeTab === 'tickets' && (
            <TicketManagementModule
              tickets={scopedTickets}
              organizations={scopedOrganizations}
              campuses={scopedCampuses}
              buildings={scopedBuildings}
              rooms={scopedRooms}
              assets={scopedAssets}
              currentUser={currentUser}
              onSaveTicket={handleSaveTicket}
              onDeleteTicket={handleDeleteTicket}
            />
          )}

          {activeTab === 'categories' && (
            <CategoryMaster
              categories={data.categories}
              subCategories={data.subCategories}
              onSaveCategory={handleSaveCategory}
              onSaveSubCategory={handleSaveSubCategory}
              onDeleteCategory={handleDeleteCategory}
              onDeleteSubCategory={handleDeleteSubCategory}
            />
          )}

          {activeTab === 'users' && (
            <UserManagement
              users={scopedUsers}
              organizations={scopedOrganizations}
              campuses={scopedCampuses}
              departments={scopedDepartments}
              onSaveUser={handleSaveUser}
              onDeleteUser={handleDeleteUser}
              onBulkImportUsers={handleBulkImportUsers}
            />
          )}

          {activeTab === 'vendors' && (
            <VendorManagement
              vendors={data.vendors || []}
              assets={scopedAssets}
              onSaveVendor={handleSaveVendor}
              onDeleteVendor={handleDeleteVendor}
            />
          )}

          {activeTab === 'transfers' && (
            <AssetTransferModule
              transfers={scopedTransfers}
              assets={scopedAssets}
              organizations={scopedOrganizations}
              campuses={scopedCampuses}
              buildings={scopedBuildings}
              rooms={scopedRooms}
              preSelectedAsset={transferAsset}
              onRequestTransfer={handleRequestTransfer}
              onUpdateTransferStatus={handleUpdateTransferStatus}
              onDeleteTransfer={handleDeleteTransfer}
            />
          )}

          {activeTab === 'verification' && (
            <MobileScannerVerification
              assets={scopedAssets}
              organizations={scopedOrganizations}
              rooms={scopedRooms}
              onSaveVerification={handleSaveVerification}
            />
          )}

          {activeTab === 'repairs' && (
            <RepairMaintenanceModule
              repairs={scopedRepairs}
              assets={scopedAssets}
              onSaveRepair={handleSaveRepair}
              onDeleteRepair={handleDeleteRepair}
            />
          )}

          {activeTab === 'amc' && (
            <AMCAndWarrantyModule
              assets={scopedAssets}
              amcRecords={scopedAMCs}
              onSaveAMC={handleSaveAMC}
              onDeleteAMC={handleDeleteAMC}
            />
          )}

          {activeTab === 'qr_labels' && (
            <QRBarcodeModule
              assets={scopedAssets}
              organizations={scopedOrganizations}
              preSelectedAsset={labelPrintAsset}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsModule
              assets={scopedAssets}
              deletedAssets={scopedDeletedAssets}
              auditLogs={scopedAuditLogs}
              organizations={scopedOrganizations}
              campuses={scopedCampuses}
              categories={data.categories}
            />
          )}

          {activeTab === 'audit_logs' && (
            <AuditLogModule logs={scopedAuditLogs} />
          )}

          {activeTab === 'database_guide' && (
            <DatabaseAndGuide
              currentRole={currentRole}
              onRefreshData={fetchData}
            />
          )}
            </>
          )}

        </main>

      </div>

      {/* ASSET DETAIL PROFILE MODAL */}
      <AssetDetailModal
        asset={detailAsset}
        organizations={data.organizations}
        campuses={data.campuses}
        buildings={data.buildings}
        rooms={data.rooms}
        departments={data.departments}
        categories={data.categories}
        subCategories={data.subCategories}
        vendors={data.vendors || []}
        transfers={data.transfers}
        verifications={data.verifications}
        auditLogs={data.auditLogs}
        onClose={() => setDetailAsset(null)}
        onOpenLabelPrint={(a) => {
          setLabelPrintAsset(a);
          setDetailAsset(null);
          setActiveTab('qr_labels');
        }}
      />

      {/* QUICK FLOATING SCANNER MODAL */}
      {showQuickScanner && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl">
            <MobileScannerVerification
              assets={scopedAssets}
              organizations={data.organizations}
              rooms={data.rooms}
              onSaveVerification={handleSaveVerification}
              onClose={() => setShowQuickScanner(false)}
            />
          </div>
        </div>
      )}

      {/* THEME SELECTION MODAL */}
      <ThemeSelectorModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        currentTheme={currentTheme}
        onSelectTheme={(t) => {
          setCurrentTheme(t);
        }}
      />

    </div>
  );
}
