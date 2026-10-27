import React, { useMemo } from 'react';
import { SearchableSelect, SelectOption } from './SearchableSelect';
import { Organization, Campus, Building, Room, Asset } from '../../types';
import { Building2, MapPin, Building as BuildingIcon, Home, Box } from 'lucide-react';

interface LocationCascadingSelectProps {
  organizations: Organization[];
  campuses: Campus[];
  buildings: Building[];
  rooms: Room[];
  assets?: Asset[];

  selectedOrgId: string;
  selectedCampusId: string;
  selectedBuildingId: string;
  selectedRoomId: string;
  selectedAssetId?: string;

  onChangeOrg: (orgId: string) => void;
  onChangeCampus: (campusId: string) => void;
  onChangeBuilding: (buildingId: string) => void;
  onChangeRoom: (roomId: string) => void;
  onChangeAsset?: (assetId: string) => void;

  showAllOption?: boolean;
  showAssetSelect?: boolean;
  layout?: 'horizontal' | 'stacked';
  className?: string;
}

export const LocationCascadingSelect: React.FC<LocationCascadingSelectProps> = ({
  organizations,
  campuses,
  buildings,
  rooms,
  assets = [],
  selectedOrgId,
  selectedCampusId,
  selectedBuildingId,
  selectedRoomId,
  selectedAssetId = '',
  onChangeOrg,
  onChangeCampus,
  onChangeBuilding,
  onChangeRoom,
  onChangeAsset,
  showAllOption = true,
  showAssetSelect = false,
  layout = 'stacked',
  className = ''
}) => {

  // 1. Organization Options
  const orgOptions = useMemo<SelectOption[]>(() => {
    const opts: SelectOption[] = [];
    if (showAllOption) {
      opts.push({ value: 'ALL', label: 'All Organizations', sublabel: 'Entire Amara Raja Group' });
    }
    organizations.forEach((o) => {
      opts.push({
        value: o.id,
        label: `${o.shortCode} - ${o.name}`,
        sublabel: o.address
      });
    });
    return opts;
  }, [organizations, showAllOption]);

  // 2. Filtered Campuses based on Selected Org
  const filteredCampuses = useMemo(() => {
    if (!selectedOrgId || selectedOrgId === 'ALL') return campuses;
    return campuses.filter((c) => c.organizationId === selectedOrgId);
  }, [campuses, selectedOrgId]);

  const campusOptions = useMemo<SelectOption[]>(() => {
    const opts: SelectOption[] = [];
    if (showAllOption) {
      opts.push({ value: 'ALL', label: 'All Campuses', sublabel: `${filteredCampuses.length} Campuses Available` });
    }
    filteredCampuses.forEach((c) => {
      opts.push({
        value: c.id,
        label: `${c.name} (${c.code})`,
        sublabel: `${c.city || ''}, ${c.state || ''}`,
        badge: c.code
      });
    });
    return opts;
  }, [filteredCampuses, showAllOption]);

  // 3. Filtered Buildings based on Selected Campus & Org
  const filteredBuildings = useMemo(() => {
    let result = buildings;
    if (selectedOrgId && selectedOrgId !== 'ALL') {
      result = result.filter((b) => b.organizationId === selectedOrgId);
    }
    if (selectedCampusId && selectedCampusId !== 'ALL') {
      result = result.filter((b) => b.campusId === selectedCampusId);
    }
    return result;
  }, [buildings, selectedOrgId, selectedCampusId]);

  const buildingOptions = useMemo<SelectOption[]>(() => {
    const opts: SelectOption[] = [];
    if (showAllOption) {
      opts.push({ value: 'ALL', label: 'All Buildings', sublabel: `${filteredBuildings.length} Buildings` });
    }
    filteredBuildings.forEach((b) => {
      opts.push({
        value: b.id,
        label: `${b.name} (${b.code})`,
        sublabel: `${b.buildingType || 'Academic'} • ${b.noOfFloors || 3} Floors`,
        badge: b.code
      });
    });
    return opts;
  }, [filteredBuildings, showAllOption]);

  // 4. Filtered Rooms based on Selected Building & Campus
  const filteredRooms = useMemo(() => {
    let result = rooms;
    if (selectedBuildingId && selectedBuildingId !== 'ALL') {
      result = result.filter((r) => r.buildingId === selectedBuildingId);
    } else if (selectedCampusId && selectedCampusId !== 'ALL') {
      // Find building IDs in this campus
      const campusBldIds = buildings.filter((b) => b.campusId === selectedCampusId).map((b) => b.id);
      result = result.filter((r) => campusBldIds.includes(r.buildingId));
    }
    return result;
  }, [rooms, buildings, selectedBuildingId, selectedCampusId]);

  const roomOptions = useMemo<SelectOption[]>(() => {
    const opts: SelectOption[] = [];
    if (showAllOption) {
      opts.push({ value: 'ALL', label: 'All Rooms / Labs', sublabel: `${filteredRooms.length} Rooms` });
    }
    filteredRooms.forEach((r) => {
      opts.push({
        value: r.id,
        label: `Room ${r.roomNumber}: ${r.name}`,
        sublabel: `${r.roomType} • Capacity ${r.capacity || 40}`,
        badge: r.roomCode || `RM-${r.roomNumber}`
      });
    });
    return opts;
  }, [filteredRooms, showAllOption]);

  // 5. Filtered Assets based on Selected Room / Building
  const filteredAssets = useMemo(() => {
    if (!showAssetSelect) return [];
    let result = assets;
    if (selectedRoomId && selectedRoomId !== 'ALL') {
      result = result.filter((a) => a.roomId === selectedRoomId);
    } else if (selectedBuildingId && selectedBuildingId !== 'ALL') {
      result = result.filter((a) => a.buildingId === selectedBuildingId);
    } else if (selectedCampusId && selectedCampusId !== 'ALL') {
      result = result.filter((a) => a.campusId === selectedCampusId);
    } else if (selectedOrgId && selectedOrgId !== 'ALL') {
      result = result.filter((a) => a.organizationId === selectedOrgId);
    }
    return result;
  }, [assets, showAssetSelect, selectedRoomId, selectedBuildingId, selectedCampusId, selectedOrgId]);

  const assetOptions = useMemo<SelectOption[]>(() => {
    if (!showAssetSelect) return [];
    const opts: SelectOption[] = [];
    if (showAllOption) {
      opts.push({ value: 'ALL', label: 'All Assets / No Asset Tied', sublabel: `${filteredAssets.length} Assets Available` });
    }
    filteredAssets.forEach((a) => {
      opts.push({
        value: a.id,
        label: `${a.particulars} (${a.assetTag})`,
        sublabel: `${a.description} • S/N: ${a.assetSerialNumber || 'N/A'}`,
        badge: a.assetTag
      });
    });
    return opts;
  }, [filteredAssets, showAssetSelect, showAllOption]);

  // Cascading Handlers
  const handleOrgChange = (orgId: string) => {
    onChangeOrg(orgId);
    onChangeCampus(showAllOption ? 'ALL' : '');
    onChangeBuilding(showAllOption ? 'ALL' : '');
    onChangeRoom(showAllOption ? 'ALL' : '');
    if (onChangeAsset) onChangeAsset(showAllOption ? 'ALL' : '');
  };

  const handleCampusChange = (campusId: string) => {
    onChangeCampus(campusId);
    onChangeBuilding(showAllOption ? 'ALL' : '');
    onChangeRoom(showAllOption ? 'ALL' : '');
    if (onChangeAsset) onChangeAsset(showAllOption ? 'ALL' : '');
  };

  const handleBuildingChange = (buildingId: string) => {
    onChangeBuilding(buildingId);
    onChangeRoom(showAllOption ? 'ALL' : '');
    if (onChangeAsset) onChangeAsset(showAllOption ? 'ALL' : '');
  };

  const handleRoomChange = (roomId: string) => {
    onChangeRoom(roomId);
    if (onChangeAsset) onChangeAsset(showAllOption ? 'ALL' : '');
  };

  const gridColsClass = layout === 'horizontal'
    ? showAssetSelect ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5' : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5'
    : 'grid grid-cols-1 sm:grid-cols-2 gap-3';

  return (
    <div className={`${gridColsClass} ${className}`}>
      {/* 1. Organization Dropdown */}
      <div className="space-y-1">
        <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Organization *</span>
        </label>
        <SearchableSelect
          options={orgOptions}
          value={selectedOrgId}
          onChange={handleOrgChange}
          placeholder="Select Organization..."
          searchPlaceholder="Search org name/code..."
        />
      </div>

      {/* 2. Campus Dropdown (Filtered by Org) */}
      <div className="space-y-1">
        <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>Campus *</span>
        </label>
        <SearchableSelect
          options={campusOptions}
          value={selectedCampusId}
          onChange={handleCampusChange}
          placeholder="Select Campus..."
          searchPlaceholder="Search campus..."
        />
      </div>

      {/* 3. Building Dropdown (Filtered by Campus) */}
      <div className="space-y-1">
        <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
          <BuildingIcon className="w-3.5 h-3.5 text-blue-400" />
          <span>Building / Block *</span>
        </label>
        <SearchableSelect
          options={buildingOptions}
          value={selectedBuildingId}
          onChange={handleBuildingChange}
          placeholder="Select Building..."
          searchPlaceholder="Search building..."
        />
      </div>

      {/* 4. Room / Lab Dropdown (Filtered by Building) */}
      <div className="space-y-1">
        <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
          <Home className="w-3.5 h-3.5 text-emerald-400" />
          <span>Room / Lab *</span>
        </label>
        <SearchableSelect
          options={roomOptions}
          value={selectedRoomId}
          onChange={handleRoomChange}
          placeholder="Select Room..."
          searchPlaceholder="Search room # or name..."
        />
      </div>

      {/* 5. Tied Asset Dropdown (Optional Filtered by Location) */}
      {showAssetSelect && onChangeAsset && (
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
            <Box className="w-3.5 h-3.5 text-amber-400" />
            <span>Tied Equipment / Asset</span>
          </label>
          <SearchableSelect
            options={assetOptions}
            value={selectedAssetId}
            onChange={onChangeAsset}
            placeholder="Select Asset..."
            searchPlaceholder="Search asset tag or serial..."
          />
        </div>
      )}
    </div>
  );
};
