export type UserRole =
  | 'Super Admin'
  | 'Organization Admin'
  | 'Campus Admin'
  | 'Department Admin'
  | 'Store Keeper'
  | 'Asset Verifier'
  | 'Auditor'
  | 'Principal'
  | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId?: string;
  campusId?: string;
  departmentId?: string;
  avatar?: string;
  allowedPages?: string[];
  password?: string;
  username?: string;
}

export interface Organization {
  id: string;
  name: string;
  shortCode: string;
  logo?: string;
  address: string;
  gstNumber: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  createdDate: string;
}

export interface Campus {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  campusType?: string; // School Campus, Hospital Campus, Corporate Campus, Industrial Campus, Warehouse, Office Campus, Medical Campus, Training Centre, Others
  address: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  googleMapLink?: string;
  phone?: string;
  email?: string;
  status: 'Active' | 'Inactive';
  remarks?: string;
}

export interface Branch {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  city?: string;
  status: 'Active' | 'Inactive';
}

export interface Block {
  id: string;
  campusId: string;
  organizationId?: string;
  name: string;
  code: string;
  blockType?: string; // Primary, Secondary, Senior Secondary, Administrative, Hostel, Laboratory, Medical, Pharmacy, Office, Warehouse, Emergency, Academic, Custom
  description?: string;
  status: 'Active' | 'Inactive';
}

export interface Building {
  id: string;
  campusId: string;
  blockId?: string;
  organizationId: string;
  name: string;
  code: string;
  buildingType: string; // Academic, Office, Hospital, Warehouse, Laboratory, Hostel, Library, Pharmacy, Medical Store, Auditorium, Sports Complex, Factory, Workshop, Security, Generator Room, Others
  constructionYear?: number;
  noOfFloors?: number;
  totalRooms?: number;
  latitude?: number;
  longitude?: number;
  photo?: string;
  blueprintPdfUrl?: string;
  status: 'Active' | 'Inactive';
}

export interface Floor {
  id: string;
  buildingId: string;
  name: string;
  code: string;
  floorNumber: number;
  floorType?: string; // Ground, 1st, 2nd, 3rd, 4th, Basement, Terrace, Mezzanine, Custom
  status?: 'Active' | 'Inactive';
}

export interface Wing {
  id: string;
  buildingId: string;
  floorId?: string;
  name: string; // East Wing, West Wing, North Wing, South Wing, Central Wing, Left Wing, Right Wing, Custom
  code: string;
  status?: 'Active' | 'Inactive';
}

export interface Department {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  hodName: string;
  phone?: string;
  email?: string;
  departmentType?: string; // Administration, Accounts, HR, IT, Store, Library, Transport, Medical, Pharmacy, Security, Electrical, Maintenance, Housekeeping, Science, Mathematics, Computer Science, Sports, Custom
  status?: 'Active' | 'Inactive';
}

export interface Room {
  id: string;
  floorId: string;
  buildingId: string;
  wingId?: string;
  departmentId?: string;
  name: string;
  roomNumber: string;
  roomCode?: string;
  roomType: string; // Classroom, Smart Classroom, Computer Lab, Physics Lab, Chemistry Lab, Biology Lab, Library, Principal Room, Admin Office, Server Room, Electrical Room, Medical Room, Store Room, Washroom, Parking, Playground, Auditorium, Warehouse, Custom Room, etc.
  roomCategory?: string;
  areaSqFt?: number;
  capacity?: number;
  occupancy?: number;
  qrCode?: string;
  barcode?: string;
  photo?: string;
  blueprintUrl?: string;
  status?: 'Active' | 'Inactive' | 'Under Maintenance';
  remarks?: string;
}

export interface SubRoom {
  id: string;
  roomId: string;
  name: string;
  code: string;
  description?: string;
  status?: 'Active' | 'Inactive';
}

