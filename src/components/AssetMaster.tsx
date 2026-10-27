import React, { useState, useEffect, useMemo } from 'react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  Plus,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  QrCode,
  ArrowRightLeft,
  Wrench,
  CheckCircle2,
  X,
  Upload,
  Building2,
  FileText,
  Truck,
  Hash,
  Armchair,
  Sparkles,
  Calculator
} from 'lucide-react';
import * as XLSX from 'xlsx';
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
  AssetCondition,
  AssetStatus,
  Vendor
} from '../types';
import { formatINR, formatDate, generateAssetTag } from '../utils/formatters';
import { LocationCascadingSelect } from './common/LocationCascadingSelect';
import { SearchableSelect } from './common/SearchableSelect';

interface AssetMasterProps {
  assets: Asset[];
  organizations: Organization[];
  campuses: Campus[];
  buildings: Building[];
  floors: Floor[];
  rooms: Room[];
  departments: Department[];
  categories: AssetCategory[];
  subCategories: AssetSubCategory[];
  vendors?: Vendor[];
  selectedOrgId: string;
  onSaveAsset: (asset: Asset) => Promise<void>;
  onDeleteAsset: (id: string, reason?: string) => Promise<void>;
  onBulkImport: (assets: Asset[]) => Promise<void>;
  onViewAssetDetails: (asset: Asset) => void;
  onOpenTransferModal: (asset: Asset) => void;
  onOpenLabelPrint: (asset: Asset) => void;
}

