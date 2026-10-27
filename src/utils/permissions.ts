import { User, UserRole } from '../types';
import { NavTab } from '../components/Sidebar';

export interface PagePermissionDef {
  id: NavTab;
  label: string;
  description: string;
  category: 'Core Master' | 'Operations' | 'Reports & Admin';
}

export const ALL_PAGES: PagePermissionDef[] = [
  { id: 'dashboard', label: 'Dashboard Overview', description: 'Real-time asset metrics, valuations & quick stats', category: 'Core Master' },
  { id: 'assets', label: 'Asset Master Register', description: 'Central asset database, CRUD, photo/document uploads', category: 'Core Master' },
  { id: 'hierarchy', label: 'Org & Location Hierarchy', description: 'Organizations, Campuses, Buildings & Rooms setup', category: 'Core Master' },
  { id: 'vendors', label: 'Vendor Management', description: 'Vendors and suppliers directory, GST, rating & contracts', category: 'Core Master' },
  { id: 'tickets', label: 'Ticket & Complaint Desk', description: 'IT, Facility & Infrastructure breakdown complaint SLA management', category: 'Operations' },
  { id: 'categories', label: 'Categories & Subcategories', description: 'Asset classification & sub-category definitions', category: 'Core Master' },
  { id: 'users', label: 'User & Access Control', description: 'User management, role assignment & page permissions', category: 'Reports & Admin' },
  { id: 'transfers', label: 'Asset Movements & Transfers', description: 'Inter-org & campus asset movement workflows & approvals', category: 'Operations' },
  { id: 'verification', label: 'Physical Verification (Scan)', description: 'Barcode/QR mobile audit scanner & location matching', category: 'Operations' },
  { id: 'repairs', label: 'Repair & Maintenance', description: 'Breakdown complaints, vendor repair & cost tracking', category: 'Operations' },
  { id: 'amc', label: 'AMC & Warranty Tracking', description: 'Annual maintenance contracts, warranty expiry alerts', category: 'Operations' },
  { id: 'qr_labels', label: 'QR & Barcode Label Studio', description: 'Print thermal labels & A4 sticker sheets (40x20, 50x30, 100x50)', category: 'Operations' },
  { id: 'reports', label: 'Reports & Analytics', description: 'Executive BI dashboards, depreciation schedules & exports', category: 'Reports & Admin' },
  { id: 'audit_logs', label: 'System Audit Logs', description: 'Immutable security event timeline & user access logs', category: 'Reports & Admin' },
  { id: 'database_guide', label: 'Database & CPanel Guide', description: 'MySQL/cPanel database schema & deployment documentation', category: 'Reports & Admin' }
];

export function getDefaultPagesForRole(role: UserRole): NavTab[] {
  switch (role) {
    case 'Super Admin':
      return [
        'dashboard',
        'assets',
        'hierarchy',
        'vendors',
        'tickets',
        'categories',
        'users',
        'transfers',
        'verification',
        'repairs',
        'amc',
        'qr_labels',
        'reports',
        'audit_logs',
        'database_guide'
      ];

    case 'Organization Admin':
      return [
        'dashboard',
        'assets',
        'hierarchy',
        'vendors',
        'tickets',
        'categories',
        'users',
        'transfers',
        'verification',
        'repairs',
        'amc',
        'qr_labels',
        'reports',
        'audit_logs'
      ];

    case 'Campus Admin':
      return [
        'dashboard',
        'assets',
        'hierarchy',
        'vendors',
        'tickets',
        'transfers',
        'verification',
        'repairs',
        'amc',
        'qr_labels',
        'reports'
      ];

    case 'Department Admin':
      return [
        'dashboard',
        'assets',
        'tickets',
        'transfers',
        'verification',
        'repairs',
        'reports'
      ];

    case 'Store Keeper':
      return [
        'dashboard',
        'assets',
        'vendors',
        'tickets',
        'transfers',
        'verification',
        'repairs',
        'amc',
        'qr_labels'
      ];

    case 'Asset Verifier':
      return [
        'dashboard',
        'assets',
        'tickets',
        'verification',
        'qr_labels'
      ];

    case 'Auditor':
      return [
        'dashboard',
        'assets',
        'vendors',
        'tickets',
        'verification',
        'reports',
        'audit_logs'
      ];

    case 'Principal':
      return [
        'dashboard',
        'assets',
        'hierarchy',
        'tickets',
        'transfers',
        'verification',
        'reports'
      ];

    case 'Viewer':
    default:
      return ['dashboard', 'assets', 'tickets', 'reports'];
  }
}


export function getUserAllowedPages(user?: User | null): NavTab[] {
  if (!user) return ['dashboard'];
  if (user.allowedPages && user.allowedPages.length > 0) {
    return user.allowedPages as NavTab[];
  }
  return getDefaultPagesForRole(user.role);
}
