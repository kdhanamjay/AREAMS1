import React, { useState, useMemo } from 'react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  LifeBuoy,
  Ticket as TicketIcon,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  UserCheck,
  Send,
  Building2,
  MapPin,
  Building,
  Home,
  Box,
  Wrench,
  FileText,
  Printer,
  X,
  MessageSquare,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Trash2,
  Edit,
  User,
  Calendar,
  IndianRupee
} from 'lucide-react';
import {
  Ticket,
  TicketPriority,
  TicketStatus,
  TicketCategory,
  TicketComment,
  Organization,
  Campus,
  Building as BuildingType,
  Room,
  Asset,
  User as UserType
} from '../types';
import { LocationCascadingSelect } from './common/LocationCascadingSelect';
import { SearchableSelect, SelectOption } from './common/SearchableSelect';
import { formatINR } from '../utils/formatters';

interface TicketManagementModuleProps {
  tickets: Ticket[];
  organizations: Organization[];
  campuses: Campus[];
  buildings: BuildingType[];
  rooms: Room[];
  assets: Asset[];
  currentUser: UserType | null;
  onSaveTicket: (ticket: Ticket) => Promise<void>;
  onDeleteTicket: (ticketId: string) => Promise<void>;
}

export const TicketManagementModule: React.FC<TicketManagementModuleProps> = ({
  tickets,
  organizations,
  campuses,
  buildings,
  rooms,
  assets,
  currentUser,
  onSaveTicket,
  onDeleteTicket
}) => {
  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Location Dependent Filter
  const [filterOrgId, setFilterOrgId] = useState('ALL');
  const [filterCampusId, setFilterCampusId] = useState('ALL');
  const [filterBuildingId, setFilterBuildingId] = useState('ALL');
  const [filterRoomId, setFilterRoomId] = useState('ALL');

  // Modals & Active State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPrintWorkOrder, setShowPrintWorkOrder] = useState(false);

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

  // Edit Ticket Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<TicketCategory>('Hardware Failure');
  const [editPriority, setEditPriority] = useState<TicketPriority>('Medium');
  const [editStatus, setEditStatus] = useState<TicketStatus>('Open');
  const [editDescription, setEditDescription] = useState('');
  const [editOrgId, setEditOrgId] = useState('');
  const [editCampusId, setEditCampusId] = useState('');
  const [editBuildingId, setEditBuildingId] = useState('');
  const [editRoomId, setEditRoomId] = useState('');
  const [editAssetId, setEditAssetId] = useState('ALL');
  const [editReporterName, setEditReporterName] = useState('');
  const [editReporterEmail, setEditReporterEmail] = useState('');
  const [editTechName, setEditTechName] = useState('');
  const [editTechPhone, setEditTechPhone] = useState('');

  // New Ticket Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TicketCategory>('Hardware Failure');
  const [newPriority, setNewPriority] = useState<TicketPriority>('Medium');
  const [newDescription, setNewDescription] = useState('');
  
  // Dependent Selection for New Ticket
  const [formOrgId, setFormOrgId] = useState(organizations[0]?.id || 'org-arvd');
  const [formCampusId, setFormCampusId] = useState(campuses[0]?.id || 'cmp-dig');
  const [formBuildingId, setFormBuildingId] = useState(buildings[0]?.id || 'bld-dig-1');
  const [formRoomId, setFormRoomId] = useState(rooms[0]?.id || 'rm-dig-101');
  const [formAssetId, setFormAssetId] = useState('ALL');

  const [reporterName, setReporterName] = useState(currentUser?.name || 'S. Ramakrishna');
  const [reporterEmail, setReporterEmail] = useState(currentUser?.email || 'ramakrishna@amararaja.com');

  // Comment & Resolution State inside Detail Drawer
  const [newCommentText, setNewCommentText] = useState('');
  const [assignedTechName, setAssignedTechName] = useState('');
  const [assignedTechPhone, setTechnicianPhone] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [estimatedRepairCost, setEstimatedCost] = useState<number>(0);

  // SLA Hours matrix based on Priority
  const getSlaHours = (priority: TicketPriority) => {
    switch (priority) {
      case 'Critical': return 4;
      case 'High': return 24;
      case 'Medium': return 48;
      case 'Low': return 72;
    }
  };

  // Helper date adder
  const addHoursToDate = (date: Date, hours: number) => {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result.toISOString().split('T')[0];
  };

  // Categories list
  const categoryOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Complaint Categories' },
    { value: 'Hardware Failure', label: 'Hardware Failure', sublabel: 'PC, Monitor, Switch, NVR, Printer' },
    { value: 'Network/Wifi Issue', label: 'Network/Wifi Issue', sublabel: 'Switch port, Router, LAN drop' },
    { value: 'Electrical/Power', label: 'Electrical/Power', sublabel: 'UPS, Generator, MCB, Wiring' },
    { value: 'HVAC/AC Repair', label: 'HVAC/AC Repair', sublabel: 'Air Conditioning cooling/leakage' },
    { value: 'Furniture Repair', label: 'Furniture Repair', sublabel: 'Desks, Chairs, Cupboards, Locks' },
    { value: 'Plumbing', label: 'Plumbing & Water', sublabel: 'Water Coolers, Taps, Washrooms' },
    { value: 'Civil/Building Maintenance', label: 'Civil/Building Maintenance', sublabel: 'Painting, Tiles, Doors, Roof' },
    { value: 'Software/OS', label: 'Software/OS', sublabel: 'Windows, Operating System, Smart Board App' },
    { value: 'General Complaint', label: 'General Complaint', sublabel: 'Others' }
  ];

  const priorityOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Priorities' },
    { value: 'Critical', label: 'Critical (4h SLA)', sublabel: 'System Down / Safety Emergency' },
    { value: 'High', label: 'High (24h SLA)', sublabel: 'Major operational impact' },
    { value: 'Medium', label: 'Medium (48h SLA)', sublabel: 'Standard ticket' },
    { value: 'Low', label: 'Low (72h SLA)', sublabel: 'Minor request' }
  ];

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Status match
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      // Priority match
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      // Category match
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;

      // Dependent Location Match
      if (filterOrgId !== 'ALL' && t.organizationId !== filterOrgId) return false;
      if (filterCampusId !== 'ALL' && t.campusId !== filterCampusId) return false;
      if (filterBuildingId !== 'ALL' && t.buildingId !== filterBuildingId) return false;
      if (filterRoomId !== 'ALL' && t.roomId !== filterRoomId) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNumber = t.ticketNumber.toLowerCase().includes(q);
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description.toLowerCase().includes(q);
        const matchAsset = t.assetTag ? t.assetTag.toLowerCase().includes(q) : false;
        const matchReporter = t.reportedBy.toLowerCase().includes(q);
        const matchTech = t.assignedTechnician ? t.assignedTechnician.toLowerCase().includes(q) : false;
        if (!matchNumber && !matchTitle && !matchDesc && !matchAsset && !matchReporter && !matchTech) {
          return false;
        }
      }

      return true;
    });
  }, [
    tickets,
    statusFilter,
    priorityFilter,
    categoryFilter,
    filterOrgId,
    filterCampusId,
    filterBuildingId,
    filterRoomId,
    searchQuery
  ]);

  // KPI Calculations
  const openCount = tickets.filter((t) => t.status === 'Open' || t.status === 'Assigned').length;
  const inProgressCount = tickets.filter((t) => t.status === 'In Progress' || t.status === 'Pending Parts').length;
  const criticalCount = tickets.filter((t) => t.priority === 'Critical' && t.status !== 'Resolved' && t.status !== 'Closed').length;
  const resolvedCount = tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length;

  // Handlers
  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const slaHours = getSlaHours(newPriority);
    const targetDate = addHoursToDate(new Date(), slaHours);
    const ticketSeq = String((tickets?.length || 0) + 1).padStart(4, '0');
    const ticketNum = `TKT-${new Date().getFullYear()}-${ticketSeq}`;

    const tiedAsset = assets.find((a) => a.id === formAssetId);

    const ticketObj: Ticket = {
      id: `tkt-${Date.now()}`,
      ticketNumber: ticketNum,
      title: newTitle,
      description: newDescription,
      category: newCategory,
      priority: newPriority,
      status: 'Open',
      organizationId: formOrgId,
      campusId: formCampusId,
      buildingId: formBuildingId,
      roomId: formRoomId !== 'ALL' ? formRoomId : undefined,
      assetId: tiedAsset ? tiedAsset.id : undefined,
      assetTag: tiedAsset ? tiedAsset.assetTag : undefined,
      assetName: tiedAsset ? tiedAsset.particulars : undefined,
      reportedBy: reporterName,
      reportedByEmail: reporterEmail,
      reportedDate: todayStr,
      targetResolutionDate: targetDate,
      comments: [
        {
          id: `cmt-${Date.now()}`,
          authorName: reporterName,
          authorRole: currentUser?.role || 'Campus Admin',
          text: `Complaint ticket logged: ${newTitle}`,
          timestamp: new Date().toLocaleString()
        }
      ]
    };

    await onSaveTicket(ticketObj);
    setShowCreateModal(false);
    // Reset form
    setNewTitle('');
    setNewDescription('');
  };

  const handleUpdateStatus = async (newStatus: TicketStatus) => {
    if (!selectedTicket) return;
    const todayStr = new Date().toISOString().split('T')[0];

    const updatedComments = selectedTicket.comments ? [...selectedTicket.comments] : [];
    updatedComments.push({
      id: `cmt-${Date.now()}`,
      authorName: currentUser?.name || 'Helpdesk Admin',
      authorRole: currentUser?.role || 'Admin',
      text: `Status updated to: ${newStatus}${resolutionNotes ? ` • Notes: ${resolutionNotes}` : ''}`,
      timestamp: new Date().toLocaleString()
    });

    const updatedTicket: Ticket = {
      ...selectedTicket,
      status: newStatus,
      assignedTechnician: assignedTechName || selectedTicket.assignedTechnician,
      technicianPhone: assignedTechPhone || selectedTicket.technicianPhone,
      resolutionNotes: resolutionNotes || selectedTicket.resolutionNotes,
      estimatedCost: estimatedRepairCost || selectedTicket.estimatedCost,
      resolvedDate: newStatus === 'Resolved' || newStatus === 'Closed' ? todayStr : selectedTicket.resolvedDate,
      comments: updatedComments
    };

    await onSaveTicket(updatedTicket);
    setSelectedTicket(updatedTicket);
  };

  const handleAddComment = async () => {
    if (!selectedTicket || !newCommentText.trim()) return;

    const updatedComments = selectedTicket.comments ? [...selectedTicket.comments] : [];
    updatedComments.push({
      id: `cmt-${Date.now()}`,
      authorName: currentUser?.name || 'Support Staff',
      authorRole: currentUser?.role || 'Staff',
      text: newCommentText.trim(),
      timestamp: new Date().toLocaleString()
    });

    const updatedTicket: Ticket = {
      ...selectedTicket,
      comments: updatedComments
    };

    await onSaveTicket(updatedTicket);
    setSelectedTicket(updatedTicket);
    setNewCommentText('');
  };

  const openDetailDrawer = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setAssignedTechName(ticket.assignedTechnician || '');
    setTechnicianPhone(ticket.technicianPhone || '');
    setResolutionNotes(ticket.resolutionNotes || '');
    setEstimatedCost(ticket.estimatedCost || 0);
    setShowDetailModal(true);
  };

  const openEditModal = (t: Ticket) => {
    setEditingTicket(t);
    setEditTitle(t.title);
    setEditCategory(t.category);
    setEditPriority(t.priority);
    setEditStatus(t.status);
    setEditDescription(t.description);
    setEditOrgId(t.organizationId);
    setEditCampusId(t.campusId);
    setEditBuildingId(t.buildingId);
    setEditRoomId(t.roomId || 'ALL');
    setEditAssetId(t.assetId || 'ALL');
    setEditReporterName(t.reportedBy);
    setEditReporterEmail(t.reportedByEmail || '');
    setEditTechName(t.assignedTechnician || '');
    setEditTechPhone(t.technicianPhone || '');
    setShowEditModal(true);
  };

  const handleEditTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket || !editTitle.trim()) return;

    const tiedAsset = assets.find((a) => a.id === editAssetId);

    const updatedTicket: Ticket = {
      ...editingTicket,
      title: editTitle,
      description: editDescription,
      category: editCategory,
      priority: editPriority,
      status: editStatus,
      organizationId: editOrgId,
      campusId: editCampusId,
      buildingId: editBuildingId,
      roomId: editRoomId !== 'ALL' ? editRoomId : undefined,
      assetId: tiedAsset ? tiedAsset.id : undefined,
      assetTag: tiedAsset ? tiedAsset.assetTag : undefined,
      assetName: tiedAsset ? tiedAsset.particulars : undefined,
      reportedBy: editReporterName,
      reportedByEmail: editReporterEmail,
      assignedTechnician: editTechName || undefined,
      technicianPhone: editTechPhone || undefined
    };

    await onSaveTicket(updatedTicket);
    setShowEditModal(false);
    setEditingTicket(null);
    if (selectedTicket && selectedTicket.id === updatedTicket.id) {
      setSelectedTicket(updatedTicket);
    }
  };

  // Helper location resolution
  const getLocationBreadcrumb = (orgId: string, campusId: string, bldId: string, roomId?: string) => {
    const org = organizations.find((o) => o.id === orgId);
    const cmp = campuses.find((c) => c.id === campusId);
    const bld = buildings.find((b) => b.id === bldId);
    const rm = rooms.find((r) => r.id === roomId);

    return {
      orgName: org?.shortCode || 'ARVD',
      campusName: cmp?.name || 'Diguvamagham',
      buildingName: bld?.name || 'High School',
      roomName: rm ? `Room ${rm.roomNumber} (${rm.name})` : 'General Area'
    };
  };

  return (
    <div className="space-y-6">
      
      {/* Banner Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white tracking-tight">Facility & IT Complaint Ticket Management</h1>
                <span className="bg-rose-500/20 text-rose-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-rose-500/30">
                  Live Helpdesk SLA
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Breakdown logs, hardware repairs, electrical & infrastructure complaint SLA tracker across Amara Raja entities
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-xs shadow-lg transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Raise Complaint Ticket</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Complaints</span>
            <TicketIcon className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono mt-1">{tickets.length}</p>
          <span className="text-[10px] text-slate-500 block mt-0.5">All time logged tickets</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Open / Pending</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 font-mono mt-1">{openCount}</p>
          <span className="text-[10px] text-amber-500/80 block mt-0.5">Requires assignment</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">In Repair / Work</span>
            <Wrench className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-400 font-mono mt-1">{inProgressCount}</p>
          <span className="text-[10px] text-blue-500/80 block mt-0.5">Technicians working</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Critical SLA Risks</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400 font-mono mt-1">{criticalCount}</p>
          <span className="text-[10px] text-rose-500/80 block mt-0.5">4-Hour resolution SLA</span>
        </div>

      </div>

      {/* FILTER PANEL with Cascading Dependent Location Filter & Search */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-black uppercase text-white tracking-wider">Filter Complaints by Dependent Location & Attribute</h2>
          </div>

          <button
            onClick={() => {
              setStatusFilter('ALL');
              setPriorityFilter('ALL');
              setCategoryFilter('ALL');
              setFilterOrgId('ALL');
              setFilterCampusId('ALL');
              setFilterBuildingId('ALL');
              setFilterRoomId('ALL');
              setSearchQuery('');
            }}
            className="text-[11px] text-slate-400 hover:text-amber-400 transition-colors font-semibold cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>

        {/* 1. Cascading Location Filter Row */}
        <div>
          <p className="text-[10px] text-amber-400 font-bold uppercase mb-1">Location Scope (Dependent Filter)</p>
          <LocationCascadingSelect
            organizations={organizations}
            campuses={campuses}
            buildings={buildings}
            rooms={rooms}
            selectedOrgId={filterOrgId}
            selectedCampusId={filterCampusId}
            selectedBuildingId={filterBuildingId}
            selectedRoomId={filterRoomId}
            onChangeOrg={setFilterOrgId}
            onChangeCampus={setFilterCampusId}
            onChangeBuilding={setFilterBuildingId}
            onChangeRoom={setFilterRoomId}
            showAllOption={true}
            layout="horizontal"
          />
        </div>

        {/* 2. Status, Priority, Category & Search Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">Search Keywords</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ticket #, Title, Tag, Reporter..."
                className="w-full bg-slate-950 text-slate-100 pl-8 pr-3 py-1.5 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">Complaint Category</label>
            <SearchableSelect
              options={categoryOptions}
              value={categoryFilter}
              onChange={setCategoryFilter}
              placeholder="Select Category..."
              searchPlaceholder="Search category..."
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">Priority SLA Level</label>
            <SearchableSelect
              options={priorityOptions}
              value={priorityFilter}
              onChange={setPriorityFilter}
              placeholder="Select Priority..."
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 px-3 py-2 rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Statuses ({tickets.length})</option>
              <option value="Open">Open ({tickets.filter(t => t.status === 'Open').length})</option>
              <option value="Assigned">Assigned ({tickets.filter(t => t.status === 'Assigned').length})</option>
              <option value="In Progress">In Progress ({tickets.filter(t => t.status === 'In Progress').length})</option>
              <option value="Pending Parts">Pending Parts ({tickets.filter(t => t.status === 'Pending Parts').length})</option>
              <option value="Resolved">Resolved ({tickets.filter(t => t.status === 'Resolved').length})</option>
              <option value="Closed">Closed ({tickets.filter(t => t.status === 'Closed').length})</option>
            </select>
          </div>

        </div>

      </div>

      {/* TICKETS TABLE REGISTER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <TicketIcon className="w-4 h-4 text-amber-400" />
              <span>Complaints Master Register</span>
            </h3>
            <p className="text-slate-400 text-xs">Showing {filteredTickets.length} of {tickets.length} total tickets</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-950/50">
                <th className="py-3 px-3">Ticket # & Priority</th>
                <th className="py-3 px-3">Issue Title & Category</th>
                <th className="py-3 px-3">Location (Org & Campus)</th>
                <th className="py-3 px-3">Tied Asset Tag</th>
                <th className="py-3 px-3">Reported By / Date</th>
                <th className="py-3 px-3">Technician</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTickets.map((t) => {
                const loc = getLocationBreadcrumb(t.organizationId, t.campusId, t.buildingId, t.roomId);

                const priorityBadge =
                  t.priority === 'Critical'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : t.priority === 'High'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : t.priority === 'Medium'
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700';

                const statusBadge =
                  t.status === 'Resolved' || t.status === 'Closed'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : t.status === 'In Progress'
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : t.status === 'Pending Parts'
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30';

                return (
                  <tr key={t.id} className="hover:bg-slate-800/40 text-slate-300 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-mono font-black text-amber-400">{t.ticketNumber}</div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${priorityBadge} inline-block mt-0.5`}>
                        {t.priority} ({getSlaHours(t.priority)}h SLA)
                      </span>
                    </td>

                    <td className="py-3 px-3 max-w-[220px]">
                      <div className="font-bold text-slate-100 truncate">{t.title}</div>
                      <span className="text-[10px] text-slate-400 block truncate">{t.category}</span>
                    </td>

                    <td className="py-3 px-3 max-w-[200px]">
                      <div className="text-slate-200 font-semibold truncate">{loc.campusName} - {loc.buildingName}</div>
                      <span className="text-[10px] text-slate-400 truncate block">{loc.roomName}</span>
                    </td>

                    <td className="py-3 px-3">
                      {t.assetTag ? (
                        <div>
                          <span className="bg-slate-950 font-mono text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-800 block truncate">
                            {t.assetTag}
                          </span>
                          <span className="text-[9px] text-slate-400 truncate block mt-0.5">{t.assetName || 'Asset'}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[10px] italic">General Facility</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-slate-200 font-medium">{t.reportedBy}</div>
                      <span className="text-[10px] text-slate-500 font-mono">{t.reportedDate}</span>
                    </td>

                    <td className="py-3 px-3">
                      {t.assignedTechnician ? (
                        <span className="text-slate-300 font-semibold flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                          {t.assignedTechnician}
                        </span>
                      ) : (
                        <span className="text-amber-500/80 italic text-[11px]">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusBadge}`}>
                        {t.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openDetailDrawer(t)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded-lg shadow cursor-pointer transition-all"
                        >
                          Workflow / View
                        </button>
                        <button
                          onClick={() => openEditModal(t)}
                          className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
                          title="Edit Complaint Ticket"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirm({
                              isOpen: true,
                              title: `Delete Ticket ${t.ticketNumber}`,
                              message: `Are you sure you want to delete ticket ${t.ticketNumber} ("${t.title}")?`,
                              onConfirm: () => onDeleteTicket(t.id)
                            });
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded cursor-pointer"
                          title="Delete Ticket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs italic">
                    No tickets found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE TICKET MODAL WITH DEPENDENT LOCATION SELECTOR */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-5 my-8">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-extrabold text-white">Raise New Complaint / Facility Ticket</h3>
                  <p className="text-slate-400 text-xs">Log issue with dependent location tracking & tied asset tag</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="space-y-4 text-xs">
              
              {/* Issue Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-bold mb-1">Complaint / Issue Title *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="E.g. Cisco Switch Port Failure in Server Room / Projector Lamp Flickering"
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Priority SLA *</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Critical">Critical (4 Hours SLA)</option>
                    <option value="High">High (24 Hours SLA)</option>
                    <option value="Medium">Medium (48 Hours SLA)</option>
                    <option value="Low">Low (72 Hours SLA)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Category *</label>
                <SearchableSelect
                  options={categoryOptions.filter(c => c.value !== 'ALL')}
                  value={newCategory}
                  onChange={(val) => setNewCategory(val as TicketCategory)}
                  placeholder="Select Issue Category..."
                />
              </div>

              {/* DEPENDENT LOCATION SELECTOR (Org -> Campus -> Building -> Room -> Asset) */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <p className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Dependent Location & Tied Equipment Selection</span>
                </p>

                <LocationCascadingSelect
                  organizations={organizations}
                  campuses={campuses}
                  buildings={buildings}
                  rooms={rooms}
                  assets={assets}
                  selectedOrgId={formOrgId}
                  selectedCampusId={formCampusId}
                  selectedBuildingId={formBuildingId}
                  selectedRoomId={formRoomId}
                  selectedAssetId={formAssetId}
                  onChangeOrg={setFormOrgId}
                  onChangeCampus={setFormCampusId}
                  onChangeBuilding={setFormBuildingId}
                  onChangeRoom={setFormRoomId}
                  onChangeAsset={setFormAssetId}
                  showAllOption={false}
                  showAssetSelect={true}
                  layout="stacked"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Detailed Description of Issue *</label>
                <textarea
                  rows={3}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Provide complete breakdown details, symptoms, error codes, or physical damage observed..."
                  className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Reported By Info */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                <div>
                  <label className="block text-slate-400 mb-0.5">Reported By Name</label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="w-full bg-slate-900 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-0.5">Reporter Contact / Email</label>
                  <input
                    type="email"
                    value={reporterEmail}
                    onChange={(e) => setReporterEmail(e.target.value)}
                    className="w-full bg-slate-900 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl shadow-md"
                >
                  Submit Ticket
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* INTERACTIVE DETAIL & WORKFLOW DRAWER / MODAL */}
      {showDetailModal && selectedTicket && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl p-6 shadow-2xl space-y-6 my-8">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-amber-400 font-black text-sm">{selectedTicket.ticketNumber}</span>
                  <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700">
                    {selectedTicket.category}
                  </span>
                  <span className="bg-rose-500/20 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-500/30">
                    {selectedTicket.priority} Priority
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-white mt-1">{selectedTicket.title}</h2>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(selectedTicket)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  title="Edit Ticket Details"
                >
                  <Edit className="w-3.5 h-3.5 text-amber-400" />
                  <span>Edit Ticket</span>
                </button>
                <button
                  onClick={() => setShowPrintWorkOrder(true)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl border border-slate-700 cursor-pointer"
                  title="Print Work Order Sheet"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-white p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Workflow Progress Stepper */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Workflow Progress</p>
              <div className="flex items-center justify-between text-xs">
                {['Open', 'Assigned', 'In Progress', 'Pending Parts', 'Resolved', 'Closed'].map((st, idx) => {
                  const isCurrent = selectedTicket.status === st;
                  return (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(st as TicketStatus)}
                      className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        isCurrent ? 'text-amber-400 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                        isCurrent
                          ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-500/30'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className="text-[10px]">{st}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location & Tied Asset Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-extrabold text-white flex items-center gap-1.5 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" /> Location Details
                </h4>
                {(() => {
                  const loc = getLocationBreadcrumb(
                    selectedTicket.organizationId,
                    selectedTicket.campusId,
                    selectedTicket.buildingId,
                    selectedTicket.roomId
                  );
                  return (
                    <div className="space-y-1 text-slate-300">
                      <p><strong className="text-slate-400">Campus:</strong> {loc.campusName}</p>
                      <p><strong className="text-slate-400">Building:</strong> {loc.buildingName}</p>
                      <p><strong className="text-slate-400">Room:</strong> {loc.roomName}</p>
                    </div>
                  );
                })()}
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-extrabold text-white flex items-center gap-1.5 text-xs">
                  <Box className="w-3.5 h-3.5 text-amber-400" /> Tied Equipment / Asset
                </h4>
                {selectedTicket.assetTag ? (
                  <div className="space-y-1 text-slate-300">
                    <p><strong className="text-slate-400">Tag:</strong> <span className="font-mono text-amber-400 font-bold">{selectedTicket.assetTag}</span></p>
                    <p><strong className="text-slate-400">Asset Name:</strong> {selectedTicket.assetName}</p>
                  </div>
                ) : (
                  <p className="text-slate-500 italic py-2">No individual asset tied. Facility complaint.</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Issue Description</p>
              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
            </div>

            {/* Technician Assignment & Resolution Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Assign Technician Name</label>
                <input
                  type="text"
                  value={assignedTechName}
                  onChange={(e) => setAssignedTechName(e.target.value)}
                  placeholder="E.g. Venkatesh (IT Lead)"
                  className="w-full bg-slate-900 text-slate-100 p-2 rounded-lg border border-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Technician Contact Phone</label>
                <input
                  type="text"
                  value={assignedTechPhone}
                  onChange={(e) => setTechnicianPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-900 text-slate-100 p-2 rounded-lg border border-slate-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-bold mb-1">Resolution / Action Taken Notes</label>
                <input
                  type="text"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe repair fix, replaced parts or vendor service details..."
                  className="w-full bg-slate-900 text-slate-100 p-2 rounded-lg border border-slate-800"
                />
              </div>
            </div>

            {/* Comments & Activity Stream */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-white text-xs flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-amber-400" /> Activity Stream & Updates
              </h4>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-48 overflow-y-auto space-y-2">
                {selectedTicket.comments?.map((c) => (
                  <div key={c.id} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                      <span className="font-bold text-slate-200">{c.authorName} ({c.authorRole})</span>
                      <span className="font-mono">{c.timestamp}</span>
                    </div>
                    <p className="text-slate-300">{c.text}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Post comment or technician update..."
                  className="flex-1 bg-slate-950 text-slate-100 px-3 py-2 rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Post
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleUpdateStatus('Resolved')}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl cursor-pointer"
              >
                Mark Ticket Resolved
              </button>

              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Close Drawer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PRINT WORK ORDER MODAL */}
      {showPrintWorkOrder && selectedTicket && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-xl rounded-2xl p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">AMARA RAJA GROUP</h2>
                <p className="text-xs text-slate-600 font-semibold">Facilities & IT Technical Work Order Sheet</p>
              </div>
              <span className="font-mono font-bold text-amber-600 text-sm">{selectedTicket.ticketNumber}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-500 font-bold">Priority SLA:</p>
                <p className="font-extrabold text-slate-900">{selectedTicket.priority} ({getSlaHours(selectedTicket.priority)}h)</p>
              </div>
              <div>
                <p className="text-slate-500 font-bold">Category:</p>
                <p className="font-semibold text-slate-900">{selectedTicket.category}</p>
              </div>
              <div>
                <p className="text-slate-500 font-bold">Reported Date:</p>
                <p className="font-mono text-slate-900">{selectedTicket.reportedDate}</p>
              </div>
              <div>
                <p className="text-slate-500 font-bold">Reported By:</p>
                <p className="font-semibold text-slate-900">{selectedTicket.reportedBy}</p>
              </div>
            </div>

            <div className="border-t pt-3 space-y-1 text-xs">
              <p className="font-bold text-slate-700">Complaint Title:</p>
              <p className="font-bold text-base text-slate-900">{selectedTicket.title}</p>
              <p className="text-slate-600 mt-2">{selectedTicket.description}</p>
            </div>

            <div className="border-t pt-4 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-500 font-bold">Technician Signature:</p>
                <div className="h-12 border-b border-dashed border-slate-400 mt-2"></div>
              </div>
              <div>
                <p className="text-slate-500 font-bold">Admin Verification:</p>
                <div className="h-12 border-b border-dashed border-slate-400 mt-2"></div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => setShowPrintWorkOrder(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs"
              >
                Print Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TICKET MODAL */}
      {showEditModal && editingTicket && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-5 my-8">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-extrabold text-white">Edit Complaint Ticket #{editingTicket.ticketNumber}</h3>
                  <p className="text-slate-400 text-xs">Update issue title, location, priority SLA, technician or status</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditTicketSubmit} className="space-y-4 text-xs">
              
              {/* Issue Title, Category & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-bold mb-1">Complaint / Issue Title *</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Priority SLA *</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as TicketPriority)}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Critical">Critical (4 Hours SLA)</option>
                    <option value="High">High (24 Hours SLA)</option>
                    <option value="Medium">Medium (48 Hours SLA)</option>
                    <option value="Low">Low (72 Hours SLA)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Category *</label>
                  <SearchableSelect
                    options={categoryOptions.filter(c => c.value !== 'ALL')}
                    value={editCategory}
                    onChange={(val) => setEditCategory(val as TicketCategory)}
                    placeholder="Select Issue Category..."
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Current Status *</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as TicketStatus)}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Open">Open</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending Parts">Pending Parts</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* DEPENDENT LOCATION SELECTOR */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <p className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Dependent Location & Tied Equipment Selection</span>
                </p>

                <LocationCascadingSelect
                  organizations={organizations}
                  campuses={campuses}
                  buildings={buildings}
                  rooms={rooms}
                  assets={assets}
                  selectedOrgId={editOrgId}
                  selectedCampusId={editCampusId}
                  selectedBuildingId={editBuildingId}
                  selectedRoomId={editRoomId}
                  selectedAssetId={editAssetId}
                  onChangeOrg={setEditOrgId}
                  onChangeCampus={setEditCampusId}
                  onChangeBuilding={setEditBuildingId}
                  onChangeRoom={setEditRoomId}
                  onChangeAsset={setEditAssetId}
                  showAllOption={false}
                  showAssetSelect={true}
                  layout="stacked"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Detailed Description *</label>
                <textarea
                  rows={3}
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Reporter & Technician */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                <div>
                  <label className="block text-slate-400 mb-0.5">Reported By Name</label>
                  <input
                    type="text"
                    value={editReporterName}
                    onChange={(e) => setEditReporterName(e.target.value)}
                    className="w-full bg-slate-900 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-0.5">Assigned Technician</label>
                  <input
                    type="text"
                    value={editTechName}
                    onChange={(e) => setEditTechName(e.target.value)}
                    className="w-full bg-slate-900 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800"
                    placeholder="Technician Name"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl shadow-md"
                >
                  Save Changes
                </button>
              </div>

            </form>
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
