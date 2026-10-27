import React, { useState } from 'react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  Building2,
  Building,
  MapPin,
  Layers,
  Home,
  Plus,
  Users,
  CheckCircle2,
  Edit,
  Trash2,
  QrCode,
  FileText,
  Search,
  Upload,
  Download,
  Eye,
  History,
  FileSpreadsheet,
  Grid,
  Maximize2,
  FlaskConical,
  GraduationCap,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Compass,
  Box,
  Wrench,
  X
} from 'lucide-react';
import {
  Organization,
  Campus,
  Building as BuildingType,
  Floor,
  Room,
  Department,
  Block,
  Wing,
  SubRoom,
  Section,
  Lab,
  SpecialLocation,
  LocationDocument,
  LocationHistory,
  Asset
} from '../types';

interface InfrastructureManagementProps {
  organizations: Organization[];
  campuses: Campus[];
  buildings: BuildingType[];
  floors: Floor[];
  rooms: Room[];
  departments: Department[];
  assets: Asset[];
  onSaveOrg: (org: Organization) => Promise<void>;
  onDeleteOrg?: (id: string) => Promise<void>;
  onSaveCampus: (cmp: Campus) => Promise<void>;
  onSaveBuilding: (bld: BuildingType) => Promise<void>;
  onSaveRoom: (rm: Room) => Promise<void>;
  onSaveDepartment: (dept: Department) => Promise<void>;
  onDeleteCampus?: (id: string) => Promise<void>;
  onDeleteBuilding?: (id: string) => Promise<void>;
  onDeleteRoom?: (id: string) => Promise<void>;
  onDeleteDepartment?: (id: string) => Promise<void>;
}