export interface Section {
  id: string;
  campusId: string;
  gradeLevel: string; // Nursery, LKG, UKG, Class 1 .. Class 12, Custom
  sectionName: string; // A, B, C, D, Rose, Lilly, Jasmine, Lotus, Tulip, etc.
  roomNumber?: string;
}

export interface Lab {
  id: string;
  campusId: string;
  buildingId?: string;
  roomId?: string;
  labName: string;
  labType: string; // Computer Lab, Physics Lab, Chemistry Lab, Biology Lab, Composite Lab, Language Lab, Robotics Lab, AI Lab, STEM Lab, Medical Lab, Pharmacy Lab, HVAC Lab, Custom Labs
  inCharge?: string;
  totalWorkstations?: number;
}

export interface SpecialLocation {
  id: string;
  campusId: string;
  name: string; // Playground, Open Stage, Parking, Reception, Garden, Security Gate, Bus Bay, Water Tank, Terrace, Generator Area, UPS Area, Transformer Yard, Solar Plant
  type: string;
  photoUrl?: string;
}

export interface LocationDocument {
  id: string;
  locationType: 'Campus' | 'Building' | 'Floor' | 'Room';
  locationId: string;
  title: string;
  docType: 'Blueprint' | 'Floor Plan' | 'Fire Safety Map' | 'Electrical Layout' | 'Network Diagram' | 'Photos' | 'Inspection Reports';
  fileUrl: string;
  uploadedBy: string;
  uploadedDate: string;
}

export interface LocationHistory {
  id: string;
  locationType: 'Campus' | 'Block' | 'Building' | 'Floor' | 'Room';
  locationId: string;
  locationName: string;
  action: 'Created' | 'Modified' | 'Renamed' | 'Transferred' | 'Merged' | 'Disabled' | 'Deleted';
  actionBy: string;
  timestamp: string;
  details: string;
}

export interface Vendor {
  id: string;
  name: string;
  code: string; // e.g. VND-001
  contactPerson: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  panNumber?: string;
  category?: string; // e.g. "IT Equipment, CCTV & Security"
  categories?: string[]; // Multiple supply categories: ['IT Equipment', 'Furniture & Fixtures', 'AMC & Maintenance']
  status: 'Active' | 'Inactive';
  rating?: number; // 1 to 5
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branch?: string;
  };
  paymentTerms?: string; // Net 30, Net 15, Advance 50%, Immediate, etc.
  notes?: string;
  createdDate?: string;
  updatedDate?: string;
}

export interface AssetCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface AssetSubCategory {
  id: string;
  categoryId: string;
  name: string;
  code: string;
}

export type AssetCondition = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Damaged';
export type AssetStatus = 'Active' | 'In Use' | 'In Store' | 'Under Repair' | 'Disposed' | 'Missing';
export type BarcodeType = 'Code128' | 'Code39' | 'EAN13';

export interface Asset {
  id: string;
  assetTag: string; // E.g. ARG-ARVD-IT-001
  particulars: string;
  description: string;
  assetLocationCode: string; // E.g. ARVD-DIG-BLD1-FL1-RM101
  purchaseDate: string;
  organizationId: string;
  campusId: string;
  buildingId: string;
  floorId: string;
  roomId: string;
  departmentId: string;
  division?: string;
  placeOfAsset?: string;
  quantity: number;
  unitCost?: number; // for bulk/furniture assets
  purchaseCost: number; // total purchase cost (Quantity * UnitCost for bulk)
  currentValue: number;
  depreciationRate: number; // percentage
  expectedLifeYears: number;
  referenceNumber?: string; // Reference Number with customizable prefix (e.g. RF-2024-001, PO-0982)
  referencePrefix?: string; // e.g. RF, PO, INV, DC
  isBulkAsset?: boolean; // true for Furniture (chairs, tables) & bulk lots
  material?: string; // Solid Wood, Steel, Ergonomic Mesh, etc.
  dimensions?: string; // e.g. 120 x 60 x 75 cm
  color?: string; // e.g. Walnut Brown, Black, Gray
  assetAllocationNumber: string;
  assetSerialNumber: string;
  rfidNumber?: string;
  manufacturer: string;
  model: string;
  vendor: string;
  vendorId?: string; // Reference to Vendor.id
  invoiceNumber: string;
  warrantyStart?: string;
  warrantyEnd?: string;
  amcVendor?: string;
  amcStart?: string;
  amcEnd?: string;
  amcCost?: number;
  currentCondition: AssetCondition;
  assetStatus: AssetStatus;
  assignedEmployee?: string;
  assetPhoto?: string;
  invoicePdfUrl?: string;
  manualPdfUrl?: string;
  remarks?: string;
  latitude?: number;
  longitude?: number;
  createdBy: string;
  createdDate: string;
  modifiedBy?: string;
  modifiedDate?: string;
  categoryId: string;
  subCategoryId?: string;
  barcodeType?: BarcodeType;
}