export const AssetMaster: React.FC<AssetMasterProps> = ({
  assets,
  organizations,
  campuses,
  buildings,
  floors,
  rooms,
  departments,
  categories,
  subCategories,
  vendors = [],
  selectedOrgId,
  onSaveAsset,
  onDeleteAsset,
  onBulkImport,
  onViewAssetDetails,
  onOpenTransferModal,
  onOpenLabelPrint
}) => {
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrg, setFilterOrg] = useState(selectedOrgId);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterSubCategory, setFilterSubCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCondition, setFilterCondition] = useState('ALL');
  const [filterVendor, setFilterVendor] = useState('ALL');

  React.useEffect(() => {
    if (selectedOrgId !== 'ALL') {
      setFilterOrg(selectedOrgId);
    } else if (organizations.length === 1) {
      setFilterOrg(organizations[0].id);
    } else {
      setFilterOrg('ALL');
    }
  }, [selectedOrgId, organizations]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Custom Prefix & Ref Number state for form
  const [refPrefixChoice, setRefPrefixChoice] = useState('RF');
  const [customPrefixText, setCustomPrefixText] = useState('RF');
  const [refNumberSuffix, setRefNumberSuffix] = useState('');

  // Bulk / Furniture Mode Toggle
  const [isFurnitureMode, setIsFurnitureMode] = useState(false);
  const [unitCostInput, setUnitCostInput] = useState<number>(0);

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
  const [formAsset, setFormAsset] = useState<Partial<Asset>>({
    particulars: '',
    description: '',
    organizationId: organizations[0]?.id || '',
    campusId: campuses[0]?.id || '',
    buildingId: buildings[0]?.id || '',
    floorId: floors[0]?.id || '',
    roomId: rooms[0]?.id || '',
    departmentId: departments[0]?.id || '',
    categoryId: categories[0]?.id || 'cat-it',
    quantity: 1,
    purchaseCost: 50000,
    currentValue: 40000,
    depreciationRate: 15,
    expectedLifeYears: 5,
    manufacturer: 'Generic',
    model: 'Standard 2026',
    vendor: 'Godrej Interio Commercial',
    vendorId: 'vnd-001',
    referencePrefix: 'RF',
    referenceNumber: `RF-${new Date().getFullYear()}-${String(assets.length + 1).padStart(4, '0')}`,
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(assets.length + 1).padStart(4, '0')}`,
    currentCondition: 'Good',
    assetStatus: 'Active',
    assignedEmployee: '',
    assetSerialNumber: `SN-${new Date().getFullYear()}-${String(assets.length + 1).padStart(4, '0')}`,
    assetAllocationNumber: `ALLOC-${String(assets.length + 1).padStart(4, '0')}`,
    purchaseDate: new Date().toISOString().split('T')[0],
    barcodeType: 'Code128'
  });

  // Watch Category to Auto-Detect Furniture
  useEffect(() => {
    if (!formAsset.categoryId) return;
    const cat = categories.find((c) => c.id === formAsset.categoryId);
    const isFur =
      cat?.name?.toLowerCase().includes('furniture') ||
      cat?.name?.toLowerCase().includes('fixture') ||
      cat?.code?.toLowerCase().includes('fur');

    if (isFur && !editingAsset) {
      setIsFurnitureMode(true);
      setFormAsset((prev) => ({
        ...prev,
        isBulkAsset: true,
        manufacturer: prev.manufacturer === 'Generic' ? 'Godrej / Featherlite' : prev.manufacturer
      }));
    }
  }, [formAsset.categoryId, categories, editingAsset]);

  // Sync Unit Cost and Total Purchase Cost for Furniture
  const handleQuantityOrUnitCostChange = (qty: number, uCost: number) => {
    const total = (qty || 1) * (uCost || 0);
    setFormAsset((prev) => ({
      ...prev,
      quantity: qty,
      unitCost: uCost,
      purchaseCost: total,
      currentValue: total
    }));
  };

  // Generate Reference Number
  const generateNewReferenceNumber = (prefix: string) => {
    const pfx = prefix.trim().toUpperCase() || 'RF';
    const yr = new Date().getFullYear();
    const nextSeq = String(assets.length + 1).padStart(4, '0');
    const newRef = `${pfx}-${yr}-${nextSeq}`;
    setRefNumberSuffix(`${yr}-${nextSeq}`);
    setFormAsset((prev) => ({
      ...prev,
      referencePrefix: pfx,
      referenceNumber: newRef
    }));
  };

  // Filtered Assets
  const filteredAssets = assets.filter((a) => {
    if (filterOrg !== 'ALL' && a.organizationId !== filterOrg) return false;
    if (filterCategory !== 'ALL' && a.categoryId !== filterCategory) return false;
    if (filterSubCategory !== 'ALL' && a.subCategoryId !== filterSubCategory) return false;
    if (filterStatus !== 'ALL' && a.assetStatus !== filterStatus) return false;
    if (filterCondition !== 'ALL' && a.currentCondition !== filterCondition) return false;
    if (filterVendor !== 'ALL' && a.vendor !== filterVendor && a.vendorId !== filterVendor) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        a.assetTag.toLowerCase().includes(q) ||
        a.particulars.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.referenceNumber?.toLowerCase().includes(q) ||
        a.vendor?.toLowerCase().includes(q) ||
        a.assetSerialNumber?.toLowerCase().includes(q) ||
        a.assetAllocationNumber?.toLowerCase().includes(q) ||
        a.division?.toLowerCase().includes(q) ||
        a.placeOfAsset?.toLowerCase().includes(q) ||
        a.assignedEmployee?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Handle Add/Edit Save
  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const org = organizations.find((o) => o.id === formAsset.organizationId);
    const cat = categories.find((c) => c.id === formAsset.categoryId);

    const assetTag = formAsset.id
      ? formAsset.assetTag!
      : generateAssetTag(org?.shortCode || 'ARG', cat?.code || 'AST', assets.length);

    const fullAsset: Asset = {
      ...(formAsset as Asset),
      id: formAsset.id || `ast-${Date.now()}`,
      assetTag,
      assetLocationCode: formAsset.assetLocationCode || `${formAsset.organizationId}-${formAsset.campusId}-${formAsset.buildingId}-${formAsset.roomId}`,
      createdBy: formAsset.createdBy || 'Super Admin',
      createdDate: formAsset.createdDate || new Date().toISOString().split('T')[0],
      modifiedBy: formAsset.id ? 'Admin User' : undefined,
      modifiedDate: formAsset.id ? new Date().toISOString().split('T')[0] : undefined
    };

    await onSaveAsset(fullAsset);
    setShowAddModal(false);
    setEditingAsset(null);
  };

  // Excel Export
  const handleExportExcel = () => {
    const exportData = filteredAssets.map((a) => ({
      'Asset Tag': a.assetTag,
      Particulars: a.particulars,
      'Asset Description': a.description,
      'Asset location': a.assetLocationCode,
      'Date of Purchase': a.purchaseDate,
      Location: a.campusId,
      Division: a.division || '',
      'Place of the Asset': a.placeOfAsset || '',
      Qty: a.quantity || 1,
      'Asset Value': a.purchaseCost,
      'Asset Allocation No.': a.assetAllocationNumber || '',
      'Asset Serial No.': a.assetSerialNumber || '',
      Remarks: a.remarks || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Assets_Master');
    XLSX.writeFile(workbook, `Amara_Raja_EAMS_Assets_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Excel Template Download
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        Particulars: 'cisco 24 port gigabit web managd switch',
        'Asset Description': 'CISCO 24 PORT SWITCH',
        'Asset location': 'DG/ARV/R.NO:CO',
        'Date of Purchase': '28-Feb-22',
        Location: 'DIGUVAMAGHAM',
        Division: 'ARVD - HIGH SCHOOL',
        'Place of the Asset': '2ND FLOOR - CORRIDOR',
        Qty: 1,
        'Asset Value': 42834,
        'Asset Allocation No.': '900000696',
        'Asset Serial No.': '20:CF:AE:46:D8:39',
        Remarks: 'HIGH SCHOOL BUILDING'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Import_Template');
    XLSX.writeFile(wb, 'Amara_Raja_EAMS_Import_Template.xlsx');
  };

  // Excel Bulk File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<any>(sheet);

        const getVal = (row: any, keys: string[]) => {
          for (const k of keys) {
            if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
              return String(row[k]).trim();
            }
          }
          return '';
        };

        const importedAssets: Asset[] = json.map((row, idx) => {
          const particulars = getVal(row, ['Particulars', 'particulars', 'Item']) || 'Asset Record';
          const description = getVal(row, ['Asset Description', 'Description', 'description']) || particulars;
          const assetLocCode = getVal(row, ['Asset location', 'Asset Location', 'Location Code', 'Asset location ']) || 'DG/ARV/R.NO:001';
          const purchaseDate = getVal(row, ['Date of Purchase', 'Purchase Date', 'Date']) || new Date().toISOString().split('T')[0];
          const division = getVal(row, ['Division', 'division']) || 'General';
          const placeOfAsset = getVal(row, ['Place of the Asset', 'Place of Asset', 'Place']) || 'Ground Floor';
          const rawQty = getVal(row, ['Qty', 'Quantity', 'qty']);
          const quantity = rawQty ? parseInt(rawQty) || 1 : 1;
          const rawVal = getVal(row, ['Asset Value', 'Asset Value ', 'Purchase Cost', 'Value']).replace(/,/g, '');
          const purchaseCost = rawVal ? parseFloat(rawVal) || 0 : 10000;
          const assetAllocationNumber = getVal(row, ['Asset Allocation No.', 'Asset Allocation No', 'Allocation Number', 'Asset Allocation']) || `90000${700 + idx}`;
          const assetSerialNumber = getVal(row, ['Asset Serial No.', 'Asset Serial No', 'Serial Number', 'Serial No', 'Serial']) || `SN-${idx + 1000}`;
          const remarks = getVal(row, ['Remarks', 'REMARKS', 'Building', 'remarks']);

          return {
            id: `imp-${Date.now()}-${idx}`,
            assetTag: getVal(row, ['Asset Tag', 'Tag']) || `ARG-IMP-2026-${String(assets.length + idx + 1).padStart(4, '0')}`,
            particulars,
            description,
            assetLocationCode: assetLocCode,
            purchaseDate,
            organizationId: organizations[0]?.id || 'org-arvd',
            campusId: campuses[0]?.id || 'cmp-dig',
            buildingId: buildings[0]?.id || 'bld-admin-dig',
            floorId: floors[0]?.id || 'flr-dig-g',
            roomId: rooms[0]?.id || 'rm-principal',
            departmentId: departments[0]?.id || 'dept-admin',
            division,
            placeOfAsset,
            quantity,
            purchaseCost,
            currentValue: purchaseCost,
            depreciationRate: 15,
            expectedLifeYears: 5,
            assetAllocationNumber,
            assetSerialNumber,
            manufacturer: particulars.split(' ')[0] || 'Generic',
            model: particulars,
            vendor: 'Amara Raja Authorized Vendor',
            invoiceNumber: `INV-IMP-${idx + 100}`,
            currentCondition: 'Good',
            assetStatus: 'Active',
            remarks: remarks || 'Bulk imported from dataset',
            createdBy: 'CSV Import',
            createdDate: new Date().toISOString().split('T')[0],
            categoryId: categories[0]?.id || 'cat-it',
            barcodeType: 'Code128'
          };
        });

        await onBulkImport(importedAssets);
        setShowImportModal(false);
      } catch (err) {
        console.error('Import error:', err);
        alert('Failed to parse file. Please ensure valid CSV/Excel file structure.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Asset Master Register</span>
            <span className="bg-amber-500/20 text-amber-400 text-xs px-2.5 py-0.5 rounded-full font-mono border border-amber-500/30">
              {filteredAssets.length} Total
            </span>
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">Centralized register with QR, Barcodes, Financials & Locations</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setEditingAsset(null);
              const nextSeq = String(assets.length + 1).padStart(4, '0');
              const yr = new Date().getFullYear();
              setRefPrefixChoice('RF');
              setCustomPrefixText('RF');
              setRefNumberSuffix(`${yr}-${nextSeq}`);
              setFormAsset({
                particulars: '',
                description: '',
                organizationId: selectedOrgId !== 'ALL' ? selectedOrgId : organizations[0]?.id,
                campusId: campuses[0]?.id,
                buildingId: buildings[0]?.id,
                floorId: floors[0]?.id,
                roomId: rooms[0]?.id,
                departmentId: departments[0]?.id,
                categoryId: categories[0]?.id,
                quantity: 1,
                purchaseCost: 50000,
                currentValue: 40000,
                depreciationRate: 15,
                expectedLifeYears: 5,
                manufacturer: 'Generic',
                model: 'Model 2026',
                vendor: vendors[0]?.name || 'Authorized Supply',
                vendorId: vendors[0]?.id,
                referencePrefix: 'RF',
                referenceNumber: `RF-${yr}-${nextSeq}`,
                invoiceNumber: `INV-${yr}-${nextSeq}`,
                assetAllocationNumber: `ALLOC-${nextSeq}`,
                assetSerialNumber: `SN-${yr}-${nextSeq}`,
                currentCondition: 'Good',
                assetStatus: 'Active',
                purchaseDate: new Date().toISOString().split('T')[0]
              });
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Asset</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer"
            title="Export filtered records to Excel"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        
        {/* Search */}
        <div className="relative col-span-1 sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Tag, Asset Name, Serial Number, Employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Organization Filter */}
        <div>
          <select
            value={filterOrg}
            onChange={(e) => setFilterOrg(e.target.value)}
            disabled={organizations.length === 1 || selectedOrgId !== 'ALL'}
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {selectedOrgId === 'ALL' && organizations.length > 1 && (
              <option value="ALL">All Organizations</option>
            )}
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.shortCode} - {o.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setFilterSubCategory('ALL');
            }}
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory Filter */}
        <div>
          <select
            value={filterSubCategory}
            onChange={(e) => setFilterSubCategory(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Subcategories</option>
            {subCategories
              .filter((s) => filterCategory === 'ALL' || s.categoryId === filterCategory)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
          </select>
        </div>

        {/* Vendor Filter */}
        <div>
          <select
            value={filterVendor}
            onChange={(e) => setFilterVendor(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Vendors / Suppliers</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.name}>
                {v.name} ({v.code})
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="In Use">In Use</option>
            <option value="In Store">In Store</option>
            <option value="Under Repair">Under Repair</option>
            <option value="Missing">Missing</option>
            <option value="Disposed">Disposed</option>
          </select>
        </div>

      </div>

      {/* Asset Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-700/80">
                <th className="py-3 px-4">Asset Tag & Ref No.</th>
                <th className="py-3 px-4">Particulars & Vendor</th>
                <th className="py-3 px-4">Organization & Campus</th>
                <th className="py-3 px-4">Location Code</th>
                <th className="py-3 px-4 text-right">Qty & Valuation (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Condition</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredAssets.map((asset) => {
                const org = organizations.find((o) => o.id === asset.organizationId);
                const campus = campuses.find((c) => c.id === asset.campusId);
                const cat = categories.find((c) => c.id === asset.categoryId);
                const subCat = subCategories.find((s) => s.id === asset.subCategoryId);
                const isFurniture =
                  asset.isBulkAsset ||
                  cat?.name?.toLowerCase().includes('furniture') ||
                  cat?.code?.toLowerCase().includes('fur');

                return (
                  <tr key={asset.id} className="hover:bg-slate-800/50 transition-colors text-slate-300">
                    
                    {/* Tag, Ref Number & Serial */}
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      <div className="flex items-start gap-2">
                        <QrCode className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-slate-100 font-extrabold">{asset.assetTag}</p>
                          {asset.referenceNumber && (
                            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded text-[10px] font-semibold mt-0.5">
                              <Hash className="w-2.5 h-2.5" />
                              <span>{asset.referenceNumber}</span>
                            </span>
                          )}
                          {isFurniture ? (
                            <p className="text-[10px] text-sky-400 font-mono mt-0.5">
                              Qty: {asset.quantity || 1} units
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">S/N: {asset.assetSerialNumber}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Particulars & Vendor/Category */}
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-100">{asset.particulars}</p>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{asset.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {cat && (
                          <span className="bg-slate-800 text-slate-300 text-[9px] font-medium px-1.5 py-0.5 rounded border border-slate-700">
                            {cat.name}
                          </span>
                        )}
                        {subCat && (
                          <span className="bg-amber-500/10 text-amber-400 text-[9px] font-semibold px-1.5 py-0.5 rounded border border-amber-500/30">
                            {subCat.name}
                          </span>
                        )}
                        {asset.vendor && (
                          <span className="inline-flex items-center gap-1 bg-slate-800/90 text-amber-300 text-[9px] font-medium px-1.5 py-0.5 rounded border border-amber-500/20">
                            <Truck className="w-2.5 h-2.5 text-amber-400" />
                            <span>{asset.vendor}</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Org & Campus */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-200">{org?.shortCode || 'ORG'}</p>
                      <p className="text-[10px] text-slate-400">{campus?.name || 'Campus'}</p>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-300">
                      {asset.assetLocationCode}
                    </td>

                    {/* Cost, Quantity, Purchase Date & Addition Date */}
                    <td className="py-3 px-4 text-right font-mono">
                      <p className="font-bold text-slate-100">{formatINR(asset.purchaseCost)}</p>
                      {asset.quantity && asset.quantity > 1 && asset.unitCost && (
                        <p className="text-[10px] text-sky-400">
                          {asset.quantity} × {formatINR(asset.unitCost)}
                        </p>
                      )}
                      <p className="text-[10px] text-amber-400 font-medium mt-0.5" title="Date of Purchase">
                        Purchased: {formatDate(asset.purchaseDate)}
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium" title="Asset Addition Date">
                        Added: {formatDate(asset.createdDate)}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        asset.assetStatus === 'Active' || asset.assetStatus === 'In Use'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : asset.assetStatus === 'Under Repair'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {asset.assetStatus}
                      </span>
                    </td>

                    {/* Condition */}
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        asset.currentCondition === 'Excellent' || asset.currentCondition === 'Good'
                          ? 'text-slate-300 bg-slate-800'
                          : 'text-amber-400 bg-amber-950/40 border border-amber-800'
                      }`}>
                        {asset.currentCondition}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onViewAssetDetails(asset)}
                          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="View Asset Profile & History"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onOpenLabelPrint(asset)}
                          className="p-1.5 hover:bg-slate-800 text-amber-400 rounded-lg transition-colors cursor-pointer"
                          title="Print QR & Barcode Label"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onOpenTransferModal(asset)}
                          className="p-1.5 hover:bg-slate-800 text-blue-400 rounded-lg transition-colors cursor-pointer"
                          title="Transfer / Move Asset"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setEditingAsset(asset);
                            setFormAsset(asset);
                            if (asset.referencePrefix) {
                              setRefPrefixChoice(asset.referencePrefix);
                              setCustomPrefixText(asset.referencePrefix);
                            }
                            if (asset.unitCost) {
                              setUnitCostInput(asset.unitCost);
                            }
                            setIsFurnitureMode(Boolean(asset.isBulkAsset || (asset.quantity && asset.quantity > 1)));
                            setShowAddModal(true);
                          }}
                          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded-lg transition-colors cursor-pointer"
                          title="Edit Asset"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setDeleteConfirm({
                              isOpen: true,
                              title: `Delete Asset ${asset.assetTag}`,
                              message: `Are you sure you want to delete asset "${asset.particulars}" (${asset.assetTag})?`,
                              onConfirm: async () => {
                                await onDeleteAsset(asset.id);
                              }
                            });
                          }}
                          className="p-1.5 hover:bg-slate-800 text-rose-400 rounded-lg transition-colors cursor-pointer"
                          title="Delete Asset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No matching assets found in register.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT ASSET MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-400" />
                  <span>{editingAsset ? 'Edit Asset Record' : 'Register New Enterprise Asset'}</span>
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Complete master registration with customized reference prefix, vendor linking & furniture bulk valuation.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-4 text-xs">
              
              {/* Asset Mode Selector: Standard Item vs Furniture / Bulk Lots */}
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg border ${isFurnitureMode ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                    <Armchair className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-xs flex items-center gap-2">
                      <span>Asset Type Mode:</span>
                      <span className={isFurnitureMode ? 'text-sky-400 font-extrabold' : 'text-amber-400 font-extrabold'}>
                        {isFurnitureMode ? 'Furniture & Bulk Asset (Chairs, Tables, Desks)' : 'Individual Asset (IT, Machinery, Equipment)'}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {isFurnitureMode
                        ? 'Configured for Quantity & Unit Cost calculation (Serial Number optional)'
                        : 'Configured for individual asset tracking with mandatory/unique serial numbers'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isFurnitureMode;
                      setIsFurnitureMode(next);
                      setFormAsset((prev) => ({
                        ...prev,
                        isBulkAsset: next,
                        quantity: next ? (prev.quantity && prev.quantity > 1 ? prev.quantity : 10) : 1
                      }));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isFurnitureMode
                        ? 'bg-sky-500 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <Armchair className="w-3.5 h-3.5" />
                    <span>{isFurnitureMode ? '✓ Furniture Mode Active' : 'Switch to Furniture Mode'}</span>
                  </button>
                </div>
              </div>

              {/* Row 1: Particulars & Category & Subcategory */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Particulars (Asset Item Name) *</label>
                  <input
                    type="text"
                    required
                    value={formAsset.particulars || ''}
                    onChange={(e) => setFormAsset({ ...formAsset, particulars: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder={isFurnitureMode ? 'e.g. Ergonomic Executive Chairs, Conference Table' : 'e.g. Dell PowerEdge Server, Daikin 2-Ton AC'}
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Asset Category *</label>
                  <select
                    value={formAsset.categoryId}
                    onChange={(e) => {
                      const newCatId = e.target.value;
                      const subs = subCategories.filter(s => s.categoryId === newCatId);
                      const cat = categories.find(c => c.id === newCatId);
                      const isFur = cat?.name?.toLowerCase().includes('furniture') || cat?.code?.toLowerCase().includes('fur');
                      if (isFur) {
                        setIsFurnitureMode(true);
                      }
                      setFormAsset({
                        ...formAsset,
                        categoryId: newCatId,
                        subCategoryId: subs[0]?.id || '',
                        isBulkAsset: isFur || formAsset.isBulkAsset
                      });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Asset Subcategory</label>
                  <select
                    value={formAsset.subCategoryId || ''}
                    onChange={(e) => setFormAsset({ ...formAsset, subCategoryId: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Select Subcategory --</option>
                    {subCategories
                      .filter((s) => s.categoryId === formAsset.categoryId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Reference Number with Customized Prefix & Vendor Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                {/* 2A: Reference Number Generator */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-amber-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5" />
                      <span>Reference Number & Custom Prefix</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => generateNewReferenceNumber(refPrefixChoice === 'CUSTOM' ? customPrefixText : refPrefixChoice)}
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Auto Generate</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">Prefix Preset</span>
                      <select
                        value={refPrefixChoice}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRefPrefixChoice(val);
                          const prefix = val === 'CUSTOM' ? customPrefixText : val;
                          const currentNum = formAsset.referenceNumber || '';
                          const suffix = currentNum.includes('-') ? currentNum.split('-').slice(1).join('-') : `${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;
                          setFormAsset((prev) => ({
                            ...prev,
                            referencePrefix: prefix,
                            referenceNumber: `${prefix}-${suffix}`
                          }));
                        }}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                      >
                        <option value="RF">RF (Reference)</option>
                        <option value="PO">PO (Purchase Order)</option>
                        <option value="INV">INV (Invoice)</option>
                        <option value="DC">DC (Delivery Challan)</option>
                        <option value="WO">WO (Work Order)</option>
                        <option value="GRN">GRN (Goods Receipt)</option>
                        <option value="ARG">ARG (Amara Raja)</option>
                        <option value="CUSTOM">Custom Prefix...</option>
                      </select>
                    </div>

                    {refPrefixChoice === 'CUSTOM' ? (
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">Custom Prefix</span>
                        <input
                          type="text"
                          value={customPrefixText}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setCustomPrefixText(val);
                            const currentNum = formAsset.referenceNumber || '';
                            const suffix = currentNum.includes('-') ? currentNum.split('-').slice(1).join('-') : `${new Date().getFullYear()}-001`;
                            setFormAsset((prev) => ({
                              ...prev,
                              referencePrefix: val,
                              referenceNumber: `${val}-${suffix}`
                            }));
                          }}
                          placeholder="e.g. FUR-RF"
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs font-bold"
                        />
                      </div>
                    ) : null}

                    <div className={refPrefixChoice === 'CUSTOM' ? 'col-span-1' : 'col-span-2'}>
                      <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">Full Reference Number</span>
                      <input
                        type="text"
                        value={formAsset.referenceNumber || ''}
                        onChange={(e) => setFormAsset({ ...formAsset, referenceNumber: e.target.value })}
                        placeholder="e.g. RF-2026-0891"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-emerald-400 font-mono text-xs font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>Generated Reference Tag:</span>
                    <span className="text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {formAsset.referenceNumber || 'RF-2026-XXXX'}
                    </span>
                  </div>
                </div>

                {/* 2B: Vendor / Supplier Dropdown */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-amber-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" />
                      <span>Vendor / Supplier Selection</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {vendors.length} registered vendors available
                    </span>
                  </div>

                  <div>
                    <select
                      value={formAsset.vendorId || ''}
                      onChange={(e) => {
                        const vId = e.target.value;
                        const matched = vendors.find((v) => v.id === vId);
                        if (matched) {
                          setFormAsset((prev) => ({
                            ...prev,
                            vendorId: matched.id,
                            vendor: matched.name
                          }));
                        } else if (vId === 'OTHER') {
                          setFormAsset((prev) => ({
                            ...prev,
                            vendorId: undefined,
                            vendor: ''
                          }));
                        }
                      }}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- Choose Registered Vendor --</option>
                      {vendors.map((v) => {
                        const cats = (Array.isArray(v.categories) && v.categories.length > 0)
                          ? v.categories.join(', ')
                          : v.category || 'General Supplies';
                        return (
                          <option key={v.id} value={v.id}>
                            {v.name} ({v.code}) — {cats}
                          </option>
                        );
                      })}
                      <option value="OTHER">Other / Manual Entry...</option>
                    </select>
                  </div>

                  {(!formAsset.vendorId || formAsset.vendorId === 'OTHER') && (
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">Custom Vendor Name</span>
                      <input
                        type="text"
                        value={formAsset.vendor || ''}
                        onChange={(e) => setFormAsset({ ...formAsset, vendor: e.target.value })}
                        placeholder="Enter supplier/vendor name"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                      />
                    </div>
                  )}

                  {formAsset.vendorId && (
                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span className="text-slate-500">Selected:</span>
                      <span className="text-amber-400 font-semibold">{formAsset.vendor}</span>
                      {vendors.find(v => v.id === formAsset.vendorId)?.gstNumber && (
                        <span className="text-slate-400 font-mono">
                          (GST: {vendors.find(v => v.id === formAsset.vendorId)?.gstNumber})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3: Furniture / Bulk Specific Calculations (Quantity & Total Cost) */}
              {isFurnitureMode ? (
                <div className="bg-sky-950/30 border border-sky-500/30 p-3.5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sky-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Furniture Bulk Details & Auto Cost Calculation</span>
                    </p>
                    <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-mono">
                      Total Cost = Quantity × Unit Price
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Quantity (Pieces / Units) *</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={formAsset.quantity || 1}
                        onChange={(e) => {
                          const q = Math.max(1, parseInt(e.target.value) || 1);
                          const u = formAsset.unitCost || (formAsset.purchaseCost ? Math.round(formAsset.purchaseCost / (formAsset.quantity || 1)) : 2500);
                          handleQuantityOrUnitCostChange(q, u);
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-sm font-bold focus:outline-none focus:border-sky-500"
                        placeholder="e.g. 50"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Unit Price / Cost (₹) *</label>
                      <input
                        type="number"
                        min={0}
                        value={formAsset.unitCost || 0}
                        onChange={(e) => {
                          const u = parseFloat(e.target.value) || 0;
                          setUnitCostInput(u);
                          handleQuantityOrUnitCostChange(formAsset.quantity || 1, u);
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-sm font-bold focus:outline-none focus:border-sky-500"
                        placeholder="e.g. 3500"
                      />
                    </div>

                    <div>
                      <label className="block text-emerald-400 mb-1 font-bold">Total Purchase Cost (₹)</label>
                      <input
                        type="number"
                        value={formAsset.purchaseCost || 0}
                        onChange={(e) => {
                          const tot = parseFloat(e.target.value) || 0;
                          const q = formAsset.quantity || 1;
                          setFormAsset((prev) => ({
                            ...prev,
                            purchaseCost: tot,
                            currentValue: tot,
                            unitCost: q > 0 ? Math.round(tot / q) : tot
                          }));
                        }}
                        className="w-full bg-slate-950 border border-emerald-500/50 rounded-lg px-3 py-1.5 text-emerald-400 font-mono text-sm font-black focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Batch / Lot / PO Number</label>
                      <input
                        type="text"
                        value={formAsset.assetSerialNumber || ''}
                        onChange={(e) => setFormAsset({ ...formAsset, assetSerialNumber: e.target.value })}
                        placeholder="e.g. BATCH-CHAIR-2026"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Furniture Attributes: Material, Dimensions, Color */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
                    <div>
                      <label className="block text-slate-400 mb-1">Material / Upholstery</label>
                      <input
                        type="text"
                        value={formAsset.material || ''}
                        onChange={(e) => setFormAsset({ ...formAsset, material: e.target.value })}
                        placeholder="e.g. Ergonomic Breathable Mesh, Teak Wood, Stainless Steel"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Dimensions / Size</label>
                      <input
                        type="text"
                        value={formAsset.dimensions || ''}
                        onChange={(e) => setFormAsset({ ...formAsset, dimensions: e.target.value })}
                        placeholder="e.g. 600W × 600D × 950H mm"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Color / Finish</label>
                      <input
                        type="text"
                        value={formAsset.color || ''}
                        onChange={(e) => setFormAsset({ ...formAsset, color: e.target.value })}
                        placeholder="e.g. Charcoal Black / Natural Walnut"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Row 4: Description */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Asset Description & Technical Specs</label>
                <textarea
                  rows={2}
                  value={formAsset.description || ''}
                  onChange={(e) => setFormAsset({ ...formAsset, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  placeholder="Detailed technical specifications, warranty SLA, location details..."
                />
              </div>

              {/* Row 5: Dependent Location Hierarchy Assignment */}
              <div className="border border-slate-800 bg-slate-950 p-4 rounded-xl space-y-2">
                <p className="font-bold text-amber-400 text-[11px] uppercase tracking-wider">Dependent Location Hierarchy Assignment</p>
                <LocationCascadingSelect
                  organizations={organizations}
                  campuses={campuses}
                  buildings={buildings}
                  rooms={rooms}
                  selectedOrgId={formAsset.organizationId || ''}
                  selectedCampusId={formAsset.campusId || ''}
                  selectedBuildingId={formAsset.buildingId || ''}
                  selectedRoomId={formAsset.roomId || ''}
                  onChangeOrg={(orgId) => setFormAsset(prev => ({ ...prev, organizationId: orgId }))}
                  onChangeCampus={(campusId) => setFormAsset(prev => ({ ...prev, campusId }))}
                  onChangeBuilding={(buildingId) => setFormAsset(prev => ({ ...prev, buildingId }))}
                  onChangeRoom={(roomId) => setFormAsset(prev => ({ ...prev, roomId }))}
                  showAllOption={false}
                  layout="stacked"
                />
              </div>

              {/* Row 6: Financials, Dates & Standard Attributes */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold text-amber-400">Date of Purchase *</label>
                  <input
                    type="date"
                    required
                    value={formAsset.purchaseDate || ''}
                    onChange={(e) => setFormAsset({ ...formAsset, purchaseDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold text-emerald-400">Asset Addition Date</label>
                  <input
                    type="date"
                    value={formAsset.createdDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormAsset({ ...formAsset, createdDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-mono text-xs"
                  />
                </div>

                {!isFurnitureMode && (
                  <div>
                    <label className="block text-slate-400 mb-1">Purchase Cost (₹)</label>
                    <input
                      type="number"
                      value={formAsset.purchaseCost || 0}
                      onChange={(e) => setFormAsset({ ...formAsset, purchaseCost: Number(e.target.value), currentValue: Number(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 mb-1">Current Book Value (₹)</label>
                  <input
                    type="number"
                    value={formAsset.currentValue || 0}
                    onChange={(e) => setFormAsset({ ...formAsset, currentValue: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>

                {!isFurnitureMode && (
                  <div>
                    <label className="block text-slate-400 mb-1">Serial Number *</label>
                    <input
                      type="text"
                      value={formAsset.assetSerialNumber || ''}
                      onChange={(e) => setFormAsset({ ...formAsset, assetSerialNumber: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                      placeholder="SN-1234567"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 mb-1">Status</label>
                  <select
                    value={formAsset.assetStatus}
                    onChange={(e) => setFormAsset({ ...formAsset, assetStatus: e.target.value as AssetStatus })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5"
                  >
                    <option value="Active">Active</option>
                    <option value="In Use">In Use</option>
                    <option value="In Store">In Store</option>
                    <option value="Under Repair">Under Repair</option>
                    <option value="Missing">Missing</option>
                    <option value="Disposed">Disposed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Condition</label>
                  <select
                    value={formAsset.currentCondition}
                    onChange={(e) => setFormAsset({ ...formAsset, currentCondition: e.target.value as AssetCondition })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
              </div>

              {/* Row 7: Brand, Assigned Employee & Invoice */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Manufacturer / Brand</label>
                  <input
                    type="text"
                    value={formAsset.manufacturer || ''}
                    onChange={(e) => setFormAsset({ ...formAsset, manufacturer: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                    placeholder="e.g. Godrej / Dell / Voltas"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Invoice Number</label>
                  <input
                    type="text"
                    value={formAsset.invoiceNumber || ''}
                    onChange={(e) => setFormAsset({ ...formAsset, invoiceNumber: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                    placeholder="INV-2026-001"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Assigned Employee / Custodian</label>
                  <input
                    type="text"
                    value={formAsset.assignedEmployee || ''}
                    onChange={(e) => setFormAsset({ ...formAsset, assignedEmployee: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                    placeholder="e.g. S. Ramakrishna"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl font-bold cursor-pointer shadow-lg"
                >
                  {editingAsset ? 'Update Asset Record' : 'Register Asset in System'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* EXCEL BULK IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <span>Bulk Import Assets from Excel</span>
              </h2>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Upload an Excel (.xlsx / .csv) sheet matching the Amara Raja Group asset register format.
            </p>

            <div className="bg-slate-850 border border-dashed border-slate-700 p-6 rounded-xl text-center space-y-3">
              <Upload className="w-8 h-8 text-amber-400 mx-auto" />
              <div>
                <p className="text-xs font-semibold text-slate-200">Select Excel file to upload</p>
                <p className="text-[10px] text-slate-400">Supports .xlsx, .xls, .csv files</p>
              </div>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-amber-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Sample Template
              </button>
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 cursor-pointer font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
