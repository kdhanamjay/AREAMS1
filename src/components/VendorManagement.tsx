import React, { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  Building,
  Phone,
  Mail,
  MapPin,
  FileText,
  Star,
  CheckCircle2,
  XCircle,
  X,
  CreditCard,
  ShieldCheck,
  Package,
  IndianRupee,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Vendor, Asset, UserRole } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface VendorManagementProps {
  vendors: Vendor[];
  assets: Asset[];
  currentRole?: UserRole;
  onSaveVendor: (vendor: Vendor) => Promise<void>;
  onDeleteVendor: (id: string) => Promise<void>;
  onNavigateToAssetRegister?: (vendorName?: string) => void;
}

const VENDOR_FILTER_CATEGORIES = [
  'All Categories',
  'IT Equipment',
  'Furniture & Fixtures',
  'Electrical & Power',
  'Air Conditioning & HVAC',
  'CCTV & Security',
  'Networking & Telecom',
  'Medical & Healthcare',
  'Scientific & Lab',
  'AMC & Maintenance',
  'Civil & Plumbing',
  'Solar & Power Storage',
  'General Supplies'
];

export const SUPPLY_CATEGORIES_PRESETS = [
  { name: 'IT Equipment', desc: 'Laptops, Desktops, Servers, Monitors' },
  { name: 'Furniture & Fixtures', desc: 'Chairs, Tables, Workstations, Podiums' },
  { name: 'Electrical & Power', desc: 'Transformers, DG Sets, UPS, Switchgear' },
  { name: 'Air Conditioning & HVAC', desc: 'Split AC, Cassette AC, Chillers, VRV' },
  { name: 'CCTV & Security', desc: 'IP Cameras, NVR, Biometric, Fire Alarm' },
  { name: 'Networking & Telecom', desc: 'Switches, Routers, Fiber Optics, Wi-Fi' },
  { name: 'Medical & Healthcare', desc: 'Diagnostic, Ward Beds, Monitors, ICU' },
  { name: 'Scientific & Lab', desc: 'Testing Meters, Analyzers, Glassware' },
  { name: 'AMC & Maintenance', desc: 'Comprehensive & Non-Comprehensive SLA' },
  { name: 'Civil & Plumbing', desc: 'Sanitary, Piping, Structural, Painting' },
  { name: 'Solar & Power Storage', desc: 'Inverters, Battery Banks, Panels' },
  { name: 'General Supplies', desc: 'Consumables, Stationery, Tools, Misc' }
];

export const getVendorCategories = (vendor: Partial<Vendor> | undefined | null): string[] => {
  if (!vendor) return [];
  if (Array.isArray(vendor.categories) && vendor.categories.length > 0) {
    return vendor.categories.filter(Boolean);
  }
  if (vendor.category) {
    return vendor.category
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
  }
  return [];
};