export interface DeletedAsset {
  id: string;
  assetId: string;
  assetTag: string;
  particulars: string;
  organizationId: string;
  campusId?: string;
  buildingId?: string;
  roomId?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  createdDate?: string; // Addition Date
  deletedDate: string; // Deletion Date
  deletedBy: string;
  reason?: string;
  assetLocationCode?: string;
}

export interface AssetTransfer {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  fromOrganizationId: string;
  fromCampusId: string;
  fromBuildingId: string;
  fromRoomId: string;
  toOrganizationId: string;
  toCampusId: string;
  toBuildingId: string;
  toRoomId: string;
  transferReason: string;
  requestedBy: string;
  requestedDate: string;
  approvedBy?: string;
  approvedDate?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  notes?: string;
}

export type VerificationStatus = 'Present' | 'Missing' | 'Damaged' | 'Repair Needed' | 'Disposed';

export interface PhysicalVerification {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  verifiedBy: string;
  verifiedDate: string;
  verificationStatus: VerificationStatus;
  locationMatched: boolean;
  actualRoomId?: string;
  photoCaptured?: string;
  remarks?: string;
  latitude?: number;
  longitude?: number;
}

export interface RepairRecord {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  complaintDate: string;
  issueDescription: string;
  vendorName: string;
  estimatedCost: number;
  actualCost?: number;
  repairStatus: 'Pending' | 'In Progress' | 'Repaired' | 'Unrepairable';
  repairedDate?: string;
  technicianNotes?: string;
}

export interface AMCRecord {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  vendorName: string;
  vendorContact: string;
  startDate: string;
  endDate: string;
  cost: number;
  status: 'Active' | 'Expiring Soon' | 'Expired';
  renewalNotes?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string; // e.g., 'CREATE_ASSET', 'TRANSFER_ASSET', 'VERIFY_ASSET'
  entityType: string;
  entityId: string;
  organizationId?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress: string;
  browser: string;
  timestamp: string;
}

export interface LabelPrintConfig {
  labelSize: '40x20' | '50x30' | '100x50' | 'A4_SHEET';
  showQrCode: boolean;
  showBarcode: boolean;
  showLogo: boolean;
  showLocation: boolean;
  barcodeType: BarcodeType;
  copies: number;
}

export interface DashboardStats {
  totalOrganizations: number;
  totalCampuses: number;
  totalBuildings: number;
  totalRooms: number;
  totalAssets: number;
  totalAssetValue: number;
  underRepairCount: number;
  missingCount: number;
  expiredWarrantyCount: number;
  amcDueCount: number;
  assetsByOrg: { orgName: string; count: number; value: number }[];
  assetsByCategory: { categoryName: string; count: number }[];
  assetsByCampus: { campusName: string; count: number }[];
  recentTransfers: AssetTransfer[];
  recentVerifications: PhysicalVerification[];
}

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketStatus = 'Open' | 'Assigned' | 'In Progress' | 'Pending Parts' | 'Resolved' | 'Closed';
export type TicketCategory =
  | 'Hardware Failure'
  | 'Network/Wifi Issue'
  | 'Electrical/Power'
  | 'HVAC/AC Repair'
  | 'Furniture Repair'
  | 'Plumbing'
  | 'Civil/Building Maintenance'
  | 'Software/OS'
  | 'General Complaint';

