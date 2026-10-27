import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { dbStore } from "./server/db";
import {
  testMSSQLConnection,
  initializeMSSQLSchema,
  saveAssetToMSSQL,
  deleteAssetFromMSSQL,
  bulkInsertAssetsToMSSQL,
  saveVendorToMSSQL,
  deleteVendorFromMSSQL,
  deleteRepairFromMSSQL,
  deleteAMCFromMSSQL,
  deleteTicketFromMSSQL,
  deleteTransferFromMSSQL,
  saveOrganizationToMSSQL,
  deleteOrganizationFromMSSQL,
  saveCampusToMSSQL,
  deleteCampusFromMSSQL,
  saveBuildingToMSSQL,
  deleteBuildingFromMSSQL,
  saveFloorToMSSQL,
  deleteFloorFromMSSQL,
  saveRoomToMSSQL,
  deleteRoomFromMSSQL,
  saveDepartmentToMSSQL,
  deleteDepartmentFromMSSQL,
  saveCategoryToMSSQL,
  deleteCategoryFromMSSQL,
  saveSubCategoryToMSSQL,
  deleteSubCategoryFromMSSQL,
  syncAllDataToMSSQL,
  loadDataFromMSSQL,
  getMSSQLPublicConfig,
  updateMSSQLConfig,
  purgeAllDataFromMSSQL
} from "./server/mssql";
import { generateTotalSQLBackup } from "./server/backupSql";
import { testMySQLConnection } from "./server/mysql";
import { Asset, Organization, Campus, Building, Floor, Room, Department, AssetCategory, AssetSubCategory, AssetTransfer, PhysicalVerification, RepairRecord, AMCRecord, User, Ticket, DeletedAsset, Vendor } from "./src/types";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Database Connection Status & Multi-Engine Management (MySQL / SQL Server)
  app.get("/api/db/status", async (req, res) => {
    const isMySQL = Boolean(process.env.MYSQL_HOST || process.env.MYSQL_DATABASE);
    if (isMySQL) {
      const mysqlStatus = await testMySQLConnection();
      return res.json({
        engine: "MySQL Server 8.0.45",
        ...mysqlStatus,
        localFileStorage: "eams_data.json"
      });
    }

    const mssqlStatus = await testMSSQLConnection();
    res.json({
      engine: "Microsoft SQL Server",
      ...mssqlStatus,
      localFileStorage: "eams_data.json"
    });
  });

  // Get current SQL Server connection config (without exposing plain password)
  app.get("/api/db/mssql-config", (req, res) => {
    res.json(getMSSQLPublicConfig());
  });

  // Update SQL Server connection config and test
  app.post("/api/db/mssql-config", async (req, res) => {
    const result = await updateMSSQLConfig(req.body);
    res.json(result);
  });

  app.post("/api/db/init-mssql", async (req, res) => {
    const result = await initializeMSSQLSchema();
    res.json(result);
  });

  // Dedicated endpoint to sync all current assets and data into SQL Server immediately
  app.post("/api/db/sync-all", async (req, res) => {
    const data = dbStore.getData();
    const result = await syncAllDataToMSSQL(data);
    res.json(result);
  });

  // SUPER ADMIN FACTORY RESET / PRODUCTION HANDOVER PURGE
  app.post("/api/admin/reset-system", async (req, res) => {
    const role = (req.headers["x-user-role"] as string) || "Super Admin";
    const userName = (req.headers["x-user-name"] as string) || "Super Admin";
    const scope = (req.body?.scope === 'complete' ? 'complete' : 'operational') as 'operational' | 'complete';

    console.log(`⚠️ SUPER ADMIN INITIATED SYSTEM RESET [scope: ${scope}] by user: ${userName} (${role})`);

    // 1. Purge local JSON persistence
    const purgedData = dbStore.purgeData(scope, userName);

    // 2. Purge SQL Server Express database
    let mssqlResult: any = { success: false, message: 'SQL Server was not reached' };
    try {
      mssqlResult = await purgeAllDataFromMSSQL(scope);
    } catch (sqlErr: any) {
      console.error('SQL Server reset error:', sqlErr);
      mssqlResult = { success: false, message: sqlErr?.message || String(sqlErr) };
    }

    res.json({
      success: true,
      message: scope === 'complete'
        ? 'Complete Factory Reset applied. All operational data and dummy infrastructure purged in both project and SQL Server Express.'
        : 'Operational Reset applied. All dummy assets, vendors, repairs, AMCs, tickets, and movement logs purged. System ready for production data starting from #1.',
      scope,
      data: purgedData,
      sqlServerResult: mssqlResult
    });
  });

  // RESTORE DEMO DATA
  app.post("/api/admin/restore-demo-data", (req, res) => {
    const data = dbStore.restoreSeedData();
    res.json({
      success: true,
      message: "Initial demonstration and master reference data successfully restored.",
      data
    });
  });

  // Helper for audit logs
  const logAction = (req: express.Request, action: string, entityType: string, entityId: string, oldVal?: any, newVal?: any) => {
    const userName = (req.headers["x-user-name"] as string) || "System User";
    const userRole = (req.headers["x-user-role"] as string) || "Super Admin";
    const userId = (req.headers["x-user-id"] as string) || "usr-1";
    dbStore.addAuditLog({
      userId,
      userName,
      userRole,
      action,
      entityType,
      entityId,
      oldValue: oldVal ? JSON.stringify(oldVal) : undefined,
      newValue: newVal ? JSON.stringify(newVal) : undefined,
      ipAddress: req.ip || "127.0.0.1",
      browser: req.headers["user-agent"] || "Browser"
    });
  };

  // 1. GET ALL DATA
  app.get("/api/data", (req, res) => {
    res.json(dbStore.getData());
  });

  // 2. ASSET CRUD
  app.post("/api/assets", async (req, res) => {
    const newAsset: Asset = req.body;
    const data = dbStore.getData();
    data.assets.unshift(newAsset);
    dbStore.updateAssets(data.assets);
    logAction(req, "CREATE_ASSET", "Asset", newAsset.id, null, newAsset);

    // Save directly to SQL Server in background / async
    try {
      await saveAssetToMSSQL(newAsset);
    } catch (sqlErr) {
      console.warn('⚠️ SQL Server save error (falling back to JSON store):', sqlErr);
    }

    res.status(201).json({ success: true, asset: newAsset });
  });

  app.put("/api/assets/:id", async (req, res) => {
    const { id } = req.params;
    const updatedAsset: Asset = req.body;
    const data = dbStore.getData();
    const index = data.assets.findIndex(a => a.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Asset not found" });
    }
    const oldAsset = data.assets[index];
    data.assets[index] = updatedAsset;
    dbStore.updateAssets(data.assets);
    logAction(req, "UPDATE_ASSET", "Asset", id, oldAsset, updatedAsset);

    // Update directly in SQL Server
    try {
      await saveAssetToMSSQL(updatedAsset);
    } catch (sqlErr) {
      console.warn('⚠️ SQL Server update error:', sqlErr);
    }

    res.json({ success: true, asset: updatedAsset });
  });

  app.delete("/api/assets/:id", async (req, res) => {
    const { id } = req.params;
    const reason = (req.body && req.body.reason) || req.query.reason || 'Asset Disposed / Removed';
    const data = dbStore.getData();
    const existing = data.assets.find(a => a.id === id);
    if (!existing) {
      return res.status(404).json({ error: "Asset not found" });
    }
    const deletedRecord: DeletedAsset = {
      id: `del-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      assetId: existing.id,
      assetTag: existing.assetTag,
      particulars: existing.particulars,
      organizationId: existing.organizationId,
      campusId: existing.campusId,
      buildingId: existing.buildingId,
      roomId: existing.roomId,
      purchaseDate: existing.purchaseDate,
      purchaseCost: existing.purchaseCost,
      createdDate: existing.createdDate || new Date().toISOString().split('T')[0],
      deletedDate: new Date().toISOString().split('T')[0],
      deletedBy: (req.headers['x-user-name'] as string) || (req.body && req.body.deletedBy) || 'Admin User',
      reason: String(reason),
      assetLocationCode: existing.assetLocationCode
    };

    if (!data.deletedAssets) data.deletedAssets = [];
    data.deletedAssets.unshift(deletedRecord);
    data.assets = data.assets.filter(a => a.id !== id);

    dbStore.updateAssets(data.assets);
    dbStore.updateDeletedAssets(data.deletedAssets);
    logAction(req, "DELETE_ASSET", "Asset", id, existing, deletedRecord);

    // Delete directly in SQL Server
    try {
      await deleteAssetFromMSSQL(id);
    } catch (sqlErr) {
      console.warn('⚠️ SQL Server delete error:', sqlErr);
    }

    res.json({ success: true, deletedRecord });
  });

  app.post("/api/assets/bulk-import", async (req, res) => {
    const newAssets: Asset[] = req.body.assets;
    if (!Array.isArray(newAssets)) {
      return res.status(400).json({ error: "Invalid payload format" });
    }
    const data = dbStore.getData();
    data.assets = [...newAssets, ...data.assets];
    dbStore.updateAssets(data.assets);
    logAction(req, "BULK_IMPORT_ASSETS", "Asset", `BATCH_${Date.now()}`, null, { importedCount: newAssets.length });

    // Bulk save directly to SQL Server
    try {
      await bulkInsertAssetsToMSSQL(newAssets);
    } catch (sqlErr) {
      console.warn('⚠️ SQL Server bulk insert error:', sqlErr);
    }

    res.json({ success: true, count: newAssets.length });
  });

  // 2.5 VENDOR MANAGEMENT CRUD
  app.get("/api/vendors", (req, res) => {
    const data = dbStore.getData();
    res.json(data.vendors || []);
  });

  app.post("/api/vendors", async (req, res) => {
    const newVendor: Vendor = req.body;
    const data = dbStore.getData();
    if (!data.vendors) data.vendors = [];
    
    // Check if ID exists, if so update, else create
    const idx = data.vendors.findIndex(v => v.id === newVendor.id);
    if (idx !== -1) {
      const oldVendor = data.vendors[idx];
      data.vendors[idx] = newVendor;
      dbStore.updateVendors(data.vendors);
      logAction(req, "UPDATE_VENDOR", "Vendor", newVendor.id, oldVendor, newVendor);
      try { await saveVendorToMSSQL(newVendor); } catch {}
      return res.json({ success: true, vendor: newVendor });
    } else {
      data.vendors.unshift(newVendor);
      dbStore.updateVendors(data.vendors);
      logAction(req, "CREATE_VENDOR", "Vendor", newVendor.id, null, newVendor);
      try { await saveVendorToMSSQL(newVendor); } catch {}
      return res.status(201).json({ success: true, vendor: newVendor });
    }
  });

  app.put("/api/vendors/:id", async (req, res) => {
    const { id } = req.params;
    const updatedVendor: Vendor = req.body;
    const data = dbStore.getData();
    if (!data.vendors) data.vendors = [];
    const idx = data.vendors.findIndex(v => v.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    const oldVendor = data.vendors[idx];
    data.vendors[idx] = updatedVendor;
    dbStore.updateVendors(data.vendors);
    logAction(req, "UPDATE_VENDOR", "Vendor", id, oldVendor, updatedVendor);
    try { await saveVendorToMSSQL(updatedVendor); } catch {}
    res.json({ success: true, vendor: updatedVendor });
  });

  app.delete("/api/vendors/:id", async (req, res) => {
    const { id } = req.params;
    const data = dbStore.getData();
    if (!data.vendors) data.vendors = [];
    const existing = data.vendors.find(v => v.id === id);
    if (!existing) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    data.vendors = data.vendors.filter(v => v.id !== id);
    dbStore.updateVendors(data.vendors);
    logAction(req, "DELETE_VENDOR", "Vendor", id, existing, null);

    // Delete directly in SQL Server (checking id, vendor code, and name)
    try {
      await deleteVendorFromMSSQL(id);
      if (existing.code) await deleteVendorFromMSSQL(existing.code);
      if (existing.name) await deleteVendorFromMSSQL(existing.name);
    } catch (sqlErr) {
      console.warn('⚠️ SQL Server vendor delete error:', sqlErr);
    }

    res.json({ success: true });
  });

  // 3. ORGANIZATION CRUD
  app.post("/api/organizations", async (req, res) => {
    const org: Organization = req.body;
    const data = dbStore.getData();
    const idx = data.organizations.findIndex(o => o.id === org.id);
    if (idx !== -1) {
      data.organizations[idx] = org;
      dbStore.updateOrganizations(data.organizations);
      logAction(req, "UPDATE_ORGANIZATION", "Organization", org.id, null, org);
      try { await saveOrganizationToMSSQL(org); } catch {}
      res.json({ success: true, organization: org });
    } else {
      data.organizations.push(org);
      dbStore.updateOrganizations(data.organizations);
      logAction(req, "CREATE_ORGANIZATION", "Organization", org.id, null, org);
      try { await saveOrganizationToMSSQL(org); } catch {}
      res.status(201).json({ success: true, organization: org });
    }
  });

  app.put("/api/organizations/:id", async (req, res) => {
    const { id } = req.params;
    const org: Organization = req.body;
    const data = dbStore.getData();
    const idx = data.organizations.findIndex(o => o.id === id);
    if (idx !== -1) {
      data.organizations[idx] = org;
      dbStore.updateOrganizations(data.organizations);
      logAction(req, "UPDATE_ORGANIZATION", "Organization", id, null, org);
      try { await saveOrganizationToMSSQL(org); } catch {}
      res.json({ success: true, organization: org });
    } else {
      res.status(404).json({ error: "Organization not found" });
    }
  });

  app.delete("/api/organizations/:id", async (req, res) => {
    const { id } = req.params;
    const data = dbStore.getData();
    data.organizations = data.organizations.filter(o => o.id !== id);
    dbStore.updateOrganizations(data.organizations);
    logAction(req, "DELETE_ORGANIZATION", "Organization", id);
    try { await deleteOrganizationFromMSSQL(id); } catch {}
    res.json({ success: true });
  });

  // 4. CAMPUSES / BUILDINGS / FLOORS / ROOMS / DEPTS / CATEGORIES
  app.post("/api/campuses", async (req, res) => {
    const item: Campus = req.body;
    const data = dbStore.getData();
    const idx = data.campuses.findIndex(c => c.id === item.id);
    if (idx !== -1) {
      data.campuses[idx] = item;
    } else {
      data.campuses.push(item);
    }
    dbStore.updateCampuses(data.campuses);
    logAction(req, idx !== -1 ? "UPDATE_CAMPUS" : "CREATE_CAMPUS", "Campus", item.id, null, item);
    try { await saveCampusToMSSQL(item); } catch {}
    res.json({ success: true, item });
  });

  app.delete("/api/campuses/:id", async (req, res) => {
    const { id } = req.params;
    const data = dbStore.getData();
    data.campuses = data.campuses.filter(c => c.id !== id);
    dbStore.updateCampuses(data.campuses);
    logAction(req, "DELETE_CAMPUS", "Campus", id);
    try { await deleteCampusFromMSSQL(id); } catch {}
    res.json({ success: true });
  });

  app.post("/api/buildings", async (req, res) => {
    const item: Building = req.body;
    const data = dbStore.getData();
    const idx = data.buildings.findIndex(b => b.id === item.id);
    if (idx !== -1) {
      data.buildings[idx] = item;
    } else {
      data.buildings.push(item);
    }
    dbStore.updateBuildings(data.buildings);
    logAction(req, idx !== -1 ? "UPDATE_BUILDING" : "CREATE_BUILDING", "Building", item.id, null, item);
    try { await saveBuildingToMSSQL(item); } catch {}
    res.json({ success: true, item });
  });

  app.delete("/api/buildings/:id", async (req, res) => {
    const { id } = req.params;
    const data = dbStore.getData();
    data.buildings = data.buildings.filter(b => b.id !== id);
    dbStore.updateBuildings(data.buildings);
    logAction(req, "DELETE_BUILDING", "Building", id);
    try { await deleteBuildingFromMSSQL(id); } catch {}
    res.json({ success: true });
  });

  app.post("/api/floors", async (req, res) => {
    const item: Floor = req.body;
    const data = dbStore.getData();
    const idx = data.floors.findIndex(f => f.id === item.id);
    if (idx !== -1) {
      data.floors[idx] = item;
    } else {
      data.floors.push(item);
    }
    dbStore.updateFloors(data.floors);
    logAction(req, idx !== -1 ? "UPDATE_FLOOR" : "CREATE_FLOOR", "Floor", item.id, null, item);
    try { await saveFloorToMSSQL(item); } catch {}
    res.json({ success: true, item });
  });

  app.delete("/api/floors/:id", async (req, res) => {
    const { id } = req.params;
    const data = dbStore.getData();
    data.floors = data.floors.filter(f => f.id !== id);
    dbStore.updateFloors(data.floors);
    logAction(req, "DELETE_FLOOR", "Floor", id);
    try { await deleteFloorFromMSSQL(id); } catch {}
    res.json({ success: true });
  });

  app.post("/api/rooms", async (req, res) => {
    const item: Room = req.body;
    const data = dbStore.getData();
    const idx = data.rooms.findIndex(r => r.id === item.id);
    if (idx !== -1) {
      data.rooms[idx] = item;
    } else {
      data.rooms.push(item);
    }
    dbStore.updateRooms(data.rooms);
    logAction(req, idx !== -1 ? "UPDATE_ROOM" : "CREATE_ROOM", "Room", item.id, null, item);
    try {
      const ok = await saveRoomToMSSQL(item);
      if (!ok) console.warn(`⚠️ SQL Server Room [${item.name || item.roomNumber}] was not saved.`);
    } catch (sqlErr) {
      console.error('❌ SQL Server save room error:', sqlErr);
    }
    res.json({ success: true, item });
  });

  app.delete("/api/rooms/:id", async (req, res) => {
    const { id } = req.params;
    const data = dbStore.getData();
    data.rooms = data.rooms.filter(r => r.id !== id);
    dbStore.updateRooms(data.rooms);
    logAction(req, "DELETE_ROOM", "Room", id);
    try { await deleteRoomFromMSSQL(id); } catch {}
    res.json({ success: true });
  });

  app.post("/api/departments", async (req, res) => {
    const item: Department = req.body;
    const data = dbStore.getData();
    const idx = data.departments.findIndex(d => d.id === item.id);
    if (idx !== -1) {
      data.departments[idx] = item;
    } else {
      data.departments.push(item);
    }
    dbStore.updateDepartments(data.departments);
    logAction(req, idx !== -1 ? "UPDATE_DEPARTMENT" : "CREATE_DEPARTMENT", "Department", item.id, null, item);
    try {
      const ok = await saveDepartmentToMSSQL(item);
      if (!ok) console.warn(`⚠️ SQL Server Department [${item.name}] was not saved.`);
    } catch (sqlErr) {
      console.error('❌ SQL Server save department error:', sqlErr);
    }
    res.json({ success: true, item });
  });

  app.delete("/api/departments/:id", async (req, res) => {
    const { id } = req.params;
    const data = dbStore.getData();
    data.departments = data.departments.filter(d => d.id !== id);
    dbStore.updateDepartments(data.departments);
    logAction(req, "DELETE_DEPARTMENT", "Department", id);
    try { await deleteDepartmentFromMSSQL(id); } catch {}
    res.json({ success: true });
  });

  app.post("/api/categories", async (req, res) => {
    const { category, subCategories } = req.body;
    const data = dbStore.getData();
    if (category) {
      const idx = data.categories.findIndex(c => c.id === category.id);
      if (idx !== -1) {
        data.categories[idx] = category;
      } else {
        data.categories.push(category);
      }
      try { await saveCategoryToMSSQL(category); } catch {}
    }
    if (Array.isArray(subCategories)) {
      for (const sub of subCategories) {
        const sIdx = data.subCategories.findIndex(s => s.id === sub.id);
        if (sIdx !== -1) {
          data.subCategories[sIdx] = sub;
        } else {
          data.subCategories.push(sub);
        }
        try { await saveSubCategoryToMSSQL(sub); } catch {}
      }
    }
    dbStore.updateCategories(data.categories, data.subCategories);
    logAction(req, "CREATE_CATEGORY", "Category", category?.id || 'CAT', null, category);
    res.json({ success: true });
  });

  app.delete("/api/categories/:id", async (req, res) => {
    const { id } = req.params;
    const data = dbStore.getData();
    data.categories = data.categories.filter(c => c.id !== id);
    data.subCategories = data.subCategories.filter(s => s.categoryId !== id);
    dbStore.updateCategories(data.categories, data.subCategories);
    logAction(req, "DELETE_CATEGORY", "Category", id);
    try { await deleteCategoryFromMSSQL(id); } catch {}
    res.json({ success: true });
  });

  app.post("/api/subcategories", async (req, res) => {
    const subCategory: AssetSubCategory = req.body;
    const data = dbStore.getData();
    const idx = data.subCategories.findIndex(s => s.id === subCategory.id);
    if (idx !== -1) {
      data.subCategories[idx] = subCategory;
    } else {
      data.subCategories.push(subCategory);
    }
    dbStore.updateCategories(data.categories, data.subCategories);
    logAction(req, "CREATE_SUBCATEGORY", "SubCategory", subCategory.id, null, subCategory);
    try { await saveSubCategoryToMSSQL(subCategory); } catch {}
    res.json({ success: true, item: subCategory });
  });

  app.delete("/api/subcategories/:id", async (req, res) => {
    const { id } = req.params;
    const data = dbStore.getData();
    data.subCategories = data.subCategories.filter(s => s.id !== id);
    dbStore.updateCategories(data.categories, data.subCategories);
    logAction(req, "DELETE_SUBCATEGORY", "SubCategory", id);
    try { await deleteSubCategoryFromMSSQL(id); } catch {}
    res.json({ success: true });
  });

  // 4b. USER MANAGEMENT CRUD
  app.get("/api/users", (req, res) => {
    const data = dbStore.getData();
    res.json(data.users);
  });

  app.post("/api/users", (req, res) => {
    const newUser: User = req.body;
    const data = dbStore.getData();
    data.users.push(newUser);
    dbStore.updateUsers(data.users);
    logAction(req, "CREATE_USER", "User", newUser.id, null, newUser);
    res.status(201).json({ success: true, user: newUser });
  });

  app.put("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const updatedUser: User = req.body;
    const data = dbStore.getData();
    const idx = data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      const oldVal = data.users[idx];
      data.users[idx] = updatedUser;
      dbStore.updateUsers(data.users);
      logAction(req, "UPDATE_USER", "User", id, oldVal, updatedUser);
      res.json({ success: true, user: updatedUser });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });

  app.delete("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const data = dbStore.getData();
    const existing = data.users.find(u => u.id === id);
    if (existing) {
      data.users = data.users.filter(u => u.id !== id);
      dbStore.updateUsers(data.users);
      logAction(req, "DELETE_USER", "User", id, existing, null);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });

  app.post("/api/users/bulk-import", (req, res) => {
    const newUsers: User[] = req.body.users;
    if (!Array.isArray(newUsers)) {
      return res.status(400).json({ error: "Invalid payload format" });
    }
    const data = dbStore.getData();
    data.users = [...newUsers, ...data.users];
    dbStore.updateUsers(data.users);
    logAction(req, "BULK_IMPORT_USERS", "User", `USER_BATCH_${Date.now()}`, null, { importedCount: newUsers.length });
    res.json({ success: true, count: newUsers.length });
  });

  // 4c. TICKETS CRUD
  app.get("/api/tickets", (req, res) => {
    const data = dbStore.getData();
    res.json(data.tickets || []);
  });

  app.post("/api/tickets", (req, res) => {
    const ticket: Ticket = req.body;
    const data = dbStore.getData();
    if (!data.tickets) data.tickets = [];
    const existingIndex = data.tickets.findIndex((t) => t.id === ticket.id);
    if (existingIndex !== -1) {
      data.tickets[existingIndex] = ticket;
    } else {
      data.tickets.unshift(ticket);
    }
    dbStore.updateTickets(data.tickets);
    logAction(req, existingIndex !== -1 ? "UPDATE_TICKET" : "CREATE_TICKET", "Ticket", ticket.id, null, ticket);
    res.status(201).json({ success: true, ticket });
  });

  app.put("/api/tickets/:id", (req, res) => {
    const { id } = req.params;
    const updatedTicket: Ticket = req.body;
    const data = dbStore.getData();
    if (!data.tickets) data.tickets = [];
    const idx = data.tickets.findIndex((t) => t.id === id);
    if (idx !== -1) {
      const oldVal = data.tickets[idx];
      data.tickets[idx] = updatedTicket;
      dbStore.updateTickets(data.tickets);
      logAction(req, "UPDATE_TICKET", "Ticket", id, oldVal, updatedTicket);
      res.json({ success: true, ticket: updatedTicket });
    } else {
      res.status(404).json({ error: "Ticket not found" });
    }
  });

  app.delete("/api/tickets/:id", async (req, res) => {
    const { id } = req.params;
    const data = dbStore.getData();
    if (!data.tickets) data.tickets = [];
    const existing = data.tickets.find((t) => t.id === id);
    if (existing) {
      data.tickets = data.tickets.filter((t) => t.id !== id);
      dbStore.updateTickets(data.tickets);
      logAction(req, "DELETE_TICKET", "Ticket", id, existing, null);

      try {
        await deleteTicketFromMSSQL(id);
      } catch (sqlErr) {
        console.warn('⚠️ SQL Server ticket delete warning:', sqlErr);
      }

      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Ticket not found" });
    }
  });


  // 5. TRANSFERS
  app.post("/api/transfers", (req, res) => {
    const transfer: AssetTransfer = req.body;
    const data = dbStore.getData();
    data.transfers.unshift(transfer);
    dbStore.updateTransfers(data.transfers);
    logAction(req, "REQUEST_ASSET_TRANSFER", "Transfer", transfer.id, null, transfer);
    res.status(201).json({ success: true, transfer });
  });

  app.put("/api/transfers/:id/status", (req, res) => {
    const { id } = req.params;
    const { status, approvedBy, notes } = req.body;
    const data = dbStore.getData();
    const idx = data.transfers.findIndex(t => t.id === id);
    if (idx !== -1) {
      const trf = data.transfers[idx];
      trf.status = status;
      trf.approvedBy = approvedBy;
      trf.approvedDate = new Date().toISOString().split("T")[0];
      trf.notes = notes || trf.notes;

      // If approved, update asset location
      if (status === "Approved" || status === "Completed") {
        const assetIdx = data.assets.findIndex(a => a.id === trf.assetId);
        if (assetIdx !== -1) {
          const ast = data.assets[assetIdx];
          ast.organizationId = trf.toOrganizationId;
          ast.campusId = trf.toCampusId;
          ast.buildingId = trf.toBuildingId;
          ast.roomId = trf.toRoomId;
          ast.assetLocationCode = `${trf.toOrganizationId}-${trf.toCampusId}-${trf.toBuildingId}-${trf.toRoomId}`;
          ast.modifiedBy = approvedBy || "Admin";
          ast.modifiedDate = new Date().toISOString().split("T")[0];
        }
      }

      dbStore.updateTransfers(data.transfers);
      dbStore.updateAssets(data.assets);
      logAction(req, `TRANSFER_${status.toUpperCase()}`, "Transfer", id, null, trf);
      res.json({ success: true, transfer: trf });
    } else {
      res.status(404).json({ error: "Transfer request not found" });
    }
  });

  app.delete("/api/transfers/:id", async (req, res) => {
    const { id } = req.params;
    const data = dbStore.getData();
    data.transfers = data.transfers.filter(t => t.id !== id);
    dbStore.updateTransfers(data.transfers);
    logAction(req, "DELETE_TRANSFER", "Transfer", id);

    try {
      await deleteTransferFromMSSQL(id);
    } catch (sqlErr) {
      console.warn('⚠️ SQL Server transfer delete warning:', sqlErr);
    }

    res.json({ success: true });
  });

  // 6. PHYSICAL VERIFICATION
  app.post("/api/verifications", (req, res) => {
    const ver: PhysicalVerification = req.body;
    const data = dbStore.getData();
    data.verifications.unshift(ver);

    // Update asset condition/status accordingly
    const assetIdx = data.assets.findIndex(a => a.id === ver.assetId);
    if (assetIdx !== -1) {
      const ast = data.assets[assetIdx];
      if (ver.verificationStatus === "Missing") {
        ast.assetStatus = "Missing";
      } else if (ver.verificationStatus === "Damaged") {
        ast.currentCondition = "Damaged";
        ast.assetStatus = "Under Repair";
      } else if (ver.verificationStatus === "Repair Needed") {
        ast.assetStatus = "Under Repair";
      } else if (ver.verificationStatus === "Present") {
        if (ast.assetStatus === "Missing") ast.assetStatus = "Active";
      }
      ast.modifiedBy = ver.verifiedBy;
      ast.modifiedDate = ver.verifiedDate;
    }

    dbStore.updateVerifications(data.verifications);
    dbStore.updateAssets(data.assets);
    logAction(req, "VERIFY_ASSET_PHYSICAL", "Verification", ver.id, null, ver);
    res.status(201).json({ success: true, verification: ver });
  });

  // 7. REPAIRS & AMCs
  app.post("/api/repairs", (req, res) => {
    const rep: RepairRecord = req.body;
    const data = dbStore.getData();
    const idx = data.repairs.findIndex(r => r.id === rep.id);
    if (idx !== -1) {
      data.repairs[idx] = rep;
    } else {
      data.repairs.unshift(rep);
    }

    // Set asset status to Under Repair
    const assetIdx = data.assets.findIndex(a => a.id === rep.assetId);
    if (assetIdx !== -1) {
      const ast = data.assets[assetIdx];
      if (rep.repairStatus === "Repaired") {
        ast.assetStatus = "Active";
        ast.currentCondition = "Good";
      } else if (rep.repairStatus === "In Progress" || rep.repairStatus === "Pending") {
        ast.assetStatus = "Under Repair";
      }
    }

    dbStore.updateRepairs(data.repairs);
    dbStore.updateAssets(data.assets);
    logAction(req, "SAVE_REPAIR_RECORD", "Repair", rep.id, null, rep);
    res.json({ success: true, repair: rep });
  });

  app.delete("/api/repairs/:id", async (req, res) => {
    const { id } = req.params;
    const data = dbStore.getData();
    data.repairs = data.repairs.filter(r => r.id !== id);
    dbStore.updateRepairs(data.repairs);
    logAction(req, "DELETE_REPAIR", "Repair", id);

    // Delete in SQL Server
    try {
      await deleteRepairFromMSSQL(id);
    } catch (sqlErr) {
      console.warn('⚠️ SQL Server repair delete error:', sqlErr);
    }

    res.json({ success: true });
  });

  app.post("/api/amcs", (req, res) => {
    const amc: AMCRecord = req.body;
    const data = dbStore.getData();
    const idx = data.amcs.findIndex(a => a.id === amc.id);
    if (idx !== -1) {
      data.amcs[idx] = amc;
    } else {
      data.amcs.unshift(amc);
    }
    dbStore.updateAMCs(data.amcs);
    logAction(req, "SAVE_AMC_RECORD", "AMC", amc.id, null, amc);
    res.json({ success: true, amc });
  });

  app.delete("/api/amcs/:id", async (req, res) => {
    const { id } = req.params;
    const data = dbStore.getData();
    data.amcs = data.amcs.filter(a => a.id !== id);
    dbStore.updateAMCs(data.amcs);
    logAction(req, "DELETE_AMC", "AMC", id);

    // Delete in SQL Server
    try {
      await deleteAMCFromMSSQL(id);
    } catch (sqlErr) {
      console.warn('⚠️ SQL Server AMC delete error:', sqlErr);
    }

    res.json({ success: true });
  });

  // 8. DATABASE EXPORT SQL (MySQL 8 DDL Script for cPanel/Apache deployment)
  app.get("/api/database/export-sql", (req, res) => {
    const sqlScript = `-- ==============================================================================
-- AMARA RAJA GROUP ENTERPRISE ASSET MANAGEMENT SYSTEM (EAMS) - MYSQL 8 SCHEMA
-- Generated for CPanel / Apache / MySQL Production Deployment
-- Multi-Organization Hierarchy: Org -> Campus -> Building -> Floor -> Room -> Dept -> Asset
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. ORGANIZATIONS MASTER
CREATE TABLE IF NOT EXISTS \`organizations\` (
  \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`short_code\` VARCHAR(20) NOT NULL UNIQUE,
  \`logo\` TEXT DEFAULT NULL,
  \`address\` TEXT NOT NULL,
  \`gst_number\` VARCHAR(50) DEFAULT NULL,
  \`email\` VARCHAR(100) DEFAULT NULL,
  \`phone\` VARCHAR(30) DEFAULT NULL,
  \`status\` ENUM('Active', 'Inactive') DEFAULT 'Active',
  \`created_date\` DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. CAMPUSES MASTER
CREATE TABLE IF NOT EXISTS \`campuses\` (
  \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
  \`organization_id\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`code\` VARCHAR(20) NOT NULL,
  \`address\` TEXT NOT NULL,
  \`city\` VARCHAR(100) NOT NULL,
  \`state\` VARCHAR(100) NOT NULL,
  \`status\` ENUM('Active', 'Inactive') DEFAULT 'Active',
  FOREIGN KEY (\`organization_id\`) REFERENCES \`organizations\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BUILDINGS MASTER
CREATE TABLE IF NOT EXISTS \`buildings\` (
  \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
  \`campus_id\` VARCHAR(64) NOT NULL,
  \`organization_id\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`code\` VARCHAR(20) NOT NULL,
  \`building_type\` VARCHAR(100) DEFAULT 'General',
  \`status\` ENUM('Active', 'Inactive') DEFAULT 'Active',
  FOREIGN KEY (\`campus_id\`) REFERENCES \`campuses\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`organization_id\`) REFERENCES \`organizations\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. FLOORS MASTER
CREATE TABLE IF NOT EXISTS \`floors\` (
  \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
  \`building_id\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(100) NOT NULL,
  \`code\` VARCHAR(20) NOT NULL,
  \`floor_number\` INT NOT NULL DEFAULT 0,
  FOREIGN KEY (\`building_id\`) REFERENCES \`buildings\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. ROOMS MASTER
CREATE TABLE IF NOT EXISTS \`rooms\` (
  \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
  \`floor_id\` VARCHAR(64) NOT NULL,
  \`building_id\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`room_number\` VARCHAR(50) NOT NULL,
  \`room_type\` VARCHAR(100) DEFAULT 'General',
  \`capacity\` INT DEFAULT 0,
  FOREIGN KEY (\`floor_id\`) REFERENCES \`floors\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`building_id\`) REFERENCES \`buildings\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. DEPARTMENTS MASTER
CREATE TABLE IF NOT EXISTS \`departments\` (
  \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
  \`organization_id\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`code\` VARCHAR(20) NOT NULL,
  \`hod_name\` VARCHAR(150) DEFAULT NULL,
  FOREIGN KEY (\`organization_id\`) REFERENCES \`organizations\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. CATEGORIES & SUBCATEGORIES
CREATE TABLE IF NOT EXISTS \`categories\` (
  \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
  \`name\` VARCHAR(150) NOT NULL,
  \`code\` VARCHAR(20) NOT NULL UNIQUE,
  \`description\` TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`subcategories\` (
  \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
  \`category_id\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(150) NOT NULL,
  \`code\` VARCHAR(20) NOT NULL,
  FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. VENDORS & SUPPLIERS MASTER
CREATE TABLE IF NOT EXISTS \`vendors\` (
  \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`code\` VARCHAR(50) NOT NULL UNIQUE,
  \`category\` VARCHAR(100) DEFAULT 'General',
  \`contact_person\` VARCHAR(150) DEFAULT NULL,
  \`email\` VARCHAR(150) DEFAULT NULL,
  \`phone\` VARCHAR(50) DEFAULT NULL,
  \`address\` TEXT DEFAULT NULL,
  \`gst_number\` VARCHAR(50) DEFAULT NULL,
  \`pan_number\` VARCHAR(50) DEFAULT NULL,
  \`rating\` INT DEFAULT 5,
  \`status\` ENUM('Active', 'Inactive', 'Blacklisted') DEFAULT 'Active',
  \`created_date\` DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. ASSETS MASTER TABLE
CREATE TABLE IF NOT EXISTS \`assets\` (
  \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
  \`asset_tag\` VARCHAR(100) NOT NULL UNIQUE,
  \`particulars\` VARCHAR(255) NOT NULL,
  \`description\` TEXT DEFAULT NULL,
  \`asset_location_code\` VARCHAR(150) DEFAULT NULL,
  \`purchase_date\` DATE DEFAULT NULL,
  \`organization_id\` VARCHAR(64) NOT NULL,
  \`campus_id\` VARCHAR(64) NOT NULL,
  \`building_id\` VARCHAR(64) NOT NULL,
  \`floor_id\` VARCHAR(64) NOT NULL,
  \`room_id\` VARCHAR(64) NOT NULL,
  \`department_id\` VARCHAR(64) NOT NULL,
  \`category_id\` VARCHAR(64) NOT NULL,
  \`subcategory_id\` VARCHAR(64) DEFAULT NULL,
  \`vendor_id\` VARCHAR(64) DEFAULT NULL,
  \`division\` VARCHAR(100) DEFAULT NULL,
  \`place_of_asset\` VARCHAR(255) DEFAULT NULL,
  \`reference_prefix\` VARCHAR(20) DEFAULT 'RF',
  \`reference_number\` VARCHAR(100) DEFAULT NULL,
  \`is_bulk_asset\` TINYINT(1) DEFAULT 0,
  \`quantity\` INT DEFAULT 1,
  \`unit_cost\` DECIMAL(15,2) DEFAULT 0.00,
  \`purchase_cost\` DECIMAL(15,2) DEFAULT 0.00,
  \`current_value\` DECIMAL(15,2) DEFAULT 0.00,
  \`depreciation_rate\` DECIMAL(5,2) DEFAULT 0.00,
  \`expected_life_years\` INT DEFAULT 5,
  \`asset_allocation_number\` VARCHAR(100) DEFAULT NULL,
  \`asset_serial_number\` VARCHAR(150) DEFAULT NULL,
  \`rfid_number\` VARCHAR(100) DEFAULT NULL,
  \`manufacturer\` VARCHAR(150) DEFAULT NULL,
  \`model\` VARCHAR(150) DEFAULT NULL,
  \`vendor\` VARCHAR(150) DEFAULT NULL,
  \`invoice_number\` VARCHAR(100) DEFAULT NULL,
  \`warranty_start\` DATE DEFAULT NULL,
  \`warranty_end\` DATE DEFAULT NULL,
  \`amc_vendor\` VARCHAR(150) DEFAULT NULL,
  \`amc_start\` DATE DEFAULT NULL,
  \`amc_end\` DATE DEFAULT NULL,
  \`amc_cost\` DECIMAL(12,2) DEFAULT 0.00,
  \`current_condition\` ENUM('Excellent','Good','Fair','Poor','Damaged') DEFAULT 'Good',
  \`asset_status\` ENUM('Active','In Use','In Store','Under Repair','Disposed','Missing') DEFAULT 'Active',
  \`assigned_employee\` VARCHAR(150) DEFAULT NULL,
  \`asset_photo\` TEXT DEFAULT NULL,
  \`invoice_pdf_url\` TEXT DEFAULT NULL,
  \`manual_pdf_url\` TEXT DEFAULT NULL,
  \`remarks\` TEXT DEFAULT NULL,
  \`latitude\` DECIMAL(10,6) DEFAULT NULL,
  \`longitude\` DECIMAL(10,6) DEFAULT NULL,
  \`created_by\` VARCHAR(100) NOT NULL,
  \`created_date\` DATE NOT NULL,
  \`modified_by\` VARCHAR(100) DEFAULT NULL,
  \`modified_date\` DATE DEFAULT NULL,
  FOREIGN KEY (\`organization_id\`) REFERENCES \`organizations\`(\`id\`),
  FOREIGN KEY (\`campus_id\`) REFERENCES \`campuses\`(\`id\`),
  FOREIGN KEY (\`building_id\`) REFERENCES \`buildings\`(\`id\`),
  FOREIGN KEY (\`floor_id\`) REFERENCES \`floors\`(\`id\`),
  FOREIGN KEY (\`room_id\`) REFERENCES \`rooms\`(\`id\`),
  FOREIGN KEY (\`department_id\`) REFERENCES \`departments\`(\`id\`),
  FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. ASSET MOVEMENT / TRANSFERS
CREATE TABLE IF NOT EXISTS \`asset_transfers\` (
  \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
  \`asset_id\` VARCHAR(64) NOT NULL,
  \`from_organization_id\` VARCHAR(64) NOT NULL,
  \`from_campus_id\` VARCHAR(64) NOT NULL,
  \`from_building_id\` VARCHAR(64) NOT NULL,
  \`from_room_id\` VARCHAR(64) NOT NULL,
  \`to_organization_id\` VARCHAR(64) NOT NULL,
  \`to_campus_id\` VARCHAR(64) NOT NULL,
  \`to_building_id\` VARCHAR(64) NOT NULL,
  \`to_room_id\` VARCHAR(64) NOT NULL,
  \`transfer_reason\` TEXT NOT NULL,
  \`requested_by\` VARCHAR(100) NOT NULL,
  \`requested_date\` DATE NOT NULL,
  \`approved_by\` VARCHAR(100) DEFAULT NULL,
  \`approved_date\` DATE DEFAULT NULL,
  \`status\` ENUM('Pending','Approved','Rejected','Completed') DEFAULT 'Pending',
  \`notes\` TEXT DEFAULT NULL,
  FOREIGN KEY (\`asset_id\`) REFERENCES \`assets\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. PHYSICAL VERIFICATION AUDIT
CREATE TABLE IF NOT EXISTS \`physical_verifications\` (
  \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
  \`asset_id\` VARCHAR(64) NOT NULL,
  \`verified_by\` VARCHAR(100) NOT NULL,
  \`verified_date\` DATETIME NOT NULL,
  \`verification_status\` ENUM('Present','Missing','Damaged','Repair Needed','Disposed') NOT NULL,
  \`location_matched\` TINYINT(1) DEFAULT 1,
  \`actual_room_id\` VARCHAR(64) DEFAULT NULL,
  \`photo_captured\` TEXT DEFAULT NULL,
  \`remarks\` TEXT DEFAULT NULL,
  \`latitude\` DECIMAL(10,6) DEFAULT NULL,
  \`longitude\` DECIMAL(10,6) DEFAULT NULL,
  FOREIGN KEY (\`asset_id\`) REFERENCES \`assets\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. AUDIT TRAIL LOGS
CREATE TABLE IF NOT EXISTS \`audit_logs\` (
  \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
  \`user_id\` VARCHAR(64) NOT NULL,
  \`user_name\` VARCHAR(150) NOT NULL,
  \`user_role\` VARCHAR(50) NOT NULL,
  \`action\` VARCHAR(100) NOT NULL,
  \`entity_type\` VARCHAR(100) NOT NULL,
  \`entity_id\` VARCHAR(64) NOT NULL,
  \`old_value\` JSON DEFAULT NULL,
  \`new_value\` JSON DEFAULT NULL,
  \`ip_address\` VARCHAR(50) DEFAULT NULL,
  \`browser\` VARCHAR(255) DEFAULT NULL,
  \`timestamp\` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
`;

    res.setHeader("Content-Type", "application/sql");
    res.setHeader("Content-Disposition", "attachment; filename=amara_raja_eams_mysql8.sql");
    res.send(sqlScript);
  });

  // 9. SUPER ADMIN TOTAL SQL BACKUP WITH ALL ACTUAL PROJECT DATA ENTRIES
  app.get("/api/admin/export-sql-backup", (req, res) => {
    try {
      const data = dbStore.getData();
      const fullSqlScript = generateTotalSQLBackup(data);
      const dateStr = new Date().toISOString().split("T")[0];
      res.setHeader("Content-Type", "application/sql; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=EAMS_Total_SQL_Backup_${dateStr}.sql`);
      res.send(fullSqlScript);
    } catch (err: any) {
      console.error("SQL Backup generation error:", err);
      res.status(500).json({ error: "Failed to generate SQL backup", details: err?.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Amara Raja EAMS Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