export const VendorManagement: React.FC<VendorManagementProps> = ({
  vendors,
  assets,
  currentRole,
  onSaveVendor,
  onDeleteVendor,
  onNavigateToAssetRegister
}) => {
  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'assets' | 'date'>('name');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [viewingVendor, setViewingVendor] = useState<Vendor | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'profile' | 'assets' | 'bank'>('profile');

  // Custom Category Input in Form
  const [customCatText, setCustomCatText] = useState('');
  const [showCustomCatForm, setShowCustomCatForm] = useState(false);

  // Delete Confirm Modal
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

  // Form State
  const nextVendorSeq = String((vendors?.length || 0) + 1).padStart(3, '0');
  const [formVendor, setFormVendor] = useState<Partial<Vendor>>({
    name: '',
    code: `VND-${nextVendorSeq}`,
    contactPerson: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: '',
    panNumber: '',
    categories: ['IT Equipment'],
    category: 'IT Equipment',
    status: 'Active',
    rating: 5,
    paymentTerms: 'Net 30 Days',
    bankDetails: {
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branch: ''
    },
    notes: ''
  });

  // Calculate Vendor Asset Relations
  const vendorAssetMap = useMemo(() => {
    const map = new Map<string, { count: number; totalValue: number; items: Asset[] }>();
    vendors.forEach((v) => {
      const vendorAssets = assets.filter(
        (a) =>
          (a.vendorId && a.vendorId === v.id) ||
          (a.vendor && a.vendor.trim().toLowerCase() === v.name.trim().toLowerCase())
      );
      const totalVal = vendorAssets.reduce((sum, a) => sum + (Number(a.purchaseCost) || 0), 0);
      map.set(v.id, { count: vendorAssets.length, totalValue: totalVal, items: vendorAssets });
    });
    return map;
  }, [vendors, assets]);

  // Overall Stats
  const stats = useMemo(() => {
    const total = vendors.length;
    const active = vendors.filter((v) => v.status === 'Active').length;
    let totalProcuredVal = 0;
    let totalSuppliedAssets = 0;

    vendorAssetMap.forEach((val) => {
      totalProcuredVal += val.totalValue;
      totalSuppliedAssets += val.count;
    });

    return {
      total,
      active,
      inactive: total - active,
      totalProcuredVal,
      totalSuppliedAssets
    };
  }, [vendors, vendorAssetMap]);

  // Filtered & Sorted Vendors
  const filteredVendors = useMemo(() => {
    return vendors
      .filter((v) => {
        if (selectedCategory !== 'All Categories') {
          const vCats = getVendorCategories(v);
          if (!vCats.includes(selectedCategory)) return false;
        }
        if (selectedStatus !== 'ALL' && v.status !== selectedStatus) return false;
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          const matchName = v.name?.toLowerCase().includes(q);
          const matchCode = v.code?.toLowerCase().includes(q);
          const matchPerson = v.contactPerson?.toLowerCase().includes(q);
          const matchEmail = v.email?.toLowerCase().includes(q);
          const matchPhone = v.phone?.includes(q);
          const matchGst = v.gstNumber?.toLowerCase().includes(q);
          const matchCity = v.city?.toLowerCase().includes(q);
          const matchCategory = getVendorCategories(v).some((c) => c.toLowerCase().includes(q));
          return matchName || matchCode || matchPerson || matchEmail || matchPhone || matchGst || matchCity || matchCategory;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'assets') {
          const countA = vendorAssetMap.get(a.id)?.count || 0;
          const countB = vendorAssetMap.get(b.id)?.count || 0;
          return countB - countA;
        }
        if (sortBy === 'date') return (b.createdDate || '').localeCompare(a.createdDate || '');
        return 0;
      });
  }, [vendors, selectedCategory, selectedStatus, searchTerm, sortBy, vendorAssetMap]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingVendor(null);
    setCustomCatText('');
    setShowCustomCatForm(false);
    const seq = String((vendors?.length || 0) + 1).padStart(3, '0');
    setFormVendor({
      name: '',
      code: `VND-${seq}`,
      contactPerson: '',
      email: '',
      phone: '',
      alternatePhone: '',
      address: '',
      city: '',
      state: 'Andhra Pradesh',
      pincode: '',
      gstNumber: '',
      panNumber: '',
      categories: ['IT Equipment'],
      category: 'IT Equipment',
      status: 'Active',
      rating: 5,
      paymentTerms: 'Net 30 Days',
      bankDetails: {
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        branch: ''
      },
      notes: ''
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (v: Vendor) => {
    setEditingVendor(v);
    setCustomCatText('');
    setShowCustomCatForm(false);
    const existingCats = getVendorCategories(v);
    setFormVendor({
      ...v,
      categories: existingCats.length > 0 ? existingCats : ['General Supplies'],
      category: existingCats.join(', '),
      bankDetails: v.bankDetails || {
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        branch: ''
      }
    });
    setShowAddModal(true);
  };

  // Category Toggle Handler for Multi-Select
  const handleToggleCategory = (catName: string) => {
    const current = getVendorCategories(formVendor);
    let updated: string[];
    if (current.includes(catName)) {
      updated = current.filter((c) => c !== catName);
    } else {
      updated = [...current, catName];
    }
    setFormVendor({
      ...formVendor,
      categories: updated,
      category: updated.join(', ')
    });
  };

  const handleSelectAllCategories = () => {
    const all = SUPPLY_CATEGORIES_PRESETS.map((c) => c.name);
    setFormVendor({
      ...formVendor,
      categories: all,
      category: all.join(', ')
    });
  };

  const handleClearCategories = () => {
    setFormVendor({
      ...formVendor,
      categories: [],
      category: ''
    });
  };

  const handleAddCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCatText.trim()) return;
    const current = getVendorCategories(formVendor);
    const trimmed = customCatText.trim();
    if (!current.includes(trimmed)) {
      const updated = [...current, trimmed];
      setFormVendor({
        ...formVendor,
        categories: updated,
        category: updated.join(', ')
      });
    }
    setCustomCatText('');
    setShowCustomCatForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVendor.name || !formVendor.contactPerson || !formVendor.phone) {
      alert('Please fill in required fields: Vendor Name, Contact Person, and Primary Phone.');
      return;
    }

    const selectedCats = getVendorCategories(formVendor);
    if (selectedCats.length === 0) {
      alert('Please select at least one Supply Category for this vendor.');
      return;
    }

    const seq = String((vendors?.length || 0) + 1).padStart(3, '0');
    const payload: Vendor = {
      ...(formVendor as Vendor),
      id: editingVendor ? editingVendor.id : formVendor.id || `vnd-${Date.now()}`,
      code: formVendor.code || `VND-${seq}`,
      status: formVendor.status || 'Active',
      categories: selectedCats,
      category: selectedCats.join(', '),
      createdDate: editingVendor ? editingVendor.createdDate : new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0]
    };

    await onSaveVendor(payload);
    setShowAddModal(false);
    setEditingVendor(null);
  };

  const handleDelete = (vendor: Vendor) => {
    const relations = vendorAssetMap.get(vendor.id);
    const assetCount = relations?.count || 0;

    setDeleteConfirm({
      isOpen: true,
      title: `Delete Vendor ${vendor.name}?`,
      message:
        assetCount > 0
          ? `Warning: Vendor "${vendor.name}" is currently linked to ${assetCount} asset(s) with valuation ${formatINR(
              relations?.totalValue || 0
            )}. Deleting this record will unlink the vendor profile. Are you sure you want to proceed?`
          : `Are you sure you want to delete vendor "${vendor.name}" (${vendor.code})?`,
      onConfirm: async () => {
        await onDeleteVendor(vendor.id);
        if (viewingVendor?.id === vendor.id) setViewingVendor(null);
      }
    });
  };

  // Export Excel
  const handleExportExcel = () => {
    const data = filteredVendors.map((v) => {
      const stats = vendorAssetMap.get(v.id);
      return {
        'Vendor Code': v.code,
        'Vendor Name': v.name,
        Category: v.category,
        'Contact Person': v.contactPerson,
        Phone: v.phone,
        'Alternate Phone': v.alternatePhone || '',
        Email: v.email,
        GSTIN: v.gstNumber || '',
        PAN: v.panNumber || '',
        Status: v.status,
        Rating: `${v.rating || 5} Stars`,
        'Payment Terms': v.paymentTerms || '',
        'Supplied Assets Qty': stats?.count || 0,
        'Total Procured Value (INR)': stats?.totalValue || 0,
        City: v.city || '',
        State: v.state || '',
        Pincode: v.pincode || '',
        Address: v.address || '',
        'Bank Name': v.bankDetails?.bankName || '',
        'Account Number': v.bankDetails?.accountNumber || '',
        'IFSC Code': v.bankDetails?.ifscCode || '',
        'Registered Date': v.createdDate || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendors_Directory');
    XLSX.writeFile(workbook, `Amara_Raja_Vendors_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Truck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Vendor & Supplier Management Hub
            </h1>
          </div>
          <p className="text-slate-400 text-xs">
            Central vendor directory for procurement, GST compliance, asset supply tracking, and AMC agreements.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportExcel}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700 transition cursor-pointer"
            title="Export Vendors to Excel"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Directory</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Add New Vendor</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Total Vendors</p>
            <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
            <p className="text-[11px] text-emerald-400 font-medium mt-0.5">{stats.active} Active suppliers</p>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Active Suppliers</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{stats.active}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{stats.inactive} Inactive</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Procured Assets</p>
            <p className="text-2xl font-black text-sky-400 mt-1">{stats.totalSuppliedAssets}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tracked in asset register</p>
          </div>
          <div className="p-3 bg-sky-500/10 rounded-xl text-sky-400 border border-sky-500/20">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Total Procurement</p>
            <p className="text-2xl font-black text-amber-400 mt-1 font-mono">{formatINR(stats.totalProcuredVal)}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Cumulative asset valuation</p>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search vendor name, code, contact person, phone, email, GSTIN, city..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
            >
              {VENDOR_FILTER_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
            >
              <option value="name">Sort: Name (A-Z)</option>
              <option value="rating">Sort: Highest Rating</option>
              <option value="assets">Sort: Most Assets Supplied</option>
              <option value="date">Sort: Recently Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Vendors Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Vendor Code & Name</th>
                <th className="py-3 px-4">Supply Categories</th>
                <th className="py-3 px-4">Primary Contact</th>
                <th className="py-3 px-4">Tax / GSTIN</th>
                <th className="py-3 px-4">Supplied Assets</th>
                <th className="py-3 px-4">Status & Rating</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredVendors.map((vendor) => {
                const relations = vendorAssetMap.get(vendor.id);
                const assetCount = relations?.count || 0;
                const totalVal = relations?.totalValue || 0;
                const vCats = getVendorCategories(vendor);

                return (
                  <tr
                    key={vendor.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => {
                      setViewingVendor(vendor);
                      setActiveDetailTab('profile');
                    }}
                  >
                    {/* Name & Code */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                          {vendor.name.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                            <span>{vendor.name}</span>
                            {vendor.paymentTerms && (
                              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                                {vendor.paymentTerms}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                            <span className="text-amber-400/80">{vendor.code}</span>
                            {vendor.city && <span>• {vendor.city}, {vendor.state}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Multi-Categories */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {vCats.slice(0, 2).map((cat) => (
                          <span
                            key={cat}
                            className="inline-flex items-center gap-1 bg-slate-800/90 text-slate-200 px-2 py-0.5 rounded-md text-[10px] font-medium border border-slate-700/60"
                          >
                            <Layers className="w-2.5 h-2.5 text-amber-400" />
                            <span className="truncate max-w-[110px]">{cat}</span>
                          </span>
                        ))}
                        {vCats.length > 2 && (
                          <span
                            title={vCats.slice(2).join(', ')}
                            className="inline-flex items-center bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-md text-[10px] font-bold border border-amber-500/30"
                          >
                            +{vCats.length - 2} more
                          </span>
                        )}
                        {vCats.length === 0 && (
                          <span className="text-slate-500 italic text-[11px]">No category</span>
                        )}
                      </div>
                    </td>

                    {/* Contact Person */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-200">{vendor.contactPerson}</p>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{vendor.phone}</span>
                        </div>
                        {vendor.email && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate max-w-[180px]">
                            <Mail className="w-3 h-3" />
                            <span>{vendor.email}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* GSTIN / PAN */}
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {vendor.gstNumber ? (
                        <div>
                          <span className="text-emerald-400 font-semibold">{vendor.gstNumber}</span>
                          {vendor.panNumber && (
                            <p className="text-slate-500 text-[10px]">PAN: {vendor.panNumber}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Not Registered</span>
                      )}
                    </td>

                    {/* Supplied Assets */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs">{assetCount}</span>
                          <span className="text-[11px] text-slate-400">item(s)</span>
                        </div>
                        {assetCount > 0 && (
                          <p className="text-[10px] text-amber-400 font-mono font-semibold">
                            {formatINR(totalVal)}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Status & Rating */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            vendor.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              vendor.status === 'Active' ? 'bg-emerald-400' : 'bg-rose-400'
                            }`}
                          />
                          <span>{vendor.status}</span>
                        </span>

                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= (vendor.rating || 5)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setViewingVendor(vendor);
                            setActiveDetailTab('profile');
                          }}
                          className="p-1.5 hover:bg-slate-800 text-sky-400 rounded-lg transition-colors cursor-pointer"
                          title="View Vendor Profile & Assets"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(vendor)}
                          className="p-1.5 hover:bg-slate-800 text-amber-400 rounded-lg transition-colors cursor-pointer"
                          title="Edit Vendor Details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(vendor)}
                          className="p-1.5 hover:bg-slate-800 text-rose-400 rounded-lg transition-colors cursor-pointer"
                          title="Delete Vendor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredVendors.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    <Truck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-300">No vendors found</p>
                    <p className="text-slate-500 mt-0.5">
                      Try adjusting your search filters or click "Add New Vendor" to register a supplier.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. ADD / EDIT VENDOR MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <span>{editingVendor ? 'Edit Vendor Record' : 'Register New Vendor / Supplier'}</span>
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Section 1: Basic Vendor Info */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  1. Company & Primary Identification
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1 font-semibold">Vendor / Company Name *</label>
                    <input
                      type="text"
                      required
                      value={formVendor.name || ''}
                      onChange={(e) => setFormVendor({ ...formVendor, name: e.target.value })}
                      placeholder="e.g. Godrej Interio, Dell India, Cisco"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Vendor Code *</label>
                    <input
                      type="text"
                      required
                      value={formVendor.code || ''}
                      onChange={(e) => setFormVendor({ ...formVendor, code: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                      placeholder="VND-001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Status</label>
                    <select
                      value={formVendor.status}
                      onChange={(e) => setFormVendor({ ...formVendor, status: e.target.value as any })}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Supplier Star Rating</label>
                    <select
                      value={formVendor.rating || 5}
                      onChange={(e) => setFormVendor({ ...formVendor, rating: Number(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ (5 - Premium / OEM)</option>
                      <option value={4}>⭐⭐⭐⭐ (4 - Verified Preferred)</option>
                      <option value={3}>⭐⭐⭐ (3 - Standard Approved)</option>
                      <option value={2}>⭐⭐ (2 - Under Review)</option>
                      <option value={1}>⭐ (1 - Low Reliability)</option>
                    </select>
                  </div>
                </div>

                {/* Multi-Select Supply Categories */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <label className="text-white font-semibold text-xs flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-amber-400" />
                          <span>Supply Categories (Multi-Select) *</span>
                        </label>
                        <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                          {getVendorCategories(formVendor).length} Selected
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Select all types of supplies, assets, or services this vendor provides.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSelectAllCategories}
                        className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg border border-slate-700 transition cursor-pointer"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={handleClearCategories}
                        className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 px-2 py-1 rounded-lg border border-slate-700 transition cursor-pointer"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCustomCatForm(!showCustomCatForm)}
                        className="text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-2 py-1 rounded-lg border border-amber-500/30 transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Custom</span>
                      </button>
                    </div>
                  </div>

                  {/* Inline Custom Category Adder */}
                  {showCustomCatForm && (
                    <div className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-lg border border-amber-500/30">
                      <input
                        type="text"
                        value={customCatText}
                        onChange={(e) => setCustomCatText(e.target.value)}
                        placeholder="Enter custom category name (e.g. Solar Inverters, Lab Chemicals)"
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomCategory(e);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomCategory}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-md transition cursor-pointer"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCustomCatForm(false)}
                        className="text-slate-400 hover:text-white text-xs px-2 py-1.5 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Categories Grid Multi-Select Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SUPPLY_CATEGORIES_PRESETS.map((cat) => {
                      const isSelected = getVendorCategories(formVendor).includes(cat.name);
                      return (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => handleToggleCategory(cat.name)}
                          className={`flex items-start gap-2 p-2 rounded-xl text-left border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-sm ring-1 ring-amber-500/30'
                              : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border flex-shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-amber-500 border-amber-400 text-slate-950'
                                : 'border-slate-700 bg-slate-800'
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />}
                          </div>
                          <div className="min-w-0">
                            <p
                              className={`text-xs font-semibold leading-tight ${
                                isSelected ? 'text-amber-300' : 'text-slate-300'
                              }`}
                            >
                              {cat.name}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">{cat.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom categories already added */}
                  {getVendorCategories(formVendor).filter(
                    (c) => !SUPPLY_CATEGORIES_PRESETS.some((p) => p.name === c)
                  ).length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1.5">
                        Custom Categories Added:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {getVendorCategories(formVendor)
                          .filter((c) => !SUPPLY_CATEGORIES_PRESETS.some((p) => p.name === c))
                          .map((custom) => (
                            <span
                              key={custom}
                              className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-2 py-0.5 rounded-lg"
                            >
                              <span>{custom}</span>
                              <button
                                type="button"
                                onClick={() => handleToggleCategory(custom)}
                                className="hover:text-rose-400 p-0.5 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Selected Category Chips summary */}
                  {getVendorCategories(formVendor).length > 0 ? (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center flex-wrap gap-1.5">
                      <span className="text-[10px] text-slate-400 font-semibold mr-1">Active Scope:</span>
                      {getVendorCategories(formVendor).map((cat) => (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1 bg-slate-800 text-slate-200 border border-slate-700 text-[11px] px-2 py-0.5 rounded-md"
                        >
                          <span>{cat}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleCategory(cat)}
                            className="text-slate-400 hover:text-rose-400 cursor-pointer"
                            title="Remove category"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-rose-400 italic pt-1">
                      ⚠️ Please select at least one supply category for this vendor.
                    </p>
                  )}
                </div>
              </div>

              {/* Section 2: Contact Information */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  2. Key Contact Person & Communication
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Contact Person *</label>
                    <input
                      type="text"
                      required
                      value={formVendor.contactPerson || ''}
                      onChange={(e) => setFormVendor({ ...formVendor, contactPerson: e.target.value })}
                      placeholder="e.g. S. Ramakrishna, Account Mgr"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Primary Phone / Mobile *</label>
                    <input
                      type="text"
                      required
                      value={formVendor.phone || ''}
                      onChange={(e) => setFormVendor({ ...formVendor, phone: e.target.value })}
                      placeholder="+91 98490 12345"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Email Address</label>
                    <input
                      type="email"
                      value={formVendor.email || ''}
                      onChange={(e) => setFormVendor({ ...formVendor, email: e.target.value })}
                      placeholder="sales@vendor.com"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Tax & Commercials */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  3. Tax IDs & Commercial Terms
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">GSTIN / Tax ID</label>
                    <input
                      type="text"
                      value={formVendor.gstNumber || ''}
                      onChange={(e) => setFormVendor({ ...formVendor, gstNumber: e.target.value.toUpperCase() })}
                      placeholder="37AAAAA0000A1Z5"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">PAN Number</label>
                    <input
                      type="text"
                      value={formVendor.panNumber || ''}
                      onChange={(e) => setFormVendor({ ...formVendor, panNumber: e.target.value.toUpperCase() })}
                      placeholder="AAAAA0000A"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Payment Terms</label>
                    <input
                      type="text"
                      value={formVendor.paymentTerms || ''}
                      onChange={(e) => setFormVendor({ ...formVendor, paymentTerms: e.target.value })}
                      placeholder="e.g. Net 30 Days, 50% Advance"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Address & Banking Details */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  4. Address & Banking Information (Optional)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-3">
                    <label className="block text-slate-400 mb-1">Street Address</label>
                    <input
                      type="text"
                      value={formVendor.address || ''}
                      onChange={(e) => setFormVendor({ ...formVendor, address: e.target.value })}
                      placeholder="Plot / Street / Area / Landmark"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">City</label>
                    <input
                      type="text"
                      value={formVendor.city || ''}
                      onChange={(e) => setFormVendor({ ...formVendor, city: e.target.value })}
                      placeholder="e.g. Tirupati / Chennai"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">State</label>
                    <input
                      type="text"
                      value={formVendor.state || ''}
                      onChange={(e) => setFormVendor({ ...formVendor, state: e.target.value })}
                      placeholder="Andhra Pradesh"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={formVendor.pincode || ''}
                      onChange={(e) => setFormVendor({ ...formVendor, pincode: e.target.value })}
                      placeholder="517129"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-slate-400 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={formVendor.bankDetails?.bankName || ''}
                      onChange={(e) =>
                        setFormVendor({
                          ...formVendor,
                          bankDetails: { ...formVendor.bankDetails, bankName: e.target.value }
                        })
                      }
                      placeholder="HDFC / SBI / ICICI"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={formVendor.bankDetails?.accountNumber || ''}
                      onChange={(e) =>
                        setFormVendor({
                          ...formVendor,
                          bankDetails: { ...formVendor.bankDetails, accountNumber: e.target.value }
                        })
                      }
                      placeholder="Account No"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={formVendor.bankDetails?.ifscCode || ''}
                      onChange={(e) =>
                        setFormVendor({
                          ...formVendor,
                          bankDetails: { ...formVendor.bankDetails, ifscCode: e.target.value.toUpperCase() }
                        })
                      }
                      placeholder="HDFC0000123"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Notes & Remarks */}
              <div>
                <label className="block text-slate-400 mb-1">Scope of Supply / Special Notes</label>
                <textarea
                  rows={2}
                  value={formVendor.notes || ''}
                  onChange={(e) => setFormVendor({ ...formVendor, notes: e.target.value })}
                  placeholder="Items supplied, warranty SLA details, service contract terms..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl shadow-lg transition cursor-pointer"
                >
                  {editingVendor ? 'Save Vendor Changes' : 'Register Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. VIEW VENDOR DETAILS & ASSETS DRAWER / MODAL */}
      {viewingVendor && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg uppercase flex-shrink-0">
                  {viewingVendor.name.slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white">{viewingVendor.name}</h2>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        viewingVendor.status === 'Active'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {viewingVendor.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-0.5">
                    <span className="text-amber-400 font-bold">{viewingVendor.code}</span>
                    <span>• {viewingVendor.category}</span>
                    {viewingVendor.gstNumber && <span>• GSTIN: {viewingVendor.gstNumber}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const v = viewingVendor;
                    setViewingVendor(null);
                    handleOpenEdit(v);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setViewingVendor(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs in Details */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setActiveDetailTab('profile')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeDetailTab === 'profile'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Vendor Profile</span>
              </button>

              <button
                onClick={() => setActiveDetailTab('assets')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeDetailTab === 'assets'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>
                  Supplied Assets ({vendorAssetMap.get(viewingVendor.id)?.count || 0})
                </span>
              </button>

              <button
                onClick={() => setActiveDetailTab('bank')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeDetailTab === 'bank'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Banking & Tax Details</span>
              </button>
            </div>

            {/* Tab 1: Profile */}
            {activeDetailTab === 'profile' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Contact Card */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
                    <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      Contact Information
                    </p>
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase">Contact Person</span>
                        <p className="text-white font-semibold text-sm">{viewingVendor.contactPerson}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase">Phone</span>
                          <p className="text-slate-200 font-mono flex items-center gap-1">
                            <Phone className="w-3 h-3 text-amber-400" />
                            {viewingVendor.phone}
                          </p>
                        </div>
                        {viewingVendor.alternatePhone && (
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase">Alt Phone</span>
                            <p className="text-slate-300 font-mono">{viewingVendor.alternatePhone}</p>
                          </div>
                        )}
                      </div>
                      {viewingVendor.email && (
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase">Email</span>
                          <p className="text-slate-200 font-mono flex items-center gap-1">
                            <Mail className="w-3 h-3 text-sky-400" />
                            {viewingVendor.email}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location Card */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
                    <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      Address & Location
                    </p>
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase">Office Address</span>
                        <p className="text-slate-200">{viewingVendor.address || 'Address not specified'}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase">City</span>
                          <p className="text-slate-200">{viewingVendor.city || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase">State</span>
                          <p className="text-slate-200">{viewingVendor.state || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase">Pincode</span>
                          <p className="text-slate-200 font-mono">{viewingVendor.pincode || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes & Commercials */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                    Commercial Terms & Supply Scope
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase">Payment Terms</span>
                      <p className="text-white font-semibold">{viewingVendor.paymentTerms || 'Standard Terms'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase">Registered Since</span>
                      <p className="text-white font-semibold font-mono">{formatDate(viewingVendor.createdDate)}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                        Authorized Supply Categories
                      </span>
                      {getVendorCategories(viewingVendor).length > 1 && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Multi-Supply Supplier ({getVendorCategories(viewingVendor).length} Categories)
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getVendorCategories(viewingVendor).map((cat) => (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1.5 bg-slate-900 text-amber-300 border border-amber-500/30 text-xs px-2.5 py-1 rounded-lg font-medium shadow-sm"
                        >
                          <Layers className="w-3.5 h-3.5 text-amber-400" />
                          <span>{cat}</span>
                        </span>
                      ))}
                      {getVendorCategories(viewingVendor).length === 0 && (
                        <span className="text-slate-500 italic text-xs">No categories assigned</span>
                      )}
                    </div>
                  </div>

                  {viewingVendor.notes && (
                    <div className="pt-2 border-t border-slate-800 text-slate-300">
                      <span className="text-slate-500 text-[10px] uppercase block">Special Notes</span>
                      <p className="mt-0.5 leading-relaxed">{viewingVendor.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Supplied Assets */}
            {activeDetailTab === 'assets' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <p className="text-slate-300 font-semibold">
                    Procured Assets Linked to <span className="text-amber-400">{viewingVendor.name}</span>
                  </p>
                  {onNavigateToAssetRegister && (
                    <button
                      onClick={() => {
                        onNavigateToAssetRegister(viewingVendor.name);
                        setViewingVendor(null);
                      }}
                      className="text-amber-400 hover:underline flex items-center gap-1 font-bold text-xs cursor-pointer"
                    >
                      <span>Open Asset Register</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Asset Tag</th>
                        <th className="py-2.5 px-3">Particulars (Asset Name)</th>
                        <th className="py-2.5 px-3">Ref No.</th>
                        <th className="py-2.5 px-3">Purchase Date</th>
                        <th className="py-2.5 px-3">Qty & Cost</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {(vendorAssetMap.get(viewingVendor.id)?.items || []).map((asset) => (
                        <tr key={asset.id} className="hover:bg-slate-900/50">
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{asset.assetTag}</td>
                          <td className="py-2.5 px-3">
                            <p className="font-semibold text-white">{asset.particulars}</p>
                            <p className="text-[10px] text-slate-500">{asset.model || asset.manufacturer}</p>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-emerald-400">
                            {asset.referenceNumber || '—'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px]">{formatDate(asset.purchaseDate)}</td>
                          <td className="py-2.5 px-3 font-mono">
                            <span className="text-white font-bold">{formatINR(asset.purchaseCost)}</span>
                            {asset.quantity > 1 && (
                              <span className="text-[10px] text-slate-400 block">({asset.quantity} units)</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                asset.assetStatus === 'Active' || asset.assetStatus === 'In Use'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-amber-500/10 text-amber-400'
                              }`}
                            >
                              {asset.assetStatus}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {(vendorAssetMap.get(viewingVendor.id)?.items || []).length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                            No assets registered yet for this vendor. When registering new assets, select "{viewingVendor.name}" from the vendor dropdown.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 3: Banking & Tax */}
            {activeDetailTab === 'bank' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" />
                      <span>Bank Account Details</span>
                    </p>
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase">Bank Name</span>
                        <p className="text-white font-semibold">
                          {viewingVendor.bankDetails?.bankName || 'Not Provided'}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase">Account Number</span>
                        <p className="text-emerald-400 font-mono font-bold">
                          {viewingVendor.bankDetails?.accountNumber || 'Not Provided'}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase">IFSC Code</span>
                          <p className="text-amber-400 font-mono">
                            {viewingVendor.bankDetails?.ifscCode || 'Not Provided'}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase">Branch</span>
                          <p className="text-slate-200">{viewingVendor.bankDetails?.branch || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Statutory & Tax Compliance</span>
                    </p>
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase">GSTIN / Tax ID</span>
                        <p className="text-emerald-400 font-mono font-bold">
                          {viewingVendor.gstNumber || 'Not Registered'}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase">PAN Number</span>
                        <p className="text-sky-400 font-mono font-semibold">
                          {viewingVendor.panNumber || 'Not Provided'}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase">Payment Terms</span>
                        <p className="text-slate-200">{viewingVendor.paymentTerms || 'Standard 30 Days'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. Delete Confirmation Modal */}
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