export interface TicketComment {
  id: string;
  authorName: string;
  authorRole: string;
  text: string;
  timestamp: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  organizationId: string;
  campusId: string;
  buildingId: string;
  roomId?: string;
  assetId?: string;
  assetTag?: string;
  assetName?: string;
  reportedBy: string;
  reportedByEmail?: string;
  reportedDate: string;
  assignedTechnician?: string;
  technicianPhone?: string;
  targetResolutionDate?: string;
  resolvedDate?: string;
  resolutionNotes?: string;
  estimatedCost?: number;
  comments?: TicketComment[];
}

export type ThemeCategory = 'Official & Enterprise' | 'Executive Dark' | 'Specialized & Modern';

export type AppTheme =
  // Official & Enterprise Professional Themes (Front-end Standard)
  | 'corporate-slate'
  | 'classic-enterprise'
  | 'institutional-emerald'
  | 'federal-monochrome'
  | 'executive-navy'
  | 'high-contrast-dark'
  | 'healthcare-teal'
  | 'nordic-frost'
  // Signature & Classic Themes
  | 'amara-gold'
  | 'midnight-navy'
  | 'cyber-emerald'
  | 'royal-amethyst'
  | 'crimson-ruby'
  | 'sunset-amber'
  | 'steel-slate'
  | 'crisp-light';

export interface ThemeMeta {
  id: AppTheme;
  name: string;
  tagline: string;
  isDark: boolean;
  category: ThemeCategory;
  isOfficial?: boolean;
  badgeLabel?: string;
  primaryBg: string;
  cardBg: string;
  headerBg: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  borderClass: string;
  previewColor: string;
}