export const InfrastructureManagement: React.FC<InfrastructureManagementProps> = ({
  organizations,
  campuses,
  buildings,
  floors,
  rooms,
  departments,
  assets,
  onSaveOrg,
  onDeleteOrg,
  onSaveCampus,
  onSaveBuilding,
  onSaveRoom,
  onSaveDepartment,
  onDeleteCampus,
  onDeleteBuilding,
  onDeleteRoom,
  onDeleteDepartment
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'hierarchy'
    | 'organizations_tab'
    | 'campuses_blocks'
    | 'buildings_floors'
    | 'departments_wings'
    | 'rooms_labs'
    | 'location_qr'
    | 'documents'
    | 'history'
  >('dashboard');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampusId, setSelectedCampusId] = useState<string>('ALL');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('ALL');

  // Modals state
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [showCampusModal, setShowCampusModal] = useState(false);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedLocationForQr, setSelectedLocationForQr] = useState<{ type: string; id: string; name: string; code: string } | null>(null);

  // Delete Confirmation Modal State
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

  const [newOrg, setNewOrg] = useState<Partial<Organization>>({
    name: '',
    shortCode: '',
    address: '',
    gstNumber: '37AAAAA0000A1Z5',
    email: 'info@amararaja.com',
    phone: '+91 8572 273201',
    status: 'Active'
  });

  // Documents / Blueprints State
  const [documents, setDocuments] = useState<Array<{ id: string; title: string; type: string; location: string; date: string; description?: string }>>([
    { id: 'doc-1', title: 'Main Academic Building Floor Plan', type: 'Blueprint', location: 'Building 1', date: '2024-01-15', description: 'CAD Architectural layout for Ground + 3 Floors' },
    { id: 'doc-2', title: 'Science & Computer Lab Fire Safety Map', type: 'Fire Safety Map', location: 'Lab Block', date: '2024-02-10', description: 'Emergency evacuation routes and extinguisher positions' },
    { id: 'doc-3', title: 'Server Room Electrical Layout', type: 'Electrical Layout', location: 'Admin Block', date: '2024-03-01', description: 'UPS power distribution line and breaker wiring diagram' },
    { id: 'doc-4', title: 'Campus Network Diagram & Fiber Route', type: 'Network Diagram', location: 'Main Campus', date: '2024-03-20', description: 'Underground optical fiber ring and core switch interconnects' }
  ]);
  const [showDocModal, setShowDocModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<{ id?: string; title: string; type: string; location: string; date: string; description?: string } | null>(null);

  // QR Studio Filter State
  const [qrTypeFilter, setQrTypeFilter] = useState<'ALL' | 'Campus' | 'Building' | 'Room'>('ALL');
  const [qrSearch, setQrSearch] = useState('');

  // Form states
  const [modalOrgId, setModalOrgId] = useState<string>('');
  const [modalCampusId, setModalCampusId] = useState<string>('');
  const [modalBuildingId, setModalBuildingId] = useState<string>('');

  const [newCampus, setNewCampus] = useState<Partial<Campus>>({
    name: '',
    code: '',
    campusType: 'School Campus',
    address: '',
    city: 'Chittoor',
    state: 'Andhra Pradesh',
    phone: '+91 8572 273201',
    email: 'campus@amararaja.com',
    status: 'Active'
  });

  const [newBuilding, setNewBuilding] = useState<Partial<BuildingType>>({
    name: '',
    code: '',
    buildingType: 'Academic Building',
    constructionYear: 2020,
    noOfFloors: 3,
    totalRooms: 20,
    status: 'Active'
  });

  const [newRoom, setNewRoom] = useState<Partial<Room>>({
    name: '',
    roomNumber: '101',
    roomCode: 'RM-101',
    roomType: 'Classroom',
    areaSqFt: 500,
    capacity: 40,
    occupancy: 35,
    status: 'Active'
  });

  const [newDepartment, setNewDepartment] = useState<Partial<Department>>({
    name: '',
    code: '',
    hodName: '',
    departmentType: 'Administration',
    status: 'Active'
  });

  // Default Campus Types
  const campusTypes = [
    'School Campus',
    'Hospital Campus',
    'Corporate Campus',
    'Industrial Campus',
    'Warehouse',
    'Office Campus',
    'Medical Campus',
    'Training Centre',
    'Others'
  ];

  // Default Building Types
  const buildingTypes = [
    'Academic Building',
    'Office Building',
    'Hospital',
    'Warehouse',
    'Laboratory',
    'Hostel',
    'Library',
    'Pharmacy',
    'Medical Store',
    'Auditorium',
    'Sports Complex',
    'Factory',
    'Workshop',
    'Security Building',
    'Generator Room',
    'Others'
  ];

  // Default Room Types (40+ types)
  const roomTypes = [
    'Classroom',
    'Smart Classroom',
    'Computer Lab',
    'Physics Lab',
    'Chemistry Lab',
    'Biology Lab',
    'Math Lab',
    'Language Lab',
    'Composite Lab',
    'Library',
    'Principal Room',
    'Vice Principal Room',
    'Coordinator Room',
    'Admin Office',
    'Accounts Office',
    'HR Office',
    'Meeting Room',
    'Conference Room',
    'Server Room',
    'Electrical Room',
    'UPS Room',
    'Generator Room',
    'Network Room',
    'Security Room',
    'Medical Room',
    'Pharmacy',
    'Patient Ward',
    'Operation Theatre',
    'Store Room',
    'Examination Room',
    'Sports Room',
    'Music Room',
    'Art Room',
    'Staff Room',
    'Reception',
    'Waiting Hall',
    'Pantry',
    'Kitchen',
    'Dining Hall',
    'Washroom',
    'Parking',
    'Playground',
    'Auditorium',
    'Seminar Hall',
    'Warehouse',
    'Factory Floor',
    'Workshop',
    'Custom Room'
  ];

  // Handlers
  const openAddOrgModal = () => {
    setEditingOrg(null);
    setNewOrg({
      name: '',
      shortCode: '',
      address: 'Chittoor District, Andhra Pradesh',
      gstNumber: '37AAAAA0000A1Z5',
      email: 'info@amararaja.com',
      phone: '+91 8572 273201',
      status: 'Active'
    });
    setShowOrgModal(true);
  };

  const openEditOrgModal = (org: Organization) => {
    setEditingOrg(org);
    setNewOrg({ ...org });
    setShowOrgModal(true);
  };

  const handleSaveOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrg.name || !newOrg.shortCode) return;
    if (editingOrg) {
      const updatedOrg: Organization = {
        ...editingOrg,
        name: newOrg.name || editingOrg.name,
        shortCode: newOrg.shortCode || editingOrg.shortCode,
        address: newOrg.address || editingOrg.address,
        gstNumber: newOrg.gstNumber || editingOrg.gstNumber,
        email: newOrg.email || editingOrg.email,
        phone: newOrg.phone || editingOrg.phone,
        status: (newOrg.status as 'Active' | 'Inactive') || editingOrg.status
      };
      await onSaveOrg(updatedOrg);
    } else {
      const fullOrg: Organization = {
        ...(newOrg as Organization),
        id: `org-${Date.now()}`,
        createdDate: new Date().toISOString().split('T')[0]
      };
      await onSaveOrg(fullOrg);
    }
    setShowOrgModal(false);
    setEditingOrg(null);
  };

  // Helper openers with reliable pre-selection
  const openAddCampusModal = (defaultOrgId?: string) => {
    const targetOrgId = defaultOrgId || (modalOrgId || organizations[0]?.id || '');
    setModalOrgId(targetOrgId);
    setNewCampus({
      name: '',
      code: '',
      campusType: 'School Campus',
      address: '',
      city: 'Chittoor',
      state: 'Andhra Pradesh',
      phone: '+91 8572 273201',
      email: 'campus@amararaja.com',
      status: 'Active'
    });
    setShowCampusModal(true);
  };

  const openAddBuildingModal = (defaultOrgId?: string, defaultCampusId?: string) => {
    const targetOrgId = defaultOrgId || (modalOrgId || organizations[0]?.id || '');
    setModalOrgId(targetOrgId);
    const matching = campuses.filter(c => !targetOrgId || c.organizationId === targetOrgId);
    const targetCampusId = defaultCampusId || (matching.length > 0 ? matching[0].id : (campuses[0]?.id || ''));
    setModalCampusId(targetCampusId);
    setNewBuilding({
      name: '',
      code: '',
      buildingType: 'Academic Building',
      constructionYear: 2020,
      noOfFloors: 3,
      totalRooms: 20,
      status: 'Active'
    });
    setShowBuildingModal(true);
  };

  const openAddRoomModal = (defaultOrgId?: string, defaultCampusId?: string, defaultBuildingId?: string) => {
    const targetOrgId = defaultOrgId || (modalOrgId || organizations[0]?.id || '');
    setModalOrgId(targetOrgId);
    const matchingCampuses = campuses.filter(c => !targetOrgId || c.organizationId === targetOrgId);
    const targetCampusId = defaultCampusId || (matchingCampuses.length > 0 ? matchingCampuses[0].id : (campuses[0]?.id || ''));
    setModalCampusId(targetCampusId);
    const matchingBuildings = buildings.filter(b => !targetCampusId || b.campusId === targetCampusId);
    const targetBuildingId = defaultBuildingId || (matchingBuildings.length > 0 ? matchingBuildings[0].id : (buildings[0]?.id || ''));
    setModalBuildingId(targetBuildingId);
    setNewRoom({
      name: '',
      roomNumber: '101',
      roomCode: 'RM-101',
      roomType: 'Classroom',
      areaSqFt: 500,
      capacity: 40,
      occupancy: 35,
      status: 'Active'
    });
    setShowRoomModal(true);
  };

  const openAddDepartmentModal = (defaultOrgId?: string) => {
    const targetOrgId = defaultOrgId || (modalOrgId || organizations[0]?.id || '');
    setModalOrgId(targetOrgId);
    setNewDepartment({
      name: '',
      code: '',
      hodName: '',
      departmentType: 'Administration',
      status: 'Active'
    });
    setShowDepartmentModal(true);
  };

  const handleAddCampus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampus.name || !newCampus.code) return;
    const targetOrgId = modalOrgId || organizations[0]?.id || 'org-arvd';
    const isEdit = Boolean(newCampus.id);
    const campusObj: Campus = {
      ...(newCampus as Campus),
      id: newCampus.id || `cmp-${Date.now()}`,
      organizationId: targetOrgId
    };
    await onSaveCampus(campusObj);
    setShowCampusModal(false);
  };

  const handleAddBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuilding.name || !newBuilding.code) return;
    const targetOrgId = modalOrgId || organizations[0]?.id || 'org-arvd';
    const matchingCampuses = campuses.filter(c => c.organizationId === targetOrgId);
    const targetCampusId = modalCampusId || (matchingCampuses.length > 0 ? matchingCampuses[0].id : (campuses[0]?.id || 'cmp-arvd-dig'));
    const isEdit = Boolean(newBuilding.id);
    const buildingObj: BuildingType = {
      ...(newBuilding as BuildingType),
      id: newBuilding.id || `bld-${Date.now()}`,
      campusId: targetCampusId,
      organizationId: targetOrgId
    };
    await onSaveBuilding(buildingObj);
    setShowBuildingModal(false);
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.name || !newRoom.roomNumber) return;
    const targetBuildingId = modalBuildingId || (buildings[0]?.id || 'bld-dig-1');
    const isEdit = Boolean(newRoom.id);
    const roomObj: Room = {
      ...(newRoom as Room),
      id: newRoom.id || `rm-${Date.now()}`,
      buildingId: targetBuildingId,
      floorId: floors[0]?.id || 'flr-1'
    };
    await onSaveRoom(roomObj);
    setShowRoomModal(false);
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepartment.name || !newDepartment.code) return;
    const targetOrgId = modalOrgId || organizations[0]?.id || 'org-arvd';
    const isEdit = Boolean(newDepartment.id);
    const deptObj: Department = {
      ...(newDepartment as Department),
      id: newDepartment.id || `dept-${Date.now()}`,
      organizationId: targetOrgId
    };
    await onSaveDepartment(deptObj);
    setShowDepartmentModal(false);
  };

  const handleOpenQrModal = (type: string, id: string, name: string, code: string) => {
    setSelectedLocationForQr({ type, id, name, code });
    setShowQrModal(true);
  };

  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc || !editingDoc.title.trim()) return;

    if (editingDoc.id) {
      setDocuments(documents.map(d => d.id === editingDoc.id ? (editingDoc as any) : d));
    } else {
      const newDoc = {
        ...editingDoc,
        id: `doc-${Date.now()}`,
        date: editingDoc.date || new Date().toISOString().split('T')[0]
      };
      setDocuments([...documents, newDoc]);
    }
    setShowDocModal(false);
    setEditingDoc(null);
  };

  const handleDeleteDocument = (docId: string) => {
    if (window.confirm('Are you sure you want to delete this blueprint document?')) {
      setDocuments(documents.filter(d => d.id !== docId));
    }
  };

  // Filtered rooms
  const filteredRooms = rooms.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.roomType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBuilding = selectedBuildingId === 'ALL' || r.buildingId === selectedBuildingId;
    return matchesSearch && matchesBuilding;
  });

  return (
    <div className="space-y-6">
      
      {/* Infrastructure Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl font-black text-white tracking-tight">Infrastructure & Location Master System</h1>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Dynamic Location Hierarchy: Organization &rarr; Branch &rarr; Campus &rarr; Block &rarr; Building &rarr; Floor &rarr; Wing &rarr; Dept &rarr; Room &rarr; Asset
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={openAddOrgModal}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs shadow-md cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Organization</span>
          </button>

          <button
            onClick={() => openAddCampusModal()}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3.5 py-2 rounded-xl text-xs cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>Add Campus</span>
          </button>
          
          <button
            onClick={() => openAddBuildingModal()}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3.5 py-2 rounded-xl text-xs cursor-pointer"
          >
            <Building className="w-4 h-4 text-blue-400" />
            <span>Add Building</span>
          </button>

          <button
            onClick={() => openAddRoomModal()}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3.5 py-2 rounded-xl text-xs cursor-pointer"
          >
            <Home className="w-4 h-4 text-emerald-400" />
            <span>Add Room / Lab</span>
          </button>
        </div>
      </div>

      {/* Main Module Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto text-xs scrollbar-none">
        {[
          { id: 'dashboard', label: 'Location Dashboard', icon: Grid },
          { id: 'organizations_tab', label: `Organizations (${organizations.length})`, icon: Building2 },
          { id: 'hierarchy', label: 'Hierarchy Tree', icon: Compass },
          { id: 'campuses_blocks', label: `Campuses (${campuses.length})`, icon: MapPin },
          { id: 'buildings_floors', label: `Buildings (${buildings.length})`, icon: Building },
          { id: 'departments_wings', label: `Departments (${departments.length})`, icon: Users },
          { id: 'rooms_labs', label: `Rooms & Labs (${rooms.length})`, icon: Home },
          { id: 'location_qr', label: 'Location QR Studio', icon: QrCode },
          { id: 'documents', label: 'Blueprints & Documents', icon: FileText },
          { id: 'history', label: 'Audit Trail', icon: History }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: LOCATION DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top Location Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Campuses</span>
              <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">{campuses.length}</span>
              <span className="text-[10px] text-slate-500 block">Active Sites</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Buildings</span>
              <span className="text-2xl font-black text-white font-mono mt-1 block">{buildings.length}</span>
              <span className="text-[10px] text-slate-500 block">Academic & Admin</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Floors Registered</span>
              <span className="text-2xl font-black text-white font-mono mt-1 block">{floors.length || buildings.length * 3}</span>
              <span className="text-[10px] text-slate-500 block">Ground + Upper</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Departments</span>
              <span className="text-2xl font-black text-blue-400 font-mono mt-1 block">{departments.length}</span>
              <span className="text-[10px] text-slate-500 block">Functional Units</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Rooms & Labs</span>
              <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">{rooms.length}</span>
              <span className="text-[10px] text-slate-500 block">Classrooms & STEM</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Room Occupancy %</span>
              <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">88%</span>
              <span className="text-[10px] text-emerald-400 font-semibold block">High Utilization</span>
            </div>
          </div>

          {/* Quick Infrastructure Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campuses.map((cmp) => {
              const campusBlds = buildings.filter((b) => b.campusId === cmp.id);
              const campusAssets = assets.filter((a) => a.campusId === cmp.id);
              const totalVal = campusAssets.reduce((sum, a) => sum + (a.purchaseCost || 0) * (a.quantity || 1), 0);

              return (
                <div key={cmp.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-4 hover:border-slate-700 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded text-[10px] border border-amber-500/20">
                        {cmp.code}
                      </span>
                      <h3 className="text-base font-extrabold text-white mt-1.5">{cmp.name}</h3>
                      <p className="text-slate-400 text-xs mt-0.5">{cmp.address}</p>
                    </div>
                    <button
                      onClick={() => handleOpenQrModal('Campus', cmp.id, cmp.name, cmp.code)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-amber-400 cursor-pointer"
                      title="Generate Campus QR"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Buildings:</span>
                      <span className="font-bold text-slate-200 text-sm">{campusBlds.length}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Assets Tagged:</span>
                      <span className="font-bold text-amber-400 text-sm">{campusAssets.length}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800 text-slate-400">
                    <span>Contact: {cmp.phone || '+91 8572 273201'}</span>
                    <span className="font-mono text-emerald-400 font-extrabold">&#8377;{(totalVal / 100000).toFixed(1)} Lakhs</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: ORGANIZATIONS */}
      {activeTab === 'organizations_tab' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" /> Organization Master Directory
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Manage Enterprise Organizations (ARVD, ARVK, MV, PHC, Corporate, Plant)
              </p>
            </div>
            <button
              onClick={openAddOrgModal}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Organization</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizations.map((org) => {
              const orgCampuses = campuses.filter((c) => c.organizationId === org.id);
              return (
                <div key={org.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                        {org.shortCode}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditOrgModal(org)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                          title="Edit Organization Name & Details"
                        >
                          <Edit className="w-3.5 h-3.5 text-amber-400" />
                          <span>Edit</span>
                        </button>
                        {onDeleteOrg && (
                          <button
                            onClick={() => {
                              setDeleteConfirm({
                                isOpen: true,
                                title: `Delete Organization "${org.name}"`,
                                message: `Are you sure you want to permanently delete organization "${org.name}" (${org.shortCode})? This action will remove the organization master record.`,
                                onConfirm: () => onDeleteOrg(org.id)
                              });
                            }}
                            className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg border border-rose-500/30 cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                            title="Delete Organization"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="font-extrabold text-white text-base mt-3">{org.name}</h3>
                    <p className="text-slate-400 text-xs mt-1">{org.address}</p>

                    <div className="mt-3 text-[11px] text-slate-300 space-y-1 bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono">
                      <p><span className="text-slate-400">GST #:</span> <span className="text-slate-200">{org.gstNumber}</span></p>
                      <p><span className="text-slate-400">Email:</span> <span className="text-amber-300">{org.email}</span></p>
                      <p><span className="text-slate-400">Phone:</span> <span className="text-slate-200">{org.phone}</span></p>
                      <p><span className="text-slate-400">Campuses:</span> <span className="text-emerald-400 font-bold">{orgCampuses.length} Active Sites</span></p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Status</span>
                    <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/20">
                      {org.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: HIERARCHY TREE */}
      {activeTab === 'hierarchy' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-400" /> Interactive Location Hierarchy Tree
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">Drill down through Organizations &rarr; Campuses &rarr; Buildings &rarr; Rooms &rarr; Assets</p>
          </div>

          <div className="space-y-4">
            {organizations.map((org) => (
              <div key={org.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">{org.name} ({org.shortCode})</h3>
                    <p className="text-[11px] text-slate-400">{org.address}</p>
                  </div>
                </div>

                {/* Campuses under Org */}
                <div className="ml-6 border-l-2 border-slate-800 pl-4 space-y-3">
                  {campuses.filter((c) => c.organizationId === org.id || org.id === 'org-arvd').map((cmp) => (
                    <div key={cmp.id} className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-amber-400" />
                          <span className="font-bold text-xs text-slate-200">{cmp.name} ({cmp.code})</span>
                        </div>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                          Campus ID: {cmp.id}
                        </span>
                      </div>

                      {/* Buildings under Campus */}
                      <div className="ml-4 border-l border-slate-800 pl-3 space-y-2">
                        {buildings.filter((b) => b.campusId === cmp.id).map((bld) => (
                          <div key={bld.id} className="bg-slate-950 p-2.5 rounded border border-slate-800/80 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                                <Building className="w-3.5 h-3.5 text-blue-400" /> {bld.name} ({bld.code})
                              </span>
                              <span className="text-[10px] text-amber-400 font-semibold">{bld.buildingType}</span>
                            </div>

                            {/* Rooms under Building */}
                            <div className="ml-3 flex flex-wrap gap-1.5 pt-1">
                              {rooms.filter((r) => r.buildingId === bld.id).map((rm) => (
                                <span
                                  key={rm.id}
                                  onClick={() => handleOpenQrModal('Room', rm.id, rm.name, rm.roomNumber)}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[10px] border border-slate-700/80 cursor-pointer flex items-center gap-1"
                                >
                                  <Home className="w-3 h-3 text-emerald-400" /> Room {rm.roomNumber}: {rm.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CAMPUSES & BLOCKS */}
      {activeTab === 'campuses_blocks' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" /> Campus & Block Master Register
              </h2>
              <p className="text-slate-400 text-xs">Manage School, Hospital, Industrial & Corporate Campuses</p>
            </div>
            <button
              onClick={() => openAddCampusModal()}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Campus
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="py-3 px-3">Campus Name & Code</th>
                  <th className="py-3 px-3">Parent Organization</th>
                  <th className="py-3 px-3">Campus Type</th>
                  <th className="py-3 px-3">Address</th>
                  <th className="py-3 px-3">Contact Email/Phone</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {campuses.map((cmp) => {
                  const parentOrg = organizations.find((o) => o.id === cmp.organizationId);
                  return (
                    <tr key={cmp.id} className="hover:bg-slate-800/40 text-slate-300">
                      <td className="py-3 px-3 font-bold text-slate-200">
                        <div>{cmp.name}</div>
                        <span className="text-[10px] text-amber-400 font-mono">{cmp.code}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-blue-500/10 text-blue-400 font-bold px-2 py-0.5 rounded text-[11px] border border-blue-500/20">
                          {parentOrg ? `${parentOrg.shortCode} - ${parentOrg.name}` : (cmp.organizationId || 'ARVD')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-semibold">{cmp.campusType || 'Academic Campus'}</td>
                      <td className="py-3 px-3 text-slate-400 max-w-[200px] truncate">{cmp.address}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{cmp.phone || '+91 8572 273201'}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded text-[10px] border border-emerald-500/20">
                          {cmp.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenQrModal('Campus', cmp.id, cmp.name, cmp.code)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded cursor-pointer"
                            title="Location QR"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setNewCampus(cmp);
                              setModalOrgId(cmp.organizationId || organizations[0]?.id || '');
                              setShowCampusModal(true);
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
                            title="Edit Campus"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        {onDeleteCampus && (
                          <button
                            onClick={() => {
                              setDeleteConfirm({
                                isOpen: true,
                                title: `Delete Campus "${cmp.name}"`,
                                message: `Are you sure you want to delete campus "${cmp.name}" (${cmp.code})?`,
                                onConfirm: () => onDeleteCampus(cmp.id)
                              });
                            }}
                            className="p-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white rounded cursor-pointer"
                            title="Delete Campus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BUILDINGS & FLOORS */}
      {activeTab === 'buildings_floors' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-400" /> Building & Floor Master Register
              </h2>
              <p className="text-slate-400 text-xs">Academic, Hospital, Hostel, Library & Laboratory Buildings</p>
            </div>
            <button
              onClick={() => openAddBuildingModal()}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Building
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="py-3 px-3">Building Name & Code</th>
                  <th className="py-3 px-3">Parent Organization & Campus</th>
                  <th className="py-3 px-3">Building Type</th>
                  <th className="py-3 px-3 text-center">Floors</th>
                  <th className="py-3 px-3 text-center">Rooms</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {buildings.map((bld) => {
                  const cmp = campuses.find((c) => c.id === bld.campusId);
                  const parentOrg = organizations.find((o) => o.id === bld.organizationId || o.id === cmp?.organizationId);
                  return (
                    <tr key={bld.id} className="hover:bg-slate-800/40 text-slate-300">
                      <td className="py-3 px-3 font-bold text-slate-200">
                        <div>{bld.name}</div>
                        <span className="text-[10px] text-amber-400 font-mono">{bld.code}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <span className="bg-blue-500/10 text-blue-400 font-bold px-2 py-0.5 rounded text-[10px] border border-blue-500/20 block w-fit">
                            {parentOrg ? `${parentOrg.shortCode} - ${parentOrg.name}` : 'ARVD'}
                          </span>
                          <span className="bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded text-[11px] border border-amber-500/20 inline-block">
                            {cmp ? cmp.name : 'Main Campus'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-semibold">{bld.buildingType}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-200">{bld.noOfFloors || 3} Floors</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">{bld.totalRooms || 20} Rooms</td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded text-[10px] border border-emerald-500/20">
                          {bld.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenQrModal('Building', bld.id, bld.name, bld.code)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded cursor-pointer"
                            title="Location QR"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setNewBuilding(bld);
                              setModalOrgId(bld.organizationId || cmp?.organizationId || organizations[0]?.id || '');
                              setModalCampusId(bld.campusId);
                              setShowBuildingModal(true);
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
                            title="Edit Building"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteBuilding && (
                            <button
                              onClick={() => {
                                setDeleteConfirm({
                                  isOpen: true,
                                  title: `Delete Building "${bld.name}"`,
                                  message: `Are you sure you want to delete building "${bld.name}" (${bld.code})?`,
                                  onConfirm: () => onDeleteBuilding(bld.id)
                                });
                              }}
                              className="p-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white rounded cursor-pointer"
                              title="Delete Building"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: DEPARTMENTS & WINGS */}
      {activeTab === 'departments_wings' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" /> Department Master Register
              </h2>
              <p className="text-slate-400 text-xs">Administration, Accounts, IT, Science, Languages & Maintenance</p>
            </div>
            <button
              onClick={() => setShowDepartmentModal(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Department
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {departments.map((dept) => (
              <div key={dept.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="bg-amber-500/10 text-amber-400 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/20">
                      {dept.code}
                    </span>
                    <h3 className="text-sm font-extrabold text-white mt-1">{dept.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setNewDepartment(dept);
                        setShowDepartmentModal(true);
                      }}
                      className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
                      title="Edit Department"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {onDeleteDepartment && (
                      <button
                        onClick={() => {
                          setDeleteConfirm({
                            isOpen: true,
                            title: `Delete Department "${dept.name}"`,
                            message: `Are you sure you want to delete department "${dept.name}" (${dept.code})?`,
                            onConfirm: () => onDeleteDepartment(dept.id)
                          });
                        }}
                        className="p-1 bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white rounded cursor-pointer"
                        title="Delete Department"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-xs text-slate-400 space-y-1 pt-1 border-t border-slate-800">
                  <p><strong className="text-slate-300">HOD Name:</strong> {dept.hodName || 'Dr. S. K. Raman'}</p>
                  <p><strong className="text-slate-300">Type:</strong> {dept.departmentType || 'Core Master'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: ROOMS & LABS */}
      {activeTab === 'rooms_labs' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Home className="w-4 h-4 text-emerald-400" /> Room, Lab & Special Location Master
              </h2>
              <p className="text-slate-400 text-xs">Classrooms, Smart Classrooms, Computer/Science Labs, Server Rooms & Offices</p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search room or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-950 text-slate-200 pl-8 pr-3 py-1.5 rounded-lg text-xs border border-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                onClick={() => setShowRoomModal(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" /> Add Room
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="py-3 px-3">Room Number & Name</th>
                  <th className="py-3 px-3">Parent Building & Campus</th>
                  <th className="py-3 px-3">Room Type</th>
                  <th className="py-3 px-3 text-center">Capacity / Area</th>
                  <th className="py-3 px-3 text-center">QR Tag</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRooms.map((rm) => {
                  const bld = buildings.find((b) => b.id === rm.buildingId);
                  const cmp = bld ? campuses.find((c) => c.id === bld.campusId) : null;
                  return (
                    <tr key={rm.id} className="hover:bg-slate-800/40 text-slate-300">
                      <td className="py-3 px-3 font-bold text-slate-200">
                        <div>Room {rm.roomNumber}: {rm.name}</div>
                        <span className="text-[10px] text-amber-400 font-mono">{rm.roomCode || `RM-${rm.roomNumber}`}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="bg-blue-500/10 text-blue-400 font-bold px-2 py-0.5 rounded text-[11px] border border-blue-500/20">
                            {bld ? bld.name : 'Main Block'}
                          </span>
                          {cmp && (
                            <span className="bg-amber-500/10 text-amber-400 font-semibold px-1.5 py-0.5 rounded text-[10px]">
                              ({cmp.name})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-semibold">{rm.roomType}</td>
                      <td className="py-3 px-3 text-center font-mono text-slate-400">
                        {rm.capacity || 40} Seats / {rm.areaSqFt || 500} sqft
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded text-[10px] border border-emerald-500/20 font-mono">
                          LOCATION-QR-{rm.roomNumber}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenQrModal('Room', rm.id, rm.name, rm.roomNumber)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded cursor-pointer"
                            title="Print Label / QR"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setNewRoom(rm);
                              setModalBuildingId(rm.buildingId);
                              setShowRoomModal(true);
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
                            title="Edit Room"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteRoom && (
                            <button
                              onClick={() => {
                                setDeleteConfirm({
                                  isOpen: true,
                                  title: `Delete Room ${rm.roomNumber}`,
                                  message: `Are you sure you want to delete Room ${rm.roomNumber} (${rm.name})?`,
                                  onConfirm: () => onDeleteRoom(rm.id)
                                });
                              }}
                              className="p-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white rounded cursor-pointer"
                              title="Delete Room"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: LOCATION QR STUDIO */}
      {activeTab === 'location_qr' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-400" /> Location QR & Barcode Label Studio
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">Generate, custom print and batch-export QR labels for Campuses, Buildings & Rooms</p>
            </div>

            {/* Controls & Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter locations..."
                  value={qrSearch}
                  onChange={(e) => setQrSearch(e.target.value)}
                  className="bg-slate-950 text-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 w-44"
                />
              </div>

              <select
                value={qrTypeFilter}
                onChange={(e) => setQrTypeFilter(e.target.value as any)}
                className="bg-slate-950 text-slate-200 text-xs px-3 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Location Types</option>
                <option value="Campus">Campuses Only</option>
                <option value="Building">Buildings Only</option>
                <option value="Room">Rooms & Labs Only</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Campuses */}
            {(qrTypeFilter === 'ALL' || qrTypeFilter === 'Campus') &&
              campuses
                .filter(c => c.name.toLowerCase().includes(qrSearch.toLowerCase()) || c.code.toLowerCase().includes(qrSearch.toLowerCase()))
                .map((cmp) => (
                  <div key={cmp.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-3">
                    <div className="p-3 bg-white rounded-lg inline-block shadow-md">
                      <div className="w-24 h-24 bg-slate-900 p-1.5 flex flex-col justify-between items-center text-amber-400 font-mono text-[8px] font-bold">
                        <div className="w-full flex justify-between">
                          <div className="w-4 h-4 bg-amber-400" />
                          <div className="w-4 h-4 bg-amber-400" />
                        </div>
                        <span className="text-[7px]">CMP-{cmp.code}</span>
                        <div className="w-full flex justify-between">
                          <div className="w-4 h-4 bg-amber-400" />
                          <div className="w-2 h-2 bg-amber-400" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="bg-amber-500/10 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-500/20">Campus</span>
                      <h4 className="text-xs font-bold text-white mt-1">{cmp.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{cmp.code}</p>
                    </div>

                    <button
                      onClick={() => handleOpenQrModal('Campus', cmp.id, cmp.name, cmp.code)}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-1.5 rounded-lg text-xs cursor-pointer shadow"
                    >
                      Print Campus Tag (100x50)
                    </button>
                  </div>
                ))}

            {/* Buildings */}
            {(qrTypeFilter === 'ALL' || qrTypeFilter === 'Building') &&
              buildings
                .filter(b => b.name.toLowerCase().includes(qrSearch.toLowerCase()) || b.code.toLowerCase().includes(qrSearch.toLowerCase()))
                .map((bld) => (
                  <div key={bld.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-3">
                    <div className="p-3 bg-white rounded-lg inline-block shadow-md">
                      <div className="w-24 h-24 bg-slate-900 p-1.5 flex flex-col justify-between items-center text-blue-400 font-mono text-[8px] font-bold">
                        <div className="w-full flex justify-between">
                          <div className="w-4 h-4 bg-blue-400" />
                          <div className="w-4 h-4 bg-blue-400" />
                        </div>
                        <span className="text-[7px]">BLD-{bld.code}</span>
                        <div className="w-full flex justify-between">
                          <div className="w-4 h-4 bg-blue-400" />
                          <div className="w-2 h-2 bg-blue-400" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="bg-blue-500/10 text-blue-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-500/20">Building</span>
                      <h4 className="text-xs font-bold text-white mt-1">{bld.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{bld.code}</p>
                    </div>

                    <button
                      onClick={() => handleOpenQrModal('Building', bld.id, bld.name, bld.code)}
                      className="w-full bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold py-1.5 rounded-lg text-xs cursor-pointer shadow"
                    >
                      Print Building Tag (100x50)
                    </button>
                  </div>
                ))}

            {/* Rooms */}
            {(qrTypeFilter === 'ALL' || qrTypeFilter === 'Room') &&
              rooms
                .filter(r => r.name.toLowerCase().includes(qrSearch.toLowerCase()) || r.roomNumber.toLowerCase().includes(qrSearch.toLowerCase()))
                .map((rm) => (
                  <div key={rm.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-3">
                    <div className="p-3 bg-white rounded-lg inline-block shadow-md">
                      <div className="w-24 h-24 bg-slate-900 p-1.5 flex flex-col justify-between items-center text-emerald-400 font-mono text-[8px] font-bold">
                        <div className="w-full flex justify-between">
                          <div className="w-4 h-4 bg-emerald-400" />
                          <div className="w-4 h-4 bg-emerald-400" />
                        </div>
                        <span className="text-[7px]">RM-{rm.roomNumber}</span>
                        <div className="w-full flex justify-between">
                          <div className="w-4 h-4 bg-emerald-400" />
                          <div className="w-2 h-2 bg-emerald-400" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/20">Room / Lab</span>
                      <h4 className="text-xs font-bold text-white mt-1">Room {rm.roomNumber}: {rm.name}</h4>
                      <p className="text-[10px] text-slate-400">{rm.roomType}</p>
                    </div>

                    <button
                      onClick={() => handleOpenQrModal('Room', rm.id, rm.name, rm.roomNumber)}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-1.5 rounded-lg text-xs cursor-pointer shadow"
                    >
                      Print Room Tag (100x50)
                    </button>
                  </div>
                ))}
          </div>
        </div>
      )}

      {/* TAB 8: BLUEPRINTS & DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" /> Blueprints & Infrastructure Documents
              </h2>
              <p className="text-slate-400 text-xs">Manage CAD Floor Plans, Fire Safety Maps, Electrical Layouts & Network Diagrams</p>
            </div>
            <button
              onClick={() => {
                setEditingDoc({ title: '', type: 'Blueprint', location: 'Main Building', date: new Date().toISOString().split('T')[0], description: '' });
                setShowDocModal(true);
              }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" /> Upload / Register Blueprint
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div key={doc.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 relative group">
                <div className="flex justify-between items-start">
                  <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/20">
                    {doc.type}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500 font-mono mr-1">{doc.date}</span>
                    <button
                      onClick={() => {
                        setEditingDoc(doc);
                        setShowDocModal(true);
                      }}
                      className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
                      title="Edit Document"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-1 bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white rounded cursor-pointer"
                      title="Delete Document"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200">{doc.title}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Location: <span className="text-slate-300 font-semibold">{doc.location}</span></p>
                  {doc.description && (
                    <p className="text-[10px] text-slate-500 mt-1 italic leading-tight">{doc.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 9: AUDIT HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" /> Location Audit Trail & Modification History
            </h2>
            <p className="text-slate-400 text-xs">Immutable history of location creations, renames & transfers</p>
          </div>

          <div className="space-y-2">
            {[
              { action: 'Created Campus', location: 'Amara Raja Vidya Niketan (ARVD)', user: 'Super Admin', date: '2023-01-15' },
              { action: 'Added Building', location: 'Main Academic Building (BLD-1)', user: 'Campus Admin', date: '2023-01-20' },
              { action: 'Configured Room', location: 'Room 101 - Computer Lab', user: 'Campus Admin', date: '2023-02-01' }
            ].map((log, idx) => (
              <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-200">{log.action}: <span className="text-amber-400">{log.location}</span></p>
                  <p className="text-[10px] text-slate-400">By {log.user} on {log.date}</p>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                  Logged
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD CAMPUS */}
      {showCampusModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" /> {newCampus.id ? 'Edit Campus' : 'Add New Campus'}
            </h3>

            <form onSubmit={handleAddCampus} className="space-y-3 text-xs">
              
              {/* Organization Selection for Campus */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5 text-amber-400">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>Belongs to Organization *</span>
                </label>
                <select
                  required
                  value={modalOrgId || (organizations[0]?.id || '')}
                  onChange={(e) => setModalOrgId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white font-bold p-2.5 rounded-lg text-xs focus:ring-1 focus:ring-amber-500"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.shortCode} - {org.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400">
                  Select which organization this campus / institution site belongs to ({organizations.length} available)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Campus Name *</label>
                  <input
                    type="text"
                    required
                    value={newCampus.name}
                    onChange={(e) => setNewCampus({ ...newCampus, name: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-lg border border-slate-800"
                    placeholder="E.g. Main ARVD Campus"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Campus Code *</label>
                  <input
                    type="text"
                    required
                    value={newCampus.code}
                    onChange={(e) => setNewCampus({ ...newCampus, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-lg border border-slate-800 font-mono"
                    placeholder="E.g. CMP-DIG"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Campus Type</label>
                <select
                  value={newCampus.campusType}
                  onChange={(e) => setNewCampus({ ...newCampus, campusType: e.target.value })}
                  className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-lg border border-slate-800"
                >
                  {campusTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Full Address</label>
                <input
                  type="text"
                  value={newCampus.address}
                  onChange={(e) => setNewCampus({ ...newCampus, address: e.target.value })}
                  className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-lg border border-slate-800"
                  placeholder="Street, City, State"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCampusModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer shadow-md"
                >
                  {newCampus.id ? 'Save Campus Changes' : 'Save Campus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD BUILDING */}
      {showBuildingModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-amber-400" /> {newBuilding.id ? 'Edit Building' : 'Add New Building'}
            </h3>

            <form onSubmit={handleAddBuilding} className="space-y-3 text-xs">
              
              {/* Dependent Location Hierarchy Selection for Building */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-amber-400 text-[11px] uppercase tracking-wider">Parent Location Assignment</p>
                  <span className="text-[10px] text-slate-400">Step 1: Org &rarr; Step 2: Campus</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">1. Select Organization *</label>
                    <select
                      value={modalOrgId || (organizations[0]?.id || '')}
                      onChange={(e) => {
                        const newOrgId = e.target.value;
                        setModalOrgId(newOrgId);
                        const matching = campuses.filter(c => c.organizationId === newOrgId);
                        if (matching.length > 0) {
                          setModalCampusId(matching[0].id);
                        } else {
                          setModalCampusId('');
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-white font-semibold p-2.5 rounded-lg"
                    >
                      {organizations.map((o) => (
                        <option key={o.id} value={o.id}>{o.shortCode} - {o.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">2. Select Campus / Site *</label>
                    <select
                      value={modalCampusId}
                      onChange={(e) => setModalCampusId(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-700 text-amber-400 font-bold p-2.5 rounded-lg"
                    >
                      {(() => {
                        const activeOrgId = modalOrgId || organizations[0]?.id;
                        const matchingCampuses = campuses.filter(c => !activeOrgId || c.organizationId === activeOrgId);
                        if (matchingCampuses.length === 0) {
                          return <option value="">-- No Campuses for this Org --</option>;
                        }
                        return matchingCampuses.map((c) => (
                          <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                        ));
                      })()}
                    </select>
                  </div>
                </div>

                {/* Helpful prompt if organization has no campuses yet */}
                {(() => {
                  const activeOrgId = modalOrgId || organizations[0]?.id;
                  const matchingCampuses = campuses.filter(c => !activeOrgId || c.organizationId === activeOrgId);
                  if (matchingCampuses.length === 0) {
                    const currentOrgObj = organizations.find(o => o.id === activeOrgId);
                    return (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
                        <span>Organization <strong>"{currentOrgObj?.shortCode || 'Selected'}"</strong> has no campuses registered yet.</span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowBuildingModal(false);
                            openAddCampusModal(activeOrgId);
                          }}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow cursor-pointer whitespace-nowrap"
                        >
                          + Add Campus to {currentOrgObj?.shortCode || 'Org'} Now
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Building Name *</label>
                  <input
                    type="text"
                    required
                    value={newBuilding.name}
                    onChange={(e) => setNewBuilding({ ...newBuilding, name: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-lg border border-slate-800"
                    placeholder="E.g. Academic Block 1"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Building Code *</label>
                  <input
                    type="text"
                    required
                    value={newBuilding.code}
                    onChange={(e) => setNewBuilding({ ...newBuilding, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-lg border border-slate-800 font-mono"
                    placeholder="E.g. BLD-01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Building Type</label>
                <select
                  value={newBuilding.buildingType}
                  onChange={(e) => setNewBuilding({ ...newBuilding, buildingType: e.target.value })}
                  className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-lg border border-slate-800"
                >
                  {buildingTypes.map((bt) => (
                    <option key={bt} value={bt}>{bt}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBuildingModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer shadow-md"
                >
                  {newBuilding.id ? 'Save Building Changes' : 'Save Building'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD ROOM */}
      {showRoomModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Home className="w-5 h-5 text-emerald-400" /> Add New Room / Lab
            </h3>

            <form onSubmit={handleAddRoom} className="space-y-3 text-xs">
              
              {/* Dependent Location Hierarchy Selection for Room */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <p className="font-bold text-emerald-400 text-[11px] uppercase tracking-wider">Parent Location Assignment (Campus & Building)</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Organization</label>
                    <select
                      value={modalOrgId || (organizations[0]?.id || '')}
                      onChange={(e) => {
                        setModalOrgId(e.target.value);
                        const firstCmp = campuses.find(c => c.organizationId === e.target.value);
                        if (firstCmp) {
                          setModalCampusId(firstCmp.id);
                          const firstBld = buildings.find(b => b.campusId === firstCmp.id);
                          if (firstBld) setModalBuildingId(firstBld.id);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-200 p-2 rounded-lg"
                    >
                      {organizations.map((o) => (
                        <option key={o.id} value={o.id}>{o.shortCode}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Campus *</label>
                    <select
                      value={modalCampusId || (campuses.filter(c => !modalOrgId || c.organizationId === modalOrgId)[0]?.id || '')}
                      onChange={(e) => {
                        setModalCampusId(e.target.value);
                        const firstBld = buildings.find(b => b.campusId === e.target.value);
                        if (firstBld) setModalBuildingId(firstBld.id);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-amber-400 font-semibold p-2 rounded-lg"
                    >
                      {campuses
                        .filter((c) => !modalOrgId || c.organizationId === modalOrgId)
                        .map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Building *</label>
                    <select
                      value={modalBuildingId || (buildings.filter(b => !modalCampusId || b.campusId === modalCampusId)[0]?.id || '')}
                      onChange={(e) => setModalBuildingId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-blue-400 font-bold p-2 rounded-lg"
                    >
                      {buildings
                        .filter((b) => !modalCampusId || b.campusId === modalCampusId)
                        .map((b) => (
                          <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Room Name *</label>
                  <input
                    type="text"
                    required
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-lg border border-slate-800"
                    placeholder="E.g. Computer Science Lab 1"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Room Number *</label>
                  <input
                    type="text"
                    required
                    value={newRoom.roomNumber}
                    onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-lg border border-slate-800 font-mono"
                    placeholder="E.g. 101"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Room Type</label>
                <select
                  value={newRoom.roomType}
                  onChange={(e) => setNewRoom({ ...newRoom, roomType: e.target.value })}
                  className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-lg border border-slate-800"
                >
                  {roomTypes.map((rt) => (
                    <option key={rt} value={rt}>{rt}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
                >
                  Save Room / Lab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD DEPARTMENT */}
      {showDepartmentModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" /> Add New Department
            </h3>

            <form onSubmit={handleAddDepartment} className="space-y-3 text-xs">
              
              {/* Organization Selection for Department */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <label className="block text-slate-300 font-semibold mb-1 text-amber-400">Parent Organization *</label>
                <select
                  required
                  value={modalOrgId || (organizations[0]?.id || '')}
                  onChange={(e) => setModalOrgId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white font-bold p-2.5 rounded-lg text-xs"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.shortCode} - {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Department Name *</label>
                  <input
                    type="text"
                    required
                    value={newDepartment.name}
                    onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-lg border border-slate-800"
                    placeholder="E.g. Computer Science"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Department Code *</label>
                  <input
                    type="text"
                    required
                    value={newDepartment.code}
                    onChange={(e) => setNewDepartment({ ...newDepartment, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-lg border border-slate-800 font-mono"
                    placeholder="E.g. CS"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Head of Department (HOD)</label>
                <input
                  type="text"
                  value={newDepartment.hodName}
                  onChange={(e) => setNewDepartment({ ...newDepartment, hodName: e.target.value })}
                  className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-lg border border-slate-800"
                  placeholder="E.g. Dr. A. K. Sharma"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDepartmentModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOCATION QR DETAILS */}
      {showQrModal && selectedLocationForQr && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <h3 className="text-base font-extrabold text-white flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5 text-amber-400" /> Location QR Tag: {selectedLocationForQr.name}
            </h3>

            <div className="bg-white p-4 rounded-xl inline-block shadow-lg my-2">
              <div className="w-36 h-36 bg-slate-900 p-2 flex flex-col justify-between items-center text-amber-400 font-mono text-[9px] font-bold">
                <div className="w-full flex justify-between">
                  <div className="w-6 h-6 bg-amber-400" />
                  <div className="w-6 h-6 bg-amber-400" />
                </div>
                <div className="text-center">
                  <span className="block text-white text-[10px]">{selectedLocationForQr.type}</span>
                  <span>{selectedLocationForQr.code}</span>
                </div>
                <div className="w-full flex justify-between">
                  <div className="w-6 h-6 bg-amber-400" />
                  <div className="w-3 h-3 bg-amber-400" />
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 font-mono">
              LOCATION-TAG-{selectedLocationForQr.type.toUpperCase()}-{selectedLocationForQr.code}
            </p>

            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setShowQrModal(false)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Tag View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT ORGANIZATION */}
      {showOrgModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <span>{editingOrg ? 'Edit Organization Details' : 'Register New Organization'}</span>
              </h3>
              <button onClick={() => setShowOrgModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOrgSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Organization Full Name *</label>
                <input
                  type="text"
                  required
                  value={newOrg.name || ''}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 font-semibold"
                  placeholder="E.g. Amara Raja Vidyanikethan (ARVD)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Short Code *</label>
                  <input
                    type="text"
                    required
                    value={newOrg.shortCode || ''}
                    onChange={(e) => setNewOrg({ ...newOrg, shortCode: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 font-mono font-bold"
                    placeholder="E.g. ARVD"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">GST Number</label>
                  <input
                    type="text"
                    value={newOrg.gstNumber || ''}
                    onChange={(e) => setNewOrg({ ...newOrg, gstNumber: e.target.value })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 font-mono"
                    placeholder="37AAAAA0000A1Z5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Address *</label>
                <input
                  type="text"
                  required
                  value={newOrg.address || ''}
                  onChange={(e) => setNewOrg({ ...newOrg, address: e.target.value })}
                  className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                  placeholder="Diguvamagham, Chittoor District, AP"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Official Email</label>
                  <input
                    type="email"
                    value={newOrg.email || ''}
                    onChange={(e) => setNewOrg({ ...newOrg, email: e.target.value })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                    placeholder="info.arvd@amararaja.com"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={newOrg.phone || ''}
                    onChange={(e) => setNewOrg({ ...newOrg, phone: e.target.value })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                    placeholder="+91 8572 273201"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Status</label>
                <select
                  value={newOrg.status || 'Active'}
                  onChange={(e) => setNewOrg({ ...newOrg, status: e.target.value as any })}
                  className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 font-bold"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOrgModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl shadow-md cursor-pointer"
                >
                  {editingOrg ? 'Update Organization' : 'Save Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD / EDIT BLUEPRINT DOCUMENT */}
      {showDocModal && editingDoc && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span>{editingDoc.id ? 'Edit Blueprint Document' : 'Upload / Register Blueprint'}</span>
              </h3>
              <button onClick={() => setShowDocModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={editingDoc.title}
                  onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                  className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                  placeholder="E.g. Computer Science Lab Floor Plan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Document Type *</label>
                  <select
                    value={editingDoc.type}
                    onChange={(e) => setEditingDoc({ ...editingDoc, type: e.target.value })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Blueprint">Blueprint (CAD Plan)</option>
                    <option value="Fire Safety Map">Fire Safety Map</option>
                    <option value="Electrical Layout">Electrical Layout</option>
                    <option value="Network Diagram">Network Diagram</option>
                    <option value="HVAC Layout">HVAC Layout</option>
                    <option value="Sanction Plan">Sanction / Government Approval</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={editingDoc.date}
                    onChange={(e) => setEditingDoc({ ...editingDoc, date: e.target.value })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Location / Building *</label>
                <input
                  type="text"
                  required
                  value={editingDoc.location}
                  onChange={(e) => setEditingDoc({ ...editingDoc, location: e.target.value })}
                  className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                  placeholder="E.g. Building 1 / Lab Block"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={editingDoc.description || ''}
                  onChange={(e) => setEditingDoc({ ...editingDoc, description: e.target.value })}
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 resize-none"
                  placeholder="Optional details or technical specs..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl shadow-md"
                >
                  Save Blueprint Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