export const THEME_OPTIONS: ThemeMeta[] = [
  // ----------------------------------------------------
  // OFFICIAL PROFESSIONAL & ENTERPRISE THEMES
  // ----------------------------------------------------
  {
    id: 'corporate-slate',
    name: 'Official Corporate Slate',
    tagline: 'Standard Boardroom & Corporate Executive Theme — Crisp White Surfaces, Hairline Borders & Deep Slate',
    isDark: false,
    category: 'Official & Enterprise',
    isOfficial: true,
    badgeLabel: 'Official Corporate',
    primaryBg: '#f8fafc',
    cardBg: '#ffffff',
    headerBg: '#0f172a',
    accentColor: '#0f172a',
    badgeBg: 'bg-slate-900/10',
    badgeText: 'text-slate-900',
    borderClass: 'border-slate-300',
    previewColor: '#0f172a'
  },
  {
    id: 'classic-enterprise',
    name: 'Classic Enterprise Blue (SAP / Oracle)',
    tagline: 'Global ERP & IT Asset Standard — Enterprise Cobalt Header, Pure White Panels & High-Density Tables',
    isDark: false,
    category: 'Official & Enterprise',
    isOfficial: true,
    badgeLabel: 'SAP / Oracle Standard',
    primaryBg: '#f1f5f9',
    cardBg: '#ffffff',
    headerBg: '#1e3a8a',
    accentColor: '#1d4ed8',
    badgeBg: 'bg-blue-600/10',
    badgeText: 'text-blue-700',
    borderClass: 'border-blue-400/40',
    previewColor: '#1d4ed8'
  },
  {
    id: 'institutional-emerald',
    name: 'Institutional Banking & Audit',
    tagline: 'Statutory Compliance & Banking Audit Standard — Deep Forest Green Trim with Crisp Ledger Panels',
    isDark: false,
    category: 'Official & Enterprise',
    isOfficial: true,
    badgeLabel: 'Banking & Audit ESG',
    primaryBg: '#f4f6f5',
    cardBg: '#ffffff',
    headerBg: '#064e3b',
    accentColor: '#059669',
    badgeBg: 'bg-emerald-600/10',
    badgeText: 'text-emerald-700',
    borderClass: 'border-emerald-500/30',
    previewColor: '#059669'
  },
  {
    id: 'federal-monochrome',
    name: 'Federal GovTech Monochrome',
    tagline: 'Official Government & Swiss Neutral Clarity — Stark White Cards, Jet Black Text, Zero Distraction',
    isDark: false,
    category: 'Official & Enterprise',
    isOfficial: true,
    badgeLabel: 'GovTech Neutral',
    primaryBg: '#fafafa',
    cardBg: '#ffffff',
    headerBg: '#18181b',
    accentColor: '#18181b',
    badgeBg: 'bg-zinc-800/10',
    badgeText: 'text-zinc-900',
    borderClass: 'border-zinc-400',
    previewColor: '#18181b'
  },
  {
    id: 'executive-navy',
    name: 'Executive Midnight Navy & Platinum',
    tagline: 'High-Level Institutional & Boardroom Dark — Deep Navy Blue with Polished Steel & Sky Blue Highlights',
    isDark: true,
    category: 'Official & Enterprise',
    isOfficial: true,
    badgeLabel: 'Executive Dark',
    primaryBg: '#0b1120',
    cardBg: '#0f172a',
    headerBg: '#0b1120',
    accentColor: '#38bdf8',
    badgeBg: 'bg-sky-500/20',
    badgeText: 'text-sky-400',
    borderClass: 'border-sky-500/30',
    previewColor: '#38bdf8'
  },
  {
    id: 'high-contrast-dark',
    name: 'Official Ops Center & NOC',
    tagline: 'Mission-Critical Operations Room — Pure Black Canvas, Razor-Sharp Border Trims & High Legibility',
    isDark: true,
    category: 'Official & Enterprise',
    isOfficial: true,
    badgeLabel: '24/7 NOC Console',
    primaryBg: '#020408',
    cardBg: '#090d16',
    headerBg: '#050811',
    accentColor: '#60a5fa',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-400',
    borderClass: 'border-blue-500/30',
    previewColor: '#60a5fa'
  },
  {
    id: 'healthcare-teal',
    name: 'Clinical & Healthcare Teal',
    tagline: 'Hospital, Medical Campus & Laboratory Asset Standard — Deep Ocean Teal Header & Bright Sterile Panels',
    isDark: false,
    category: 'Official & Enterprise',
    isOfficial: true,
    badgeLabel: 'Healthcare / Lab',
    primaryBg: '#f0fdfa',
    cardBg: '#ffffff',
    headerBg: '#0f766e',
    accentColor: '#0d9488',
    badgeBg: 'bg-teal-600/10',
    badgeText: 'text-teal-700',
    borderClass: 'border-teal-500/30',
    previewColor: '#0d9488'
  },
  {
    id: 'nordic-frost',
    name: 'Nordic Steel & Ice Slate',
    tagline: 'Engineering & Industrial Infrastructure — Cool Slate Surfaces with Frost Cyan Precision Accents',
    isDark: true,
    category: 'Official & Enterprise',
    isOfficial: true,
    badgeLabel: 'Nordic Engineering',
    primaryBg: '#0c131f',
    cardBg: '#151f32',
    headerBg: '#0e1726',
    accentColor: '#0284c7',
    badgeBg: 'bg-sky-500/20',
    badgeText: 'text-sky-300',
    borderClass: 'border-sky-500/30',
    previewColor: '#0284c7'
  },

  // ----------------------------------------------------
  // CLASSIC EXECUTIVE & SPECIALIZED THEMES
  // ----------------------------------------------------
  {
    id: 'amara-gold',
    name: 'Amara Executive Gold',
    tagline: 'Classic Dark Executive Theme with Warm Amber & Gold Accents',
    isDark: true,
    category: 'Executive Dark',
    primaryBg: '#020617',
    cardBg: '#0f172a',
    headerBg: '#0f172a',
    accentColor: '#f59e0b',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-400',
    borderClass: 'border-amber-500/30',
    previewColor: '#f59e0b'
  },
  {
    id: 'crisp-light',
    name: 'Corporate Crisp Light',
    tagline: 'High-Contrast Bright Office Theme with Sapphire Blue Accents',
    isDark: false,
    category: 'Executive Dark',
    primaryBg: '#f8fafc',
    cardBg: '#ffffff',
    headerBg: '#ffffff',
    accentColor: '#2563eb',
    badgeBg: 'bg-blue-600/10',
    badgeText: 'text-blue-600',
    borderClass: 'border-blue-500/30',
    previewColor: '#2563eb'
  },
  {
    id: 'steel-slate',
    name: 'Steel Slate & Silver',
    tagline: 'Refined Modern Slate Canvas with High-Contrast Silver Accents',
    isDark: true,
    category: 'Executive Dark',
    primaryBg: '#0f172a',
    cardBg: '#1e293b',
    headerBg: '#1e293b',
    accentColor: '#38bdf8',
    badgeBg: 'bg-sky-500/20',
    badgeText: 'text-sky-400',
    borderClass: 'border-sky-500/30',
    previewColor: '#38bdf8'
  },
  {
    id: 'midnight-navy',
    name: 'Midnight Sapphire & Cyan',
    tagline: 'Deep Royal Indigo Canvas with Electric Sapphire Cyan Accents',
    isDark: true,
    category: 'Specialized & Modern',
    primaryBg: '#030712',
    cardBg: '#0a1128',
    headerBg: '#09132e',
    accentColor: '#06b6d4',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-400',
    borderClass: 'border-cyan-500/30',
    previewColor: '#06b6d4'
  },
  {
    id: 'cyber-emerald',
    name: 'Cyber Emerald & Obsidian',
    tagline: 'High-Tech Obsidian Canvas with Vibrant Mint Green Accents',
    isDark: true,
    category: 'Specialized & Modern',
    primaryBg: '#09090b',
    cardBg: '#18181b',
    headerBg: '#121215',
    accentColor: '#10b981',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
    previewColor: '#10b981'
  },
  {
    id: 'royal-amethyst',
    name: 'Royal Amethyst & Violet',
    tagline: 'Luxurious Deep Violet Canvas with Bright Amethyst Purple Accents',
    isDark: true,
    category: 'Specialized & Modern',
    primaryBg: '#0f0716',
    cardBg: '#1c0e2b',
    headerBg: '#1a0b26',
    accentColor: '#a855f7',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-400',
    borderClass: 'border-purple-500/30',
    previewColor: '#a855f7'
  },
  {
    id: 'crimson-ruby',
    name: 'Industrial Crimson Ruby',
    tagline: 'Bold Dark Industrial Canvas with Vibrant Crimson Ruby Red Accents',
    isDark: true,
    category: 'Specialized & Modern',
    primaryBg: '#11090b',
    cardBg: '#1f1113',
    headerBg: '#1d0f12',
    accentColor: '#f43f5e',
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-400',
    borderClass: 'border-rose-500/30',
    previewColor: '#f43f5e'
  },
  {
    id: 'sunset-amber',
    name: 'Sunset Bronze & Orange',
    tagline: 'Warm Industrial Canvas with Bright Bronze Orange Highlights',
    isDark: true,
    category: 'Specialized & Modern',
    primaryBg: '#0c0a09',
    cardBg: '#1c1917',
    headerBg: '#171412',
    accentColor: '#f97316',
    badgeBg: 'bg-orange-500/20',
    badgeText: 'text-orange-400',
    borderClass: 'border-orange-500/30',
    previewColor: '#f97316'
  }
];


