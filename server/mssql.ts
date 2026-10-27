import sql from 'mssql';
import fs from 'fs';
import path from 'path';
import { EAMSData } from './db';

const CONFIG_FILE = path.join(process.cwd(), 'mssql_config.json');

let inMemoryConfig: any = null;
let lastConnectionError: string = '';

export function loadSavedMSSQLConfig(): any {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    // Ignore error
  }
  return null;
}

export function saveMSSQLConfigToFile(newConfig: any) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write mssql_config.json:', e);
  }
}

// Retrieve configuration from memory, file, or environment variables
export function getMSSQLConfig(): sql.config | null {
  if (!inMemoryConfig) {
    inMemoryConfig = loadSavedMSSQLConfig();
  }

  const server = inMemoryConfig?.server || process.env.MSSQL_SERVER || 'localhost';
  const database = inMemoryConfig?.database || process.env.MSSQL_DATABASE || 'EAMS_AssetDB';
  const user = inMemoryConfig?.user || process.env.MSSQL_USER || 'sa';
  const password = inMemoryConfig?.password || process.env.MSSQL_PASSWORD || '';
  const port = inMemoryConfig?.port ? parseInt(String(inMemoryConfig.port), 10) : (process.env.MSSQL_PORT ? parseInt(process.env.MSSQL_PORT, 10) : 1433);
  const encrypt = (inMemoryConfig?.encrypt ?? (process.env.MSSQL_ENCRYPT === 'true')) === true;
  const trustServerCertificate = (inMemoryConfig?.trustServerCertificate ?? (process.env.MSSQL_TRUST_SERVER_CERTIFICATE !== 'false')) !== false;

  if (!password) {
    lastConnectionError = 'Password is not set. Please enter your SQL Server password in the Configuration form or .env file.';
    return null;
  }

  return {
    server,
    database,
    user,
    password,
    port,
    options: {
      encrypt,
      trustServerCertificate,
      enableArithAbort: true,
      connectTimeout: 10000,
      requestTimeout: 15000
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };
}

export function getMSSQLPublicConfig() {
  if (!inMemoryConfig) {
    inMemoryConfig = loadSavedMSSQLConfig();
  }
  const server = inMemoryConfig?.server || process.env.MSSQL_SERVER || 'localhost';
  const database = inMemoryConfig?.database || process.env.MSSQL_DATABASE || 'EAMS_AssetDB';
  const user = inMemoryConfig?.user || process.env.MSSQL_USER || 'sa';
  const port = inMemoryConfig?.port || process.env.MSSQL_PORT || 1433;
  const password = inMemoryConfig?.password || process.env.MSSQL_PASSWORD || '';

  return {
    server,
    database,
    user,
    port,
    hasPassword: Boolean(password)
  };
}

export async function updateMSSQLConfig(newCfg: any) {
  inMemoryConfig = {
    server: newCfg.server || 'localhost',
    database: newCfg.database || 'EAMS_AssetDB',
    user: newCfg.user || 'sa',
    password: newCfg.password || (inMemoryConfig?.password || process.env.MSSQL_PASSWORD || ''),
    port: parseInt(String(newCfg.port || 1433), 10),
    encrypt: false,
    trustServerCertificate: true
  };

  saveMSSQLConfigToFile(inMemoryConfig);

  // Reset pool
  if (poolPromise) {
    try {
      const p = await poolPromise;
      if (p) await p.close();
    } catch {}
    poolPromise = null;
  }

  // Test immediately
  return await testMSSQLConnection();
}

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export async function getMSSQLPool(): Promise<sql.ConnectionPool | null> {
  const config = getMSSQLConfig();
  if (!config) return null;

  if (!poolPromise) {
    poolPromise = sql.connect(config).catch((err) => {
      lastConnectionError = err?.message || String(err);
      console.error('❌ Failed to connect to SQL Server Express:', lastConnectionError);
      poolPromise = null;
      return null as any;
    });
  }

  const pool = await poolPromise;
  if (pool && pool.connected) {
    lastConnectionError = '';
    return pool;
  }
  poolPromise = null;
  return null;
}

export async function testMSSQLConnection(): Promise<{ connected: boolean; message: string; version?: string }> {
  try {
    const config = getMSSQLConfig();
    if (!config) {
      return {
        connected: false,
        message: lastConnectionError || 'SQL Server password is not set. Please click "Configure Connection" below to set your password.'
      };
    }
    const pool = await getMSSQLPool();
    if (!pool) {
      return {
        connected: false,
        message: lastConnectionError ? `Connection failed: ${lastConnectionError}` : 'Could not connect to SQL Server Express (localhost:1433). Please check if SQL Server service is running and TCP/IP is enabled.'
      };
    }
    const result = await pool.request().query('SELECT @@VERSION as version, DB_NAME() as dbName');
    const version = result.recordset[0]?.version || 'SQL Server Express';
    const dbName = result.recordset[0]?.dbName || config.database;
    return {
      connected: true,
      message: `Successfully connected to SQL Server Express database [${dbName}]!`,
      version
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `SQL Server Express Error: ${err?.message || err}`
    };
  }
}

/**
 * Loads all EAMS records from SQL Server Express tables
 */
export async function loadDataFromMSSQL(): Promise<EAMSData | null> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) return null;

    const orgsRes = await pool.request().query('SELECT * FROM dbo.Organizations');
    const campusesRes = await pool.request().query('SELECT * FROM dbo.Campuses');
    const buildingsRes = await pool.request().query('SELECT * FROM dbo.Buildings');
    const floorsRes = await pool.request().query('SELECT * FROM dbo.Floors');
    const roomsRes = await pool.request().query('SELECT * FROM dbo.Rooms');
    const deptsRes = await pool.request().query('SELECT * FROM dbo.Departments');
    let catsRes: any = { recordset: [] };
    try {
      catsRes = await pool.request().query('SELECT * FROM dbo.Categories');
    } catch {
      try {
        catsRes = await pool.request().query('SELECT * FROM dbo.AssetCategories');
      } catch {}
    }

    let subCatsRes: any = { recordset: [] };
    try {
      subCatsRes = await pool.request().query('SELECT * FROM dbo.SubCategories');
    } catch {
      try {
        subCatsRes = await pool.request().query('SELECT * FROM dbo.AssetSubCategories');
      } catch {}
    }
    const assetsRes = await pool.request().query('SELECT * FROM dbo.Assets');
    const delAssetsRes = await pool.request().query('SELECT * FROM dbo.DeletedAssets');
    const transfersRes = await pool.request().query('SELECT * FROM dbo.AssetTransfers');
    const verificationsRes = await pool.request().query('SELECT * FROM dbo.PhysicalVerifications');
    const repairsRes = await pool.request().query('SELECT * FROM dbo.RepairRecords');
    const amcsRes = await pool.request().query('SELECT * FROM dbo.AMCRecords');
    const auditLogsRes = await pool.request().query('SELECT * FROM dbo.AuditLogs');
    const usersRes = await pool.request().query('SELECT * FROM dbo.Users');
    const ticketsRes = await pool.request().query('SELECT * FROM dbo.Tickets');
    let vendorsRes: any = { recordset: [] };
    try {
      vendorsRes = await pool.request().query('SELECT * FROM dbo.Vendors');
    } catch {
      // Table may not exist yet
    }

    // Helper to safely parse JSON columns
    const safeParse = (str: string | null) => {
      if (!str) return undefined;
      try {
        return JSON.parse(str);
      } catch {
        return undefined;
      }
    };

    return {
      organizations: orgsRes.recordset,
      campuses: campusesRes.recordset,
      buildings: buildingsRes.recordset,
      floors: floorsRes.recordset.map((f: any) => ({
        ...f,
        name: f.name || f.floorName || 'Floor',
        floorName: f.floorName || f.name || 'Floor'
      })),
      rooms: roomsRes.recordset.map((r: any) => ({
        ...r,
        name: r.name || r.roomName || (r.roomNumber ? `Room ${r.roomNumber}` : 'Room'),
        roomName: r.roomName || r.name || (r.roomNumber ? `Room ${r.roomNumber}` : 'Room')
      })),
      departments: deptsRes.recordset.map((d: any) => ({
        ...d,
        name: d.name || '',
        code: d.code || '',
        hodName: d.hodName || d.headOfDepartment || '',
        headOfDepartment: d.headOfDepartment || d.hodName || ''
      })),
      categories: catsRes.recordset,
      subCategories: subCatsRes.recordset,
      vendors: vendorsRes.recordset,
      assets: assetsRes.recordset.map((a: any) => ({
        ...a,
        specifications: safeParse(a.specificationsJson)
      })),
      deletedAssets: delAssetsRes.recordset.map((da: any) => ({
        ...da,
        assetData: safeParse(da.assetDataJson)
      })),
      transfers: transfersRes.recordset,
      verifications: verificationsRes.recordset.map((v: any) => ({
        ...v,
        auditDetails: safeParse(v.auditDetailsJson)
      })),
      repairs: repairsRes.recordset,
      amcs: amcsRes.recordset.map((amc: any) => ({
        ...amc,
        assetIds: safeParse(amc.assetIdsJson) || []
      })),
      auditLogs: auditLogsRes.recordset,
      users: usersRes.recordset.map((u: any) => ({
        ...u,
        allowedModules: safeParse(u.allowedModulesJson)
      })),
      tickets: ticketsRes.recordset.map((t: any) => ({
        ...t,
        comments: safeParse(t.commentsJson) || []
      }))
    };
  } catch (err) {
    console.error('Error reading from SQL Server Express:', err);
    return null;
  }
}

/**
 * Initializes database tables if missing in SQL Server Express
 */
export async function initializeMSSQLSchema(): Promise<{ success: boolean; message: string }> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) {
      return { success: false, message: 'SQL Server Express is not connected.' };
    }

    const createScript = `
      IF OBJECT_ID('dbo.Organizations', 'U') IS NULL
      CREATE TABLE dbo.Organizations (
        id NVARCHAR(100) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        shortCode NVARCHAR(50) NOT NULL,
        logo NVARCHAR(MAX) NULL,
        address NVARCHAR(MAX) NULL,
        gstNumber NVARCHAR(100) NULL,
        email NVARCHAR(255) NULL,
        phone NVARCHAR(50) NULL,
        status NVARCHAR(50) DEFAULT 'Active',
        createdDate NVARCHAR(50) NULL
      );

      IF OBJECT_ID('dbo.Campuses', 'U') IS NULL
      CREATE TABLE dbo.Campuses (
        id NVARCHAR(100) PRIMARY KEY,
        organizationId NVARCHAR(100) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        code NVARCHAR(50) NOT NULL,
        address NVARCHAR(MAX) NULL,
        city NVARCHAR(100) NULL,
        state NVARCHAR(100) NULL,
        status NVARCHAR(50) DEFAULT 'Active'
      );

      IF OBJECT_ID('dbo.Buildings', 'U') IS NULL
      CREATE TABLE dbo.Buildings (
        id NVARCHAR(100) PRIMARY KEY,
        campusId NVARCHAR(100) NOT NULL,
        organizationId NVARCHAR(100) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        code NVARCHAR(50) NOT NULL,
        floorsCount INT DEFAULT 1,
        status NVARCHAR(50) DEFAULT 'Active'
      );

      IF OBJECT_ID('dbo.Floors', 'U') IS NULL
      CREATE TABLE dbo.Floors (
        id NVARCHAR(100) PRIMARY KEY,
        buildingId NVARCHAR(100) NOT NULL,
        campusId NVARCHAR(100) NOT NULL,
        organizationId NVARCHAR(100) NOT NULL,
        floorName NVARCHAR(100) NOT NULL,
        floorNumber INT DEFAULT 0
      );

      IF OBJECT_ID('dbo.Rooms', 'U') IS NULL
      CREATE TABLE dbo.Rooms (
        id NVARCHAR(100) PRIMARY KEY,
        floorId NVARCHAR(100) NOT NULL,
        buildingId NVARCHAR(100) NOT NULL,
        campusId NVARCHAR(100) NOT NULL,
        organizationId NVARCHAR(100) NOT NULL,
        roomNumber NVARCHAR(100) NOT NULL,
        roomName NVARCHAR(255) NOT NULL,
        roomType NVARCHAR(100) NULL,
        capacity INT DEFAULT 0,
        status NVARCHAR(50) DEFAULT 'Active'
      );

      IF OBJECT_ID('dbo.Departments', 'U') IS NULL
      CREATE TABLE dbo.Departments (
        id NVARCHAR(100) PRIMARY KEY,
        organizationId NVARCHAR(100) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        code NVARCHAR(50) NOT NULL,
        headOfDepartment NVARCHAR(255) NULL,
        email NVARCHAR(255) NULL,
        phone NVARCHAR(50) NULL
      );

      IF OBJECT_ID('dbo.AssetCategories', 'U') IS NULL
      CREATE TABLE dbo.AssetCategories (
        id NVARCHAR(100) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        code NVARCHAR(50) NOT NULL,
        description NVARCHAR(MAX) NULL,
        icon NVARCHAR(100) NULL
      );

      IF OBJECT_ID('dbo.AssetSubCategories', 'U') IS NULL
      CREATE TABLE dbo.AssetSubCategories (
        id NVARCHAR(100) PRIMARY KEY,
        categoryId NVARCHAR(100) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        code NVARCHAR(50) NOT NULL,
        description NVARCHAR(MAX) NULL
      );

      IF OBJECT_ID('dbo.Vendors', 'U') IS NULL
      CREATE TABLE dbo.Vendors (
        id NVARCHAR(100) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        code NVARCHAR(50) NOT NULL,
        category NVARCHAR(100) NULL,
        contactPerson NVARCHAR(255) NULL,
        email NVARCHAR(255) NULL,
        phone NVARCHAR(50) NULL,
        address NVARCHAR(MAX) NULL,
        gstNumber NVARCHAR(100) NULL,
        panNumber NVARCHAR(100) NULL,
        rating INT DEFAULT 5,
        status NVARCHAR(50) DEFAULT 'Active',
        createdDate NVARCHAR(50) NULL
      );

      IF OBJECT_ID('dbo.Assets', 'U') IS NULL
      CREATE TABLE dbo.Assets (
        id NVARCHAR(100) PRIMARY KEY,
        assetTag NVARCHAR(100) NOT NULL,
        serialNumber NVARCHAR(100) NULL,
        name NVARCHAR(255) NOT NULL,
        particulars NVARCHAR(255) NULL,
        organizationId NVARCHAR(100) NOT NULL,
        campusId NVARCHAR(100) NOT NULL,
        campusName NVARCHAR(255) NULL,
        buildingId NVARCHAR(100) NOT NULL,
        floorId NVARCHAR(100) NOT NULL,
        roomId NVARCHAR(100) NOT NULL,
        departmentId NVARCHAR(100) NOT NULL,
        categoryId NVARCHAR(100) NOT NULL,
        category NVARCHAR(255) NULL,
        subCategoryId NVARCHAR(100) NOT NULL,
        vendorId NVARCHAR(100) NULL,
        referencePrefix NVARCHAR(20) DEFAULT 'RF',
        referenceNumber NVARCHAR(100) NULL,
        isBulkAsset BIT DEFAULT 0,
        quantity INT DEFAULT 1,
        unitCost DECIMAL(18,2) DEFAULT 0.00,
        model NVARCHAR(255) NULL,
        brand NVARCHAR(255) NULL,
        purchaseDate NVARCHAR(50) NULL,
        purchaseCost DECIMAL(18,2) DEFAULT 0.00,
        vendorName NVARCHAR(255) NULL,
        warrantyExpiry NVARCHAR(50) NULL,
        amcExpiry NVARCHAR(50) NULL,
        status NVARCHAR(50) DEFAULT 'In Use',
        assetStatus NVARCHAR(50) DEFAULT 'In Use',
        condition NVARCHAR(50) DEFAULT 'Good',
        assignedTo NVARCHAR(255) NULL,
        assignedEmail NVARCHAR(255) NULL,
        qrCodeUrl NVARCHAR(MAX) NULL,
        barcodeUrl NVARCHAR(MAX) NULL,
        specificationsJson NVARCHAR(MAX) NULL,
        notes NVARCHAR(MAX) NULL,
        lastVerifiedDate NVARCHAR(50) NULL,
        lastVerifiedBy NVARCHAR(255) NULL,
        createdDate NVARCHAR(50) NULL,
        lastUpdated NVARCHAR(50) NULL
      );

      IF OBJECT_ID('dbo.DeletedAssets', 'U') IS NULL
      CREATE TABLE dbo.DeletedAssets (
        id NVARCHAR(100) PRIMARY KEY,
        assetTag NVARCHAR(100) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        organizationId NVARCHAR(100) NOT NULL,
        campusId NVARCHAR(100) NOT NULL,
        buildingId NVARCHAR(100) NOT NULL,
        roomId NVARCHAR(100) NOT NULL,
        departmentId NVARCHAR(100) NOT NULL,
        categoryId NVARCHAR(100) NOT NULL,
        subCategoryId NVARCHAR(100) NOT NULL,
        deletedBy NVARCHAR(255) NULL,
        deletedByEmail NVARCHAR(255) NULL,
        deletedDate NVARCHAR(50) NULL,
        reason NVARCHAR(MAX) NULL,
        assetDataJson NVARCHAR(MAX) NULL
      );

      IF OBJECT_ID('dbo.AssetTransfers', 'U') IS NULL
      CREATE TABLE dbo.AssetTransfers (
        id NVARCHAR(100) PRIMARY KEY,
        assetId NVARCHAR(100) NOT NULL,
        assetTag NVARCHAR(100) NOT NULL,
        assetName NVARCHAR(255) NOT NULL,
        fromOrgId NVARCHAR(100) NOT NULL,
        fromCampusId NVARCHAR(100) NOT NULL,
        fromBuildingId NVARCHAR(100) NOT NULL,
        fromRoomId NVARCHAR(100) NOT NULL,
        fromDeptId NVARCHAR(100) NOT NULL,
        toOrgId NVARCHAR(100) NOT NULL,
        toCampusId NVARCHAR(100) NOT NULL,
        toBuildingId NVARCHAR(100) NOT NULL,
        toRoomId NVARCHAR(100) NOT NULL,
        toDeptId NVARCHAR(100) NOT NULL,
        transferType NVARCHAR(50) NOT NULL,
        requestedBy NVARCHAR(255) NOT NULL,
        requestedByEmail NVARCHAR(255) NULL,
        approvedBy NVARCHAR(255) NULL,
        transferDate NVARCHAR(50) NOT NULL,
        status NVARCHAR(50) DEFAULT 'Approved',
        remarks NVARCHAR(MAX) NULL
      );

      IF OBJECT_ID('dbo.PhysicalVerifications', 'U') IS NULL
      CREATE TABLE dbo.PhysicalVerifications (
        id NVARCHAR(100) PRIMARY KEY,
        verificationBatchCode NVARCHAR(100) NOT NULL,
        organizationId NVARCHAR(100) NOT NULL,
        campusId NVARCHAR(100) NOT NULL,
        buildingId NVARCHAR(100) NOT NULL,
        roomId NVARCHAR(100) NOT NULL,
        totalAssetsInRoom INT DEFAULT 0,
        verifiedAssetsCount INT DEFAULT 0,
        missingAssetsCount INT DEFAULT 0,
        discrepanciesCount INT DEFAULT 0,
        verifiedBy NVARCHAR(255) NOT NULL,
        verificationDate NVARCHAR(50) NOT NULL,
        status NVARCHAR(50) DEFAULT 'Completed',
        notes NVARCHAR(MAX) NULL,
        auditDetailsJson NVARCHAR(MAX) NULL
      );

      IF OBJECT_ID('dbo.RepairRecords', 'U') IS NULL
      CREATE TABLE dbo.RepairRecords (
        id NVARCHAR(100) PRIMARY KEY,
        assetId NVARCHAR(100) NOT NULL,
        assetTag NVARCHAR(100) NOT NULL,
        assetName NVARCHAR(255) NOT NULL,
        organizationId NVARCHAR(100) NOT NULL,
        issueDescription NVARCHAR(MAX) NOT NULL,
        reportedBy NVARCHAR(255) NOT NULL,
        reportedDate NVARCHAR(50) NOT NULL,
        assignedVendor NVARCHAR(255) NULL,
        vendorContact NVARCHAR(100) NULL,
        repairCost DECIMAL(18,2) DEFAULT 0.00,
        status NVARCHAR(50) DEFAULT 'In Progress',
        startDate NVARCHAR(50) NULL,
        completionDate NVARCHAR(50) NULL,
        remarks NVARCHAR(MAX) NULL
      );

      IF OBJECT_ID('dbo.AMCRecords', 'U') IS NULL
      CREATE TABLE dbo.AMCRecords (
        id NVARCHAR(100) PRIMARY KEY,
        organizationId NVARCHAR(100) NOT NULL,
        contractNumber NVARCHAR(100) NOT NULL,
        vendorName NVARCHAR(255) NOT NULL,
        vendorContact NVARCHAR(100) NULL,
        vendorEmail NVARCHAR(255) NULL,
        contractType NVARCHAR(50) NOT NULL,
        startDate NVARCHAR(50) NOT NULL,
        endDate NVARCHAR(50) NOT NULL,
        annualCost DECIMAL(18,2) DEFAULT 0.00,
        status NVARCHAR(50) DEFAULT 'Active',
        coveredAssetsCount INT DEFAULT 0,
        assetIdsJson NVARCHAR(MAX) NULL,
        terms NVARCHAR(MAX) NULL
      );

      IF OBJECT_ID('dbo.AuditLogs', 'U') IS NULL
      CREATE TABLE dbo.AuditLogs (
        id NVARCHAR(100) PRIMARY KEY,
        timestamp NVARCHAR(100) NOT NULL,
        performedBy NVARCHAR(255) NOT NULL,
        performedByRole NVARCHAR(100) NOT NULL,
        organizationId NVARCHAR(100) NULL,
        module NVARCHAR(100) NOT NULL,
        action NVARCHAR(100) NOT NULL,
        details NVARCHAR(MAX) NOT NULL
      );

      IF OBJECT_ID('dbo.Users', 'U') IS NULL
      CREATE TABLE dbo.Users (
        id NVARCHAR(100) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL,
        role NVARCHAR(100) NOT NULL,
        organizationId NVARCHAR(100) NULL,
        departmentId NVARCHAR(100) NULL,
        phone NVARCHAR(50) NULL,
        status NVARCHAR(50) DEFAULT 'Active',
        avatar NVARCHAR(MAX) NULL,
        allowedModulesJson NVARCHAR(MAX) NULL,
        lastLogin NVARCHAR(50) NULL
      );

      IF OBJECT_ID('dbo.Tickets', 'U') IS NULL
      CREATE TABLE dbo.Tickets (
        id NVARCHAR(100) PRIMARY KEY,
        ticketNumber NVARCHAR(100) NOT NULL,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX) NOT NULL,
        category NVARCHAR(100) NOT NULL,
        priority NVARCHAR(50) NOT NULL,
        status NVARCHAR(50) NOT NULL,
        assetId NVARCHAR(100) NULL,
        assetTag NVARCHAR(100) NULL,
        organizationId NVARCHAR(100) NOT NULL,
        campusId NVARCHAR(100) NULL,
        buildingId NVARCHAR(100) NULL,
        roomId NVARCHAR(100) NULL,
        reportedBy NVARCHAR(255) NOT NULL,
        reportedByEmail NVARCHAR(255) NULL,
        reportedDate NVARCHAR(50) NOT NULL,
        targetResolutionDate NVARCHAR(50) NULL,
        assignedTechnician NVARCHAR(255) NULL,
        technicianPhone NVARCHAR(50) NULL,
        commentsJson NVARCHAR(MAX) NULL
      );

      IF OBJECT_ID('dbo.Vendors', 'U') IS NULL
      CREATE TABLE dbo.Vendors (
        id NVARCHAR(100) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        code NVARCHAR(50) NOT NULL,
        category NVARCHAR(MAX) NULL,
        contactPerson NVARCHAR(255) NULL,
        email NVARCHAR(255) NULL,
        phone NVARCHAR(50) NULL,
        address NVARCHAR(MAX) NULL,
        city NVARCHAR(100) NULL,
        state NVARCHAR(100) NULL,
        pincode NVARCHAR(20) NULL,
        gstNumber NVARCHAR(100) NULL,
        panNumber NVARCHAR(100) NULL,
        rating INT DEFAULT 5,
        status NVARCHAR(50) DEFAULT 'Active',
        paymentTerms NVARCHAR(100) NULL,
        bankDetailsJson NVARCHAR(MAX) NULL,
        notes NVARCHAR(MAX) NULL,
        createdDate NVARCHAR(50) NULL,
        updatedDate NVARCHAR(50) NULL
      );

      -- Ensure friendly and frontend-compatible columns exist on dbo.Assets
      IF COL_LENGTH('dbo.Assets', 'campusName') IS NULL
        ALTER TABLE dbo.Assets ADD campusName NVARCHAR(255) NULL;
      IF COL_LENGTH('dbo.Assets', 'category') IS NULL
        ALTER TABLE dbo.Assets ADD category NVARCHAR(255) NULL;
      IF COL_LENGTH('dbo.Assets', 'assetStatus') IS NULL
        ALTER TABLE dbo.Assets ADD assetStatus NVARCHAR(50) NULL;
      IF COL_LENGTH('dbo.Assets', 'particulars') IS NULL
        ALTER TABLE dbo.Assets ADD particulars NVARCHAR(255) NULL;
      IF COL_LENGTH('dbo.Assets', 'vendorName') IS NULL
        ALTER TABLE dbo.Assets ADD vendorName NVARCHAR(255) NULL;

      -- NULL-friendly and compatibility columns for infrastructure hierarchy tables
      IF OBJECT_ID('dbo.Floors', 'U') IS NOT NULL
      BEGIN
        IF COL_LENGTH('dbo.Floors', 'campusId') IS NOT NULL
          BEGIN TRY ALTER TABLE dbo.Floors ALTER COLUMN campusId NVARCHAR(100) NULL; END TRY BEGIN CATCH END CATCH;
        IF COL_LENGTH('dbo.Floors', 'organizationId') IS NOT NULL
          BEGIN TRY ALTER TABLE dbo.Floors ALTER COLUMN organizationId NVARCHAR(100) NULL; END TRY BEGIN CATCH END CATCH;
        IF COL_LENGTH('dbo.Floors', 'name') IS NULL AND COL_LENGTH('dbo.Floors', 'floorName') IS NOT NULL
          BEGIN TRY ALTER TABLE dbo.Floors ADD name NVARCHAR(100) NULL; END TRY BEGIN CATCH END CATCH;
        IF COL_LENGTH('dbo.Floors', 'floorName') IS NULL AND COL_LENGTH('dbo.Floors', 'name') IS NOT NULL
          BEGIN TRY ALTER TABLE dbo.Floors ADD floorName NVARCHAR(100) NULL; END TRY BEGIN CATCH END CATCH;
      END;

      IF OBJECT_ID('dbo.Rooms', 'U') IS NOT NULL
      BEGIN
        IF COL_LENGTH('dbo.Rooms', 'floorId') IS NOT NULL
          BEGIN TRY ALTER TABLE dbo.Rooms ALTER COLUMN floorId NVARCHAR(100) NULL; END TRY BEGIN CATCH END CATCH;
        IF COL_LENGTH('dbo.Rooms', 'campusId') IS NOT NULL
          BEGIN TRY ALTER TABLE dbo.Rooms ALTER COLUMN campusId NVARCHAR(100) NULL; END TRY BEGIN CATCH END CATCH;
        IF COL_LENGTH('dbo.Rooms', 'organizationId') IS NOT NULL
          BEGIN TRY ALTER TABLE dbo.Rooms ALTER COLUMN organizationId NVARCHAR(100) NULL; END TRY BEGIN CATCH END CATCH;
        IF COL_LENGTH('dbo.Rooms', 'name') IS NULL
          BEGIN TRY ALTER TABLE dbo.Rooms ADD name NVARCHAR(255) NULL; END TRY BEGIN CATCH END CATCH;
        IF COL_LENGTH('dbo.Rooms', 'roomName') IS NULL
          BEGIN TRY ALTER TABLE dbo.Rooms ADD roomName NVARCHAR(255) NULL; END TRY BEGIN CATCH END CATCH;
        IF COL_LENGTH('dbo.Rooms', 'campusId') IS NULL
          BEGIN TRY ALTER TABLE dbo.Rooms ADD campusId NVARCHAR(100) NULL; END TRY BEGIN CATCH END CATCH;
        IF COL_LENGTH('dbo.Rooms', 'organizationId') IS NULL
          BEGIN TRY ALTER TABLE dbo.Rooms ADD organizationId NVARCHAR(100) NULL; END TRY BEGIN CATCH END CATCH;
        IF COL_LENGTH('dbo.Rooms', 'capacity') IS NULL
          BEGIN TRY ALTER TABLE dbo.Rooms ADD capacity INT DEFAULT 0; END TRY BEGIN CATCH END CATCH;
        IF COL_LENGTH('dbo.Rooms', 'status') IS NULL
          BEGIN TRY ALTER TABLE dbo.Rooms ADD status NVARCHAR(50) DEFAULT 'Active'; END TRY BEGIN CATCH END CATCH;
      END;

      IF OBJECT_ID('dbo.Departments', 'U') IS NOT NULL
      BEGIN
        IF COL_LENGTH('dbo.Departments', 'headOfDepartment') IS NULL
          BEGIN TRY ALTER TABLE dbo.Departments ADD headOfDepartment NVARCHAR(255) NULL; END TRY BEGIN CATCH END CATCH;
        IF COL_LENGTH('dbo.Departments', 'email') IS NULL
          BEGIN TRY ALTER TABLE dbo.Departments ADD email NVARCHAR(255) NULL; END TRY BEGIN CATCH END CATCH;
        IF COL_LENGTH('dbo.Departments', 'phone') IS NULL
          BEGIN TRY ALTER TABLE dbo.Departments ADD phone NVARCHAR(50) NULL; END TRY BEGIN CATCH END CATCH;
        IF COL_LENGTH('dbo.Departments', 'status') IS NULL
          BEGIN TRY ALTER TABLE dbo.Departments ADD status NVARCHAR(50) DEFAULT 'Active'; END TRY BEGIN CATCH END CATCH;
      END;

      -- Synonyms so either dbo.Categories or dbo.AssetCategories works interchangeably
      IF OBJECT_ID('dbo.AssetCategories') IS NULL AND OBJECT_ID('dbo.Categories') IS NOT NULL
        CREATE SYNONYM dbo.AssetCategories FOR dbo.Categories;
      IF OBJECT_ID('dbo.AssetSubCategories') IS NULL AND OBJECT_ID('dbo.SubCategories') IS NOT NULL
        CREATE SYNONYM dbo.AssetSubCategories FOR dbo.SubCategories;
      IF OBJECT_ID('dbo.Categories') IS NULL AND OBJECT_ID('dbo.AssetCategories') IS NOT NULL
        CREATE SYNONYM dbo.Categories FOR dbo.AssetCategories;
      IF OBJECT_ID('dbo.SubCategories') IS NULL AND OBJECT_ID('dbo.AssetSubCategories') IS NOT NULL
        CREATE SYNONYM dbo.SubCategories FOR dbo.AssetSubCategories;
    `;

    await pool.request().query(createScript);

    // Create or update vw_Assets view for easy SSMS reporting
    try {
      await pool.request().query(`
        IF OBJECT_ID('dbo.vw_Assets', 'V') IS NOT NULL DROP VIEW dbo.vw_Assets;
      `);
      await pool.request().query(`
        CREATE VIEW dbo.vw_Assets AS
        SELECT 
          a.id,
          a.assetTag,
          COALESCE(a.particulars, a.name) AS particulars,
          a.name,
          COALESCE(a.assetStatus, a.status, 'Active') AS assetStatus,
          COALESCE(a.status, a.assetStatus, 'Active') AS status,
          a.condition,
          a.condition AS currentCondition,
          a.categoryId,
          COALESCE(a.category, c.name, a.categoryId) AS category,
          COALESCE(c.name, a.category, a.categoryId) AS categoryName,
          a.subCategoryId,
          sc.name AS subCategoryName,
          a.organizationId,
          o.name AS organizationName,
          a.campusId,
          COALESCE(a.campusName, cmp.name, a.campusId) AS campusName,
          a.buildingId,
          b.name AS buildingName,
          a.floorId,
          f.floorName,
          a.roomId,
          r.roomName,
          a.departmentId,
          d.name AS departmentName,
          a.vendorId,
          v.name AS vendorName,
          a.model,
          a.brand,
          a.brand AS manufacturer,
          a.serialNumber,
          a.serialNumber AS assetSerialNumber,
          a.quantity,
          a.unitCost,
          a.purchaseCost,
          a.purchaseDate,
          a.invoiceNumber,
          a.assignedTo,
          a.assignedTo AS assignedEmployee,
          a.custodian,
          a.warrantyExpiry,
          a.amcExpiry,
          a.referencePrefix,
          a.referenceNumber,
          a.isBulkAsset,
          a.barcodeUrl AS barcode,
          a.qrCodeUrl AS qrCode,
          a.specificationsJson,
          a.createdDate,
          a.lastUpdated AS updatedDate
        FROM dbo.Assets a
        LEFT JOIN dbo.Campuses cmp ON a.campusId = cmp.id
        LEFT JOIN dbo.Organizations o ON a.organizationId = o.id
        LEFT JOIN dbo.Buildings b ON a.buildingId = b.id
        LEFT JOIN dbo.Floors f ON a.floorId = f.id
        LEFT JOIN dbo.Rooms r ON a.roomId = r.id
        LEFT JOIN dbo.Departments d ON a.departmentId = d.id
        LEFT JOIN dbo.AssetCategories c ON a.categoryId = c.id
        LEFT JOIN dbo.AssetSubCategories sc ON a.subCategoryId = sc.id
        LEFT JOIN dbo.Vendors v ON a.vendorId = v.id;
      `);
    } catch (vErr) {
      console.warn('Note: vw_Assets view setup non-fatal notice:', vErr);
    }

    return { success: true, message: 'SQL Server Express tables and vw_Assets view verified and created successfully!' };
  } catch (err: any) {
    return { success: false, message: `Failed to initialize SQL Server Express schema: ${err?.message || err}` };
  }
}

/**
 * Saves or updates an asset directly in SQL Server Express (dbo.Assets)
 */
export async function saveAssetToMSSQL(asset: any): Promise<boolean> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) return false;

    // Ensure columns exist to support both schema variants
    try {
      await pool.request().query(`
        IF COL_LENGTH('dbo.Assets', 'organizationId') IS NULL
          ALTER TABLE dbo.Assets ADD organizationId NVARCHAR(100) NULL;
        IF COL_LENGTH('dbo.Assets', 'particulars') IS NULL
          ALTER TABLE dbo.Assets ADD particulars NVARCHAR(255) NULL;
        IF COL_LENGTH('dbo.Assets', 'campusName') IS NULL
          ALTER TABLE dbo.Assets ADD campusName NVARCHAR(255) NULL;
        IF COL_LENGTH('dbo.Assets', 'category') IS NULL
          ALTER TABLE dbo.Assets ADD category NVARCHAR(255) NULL;
        IF COL_LENGTH('dbo.Assets', 'assetStatus') IS NULL
          ALTER TABLE dbo.Assets ADD assetStatus NVARCHAR(50) NULL;
        IF COL_LENGTH('dbo.Assets', 'vendorName') IS NULL
          ALTER TABLE dbo.Assets ADD vendorName NVARCHAR(255) NULL;
      `);
    } catch {
      // Ignore column alter check
    }

    // Auto-resolve human-friendly names if not provided on the asset
    let storeData: any = null;
    try {
      const { dbStore } = await import('./db');
      storeData = dbStore.getData();
    } catch {}

    const id = asset.id || `ast-${Date.now()}`;
    const assetTag = asset.assetTag || 'TAG-UNKNOWN';
    const name = asset.particulars || asset.name || 'Unnamed Asset';
    const particulars = name;
    const orgId = asset.organizationId || 'org-arvd';
    const campusId = asset.campusId || 'cmp-dig';
    const campusName = asset.campusName || storeData?.campuses?.find((c: any) => c.id === campusId)?.name || null;
    const buildingId = asset.buildingId || 'bld-admin-dig';
    const floorId = asset.floorId || 'flr-dig-g';
    const roomId = asset.roomId || 'rm-server-room';
    const departmentId = asset.departmentId || 'dept-admin';
    const categoryId = asset.categoryId || 'cat-it';
    const category = asset.category || storeData?.categories?.find((c: any) => c.id === categoryId)?.name || null;
    const subCategoryId = asset.subCategoryId || '';
    const vendorId = asset.vendorId || null;
    const vendorName = asset.vendorName || storeData?.vendors?.find((v: any) => v.id === vendorId)?.name || null;
    const referencePrefix = asset.referencePrefix || 'RF';
    const referenceNumber = asset.referenceNumber || null;
    const isBulkAsset = asset.isBulkAsset ? 1 : 0;
    const quantity = asset.quantity || 1;
    const unitCost = asset.unitCost || asset.purchaseCost || 0;
    const model = asset.model || null;
    const brand = asset.manufacturer || asset.brand || null;
    const purchaseDate = asset.purchaseDate || new Date().toISOString().split('T')[0];
    const purchaseCost = asset.purchaseCost || 0;
    const invoiceNumber = asset.invoiceNumber || null;
    const status = asset.assetStatus || asset.status || 'Active';
    const assetStatus = status;
    const condition = asset.currentCondition || asset.condition || 'Good';
    const serialNumber = asset.assetSerialNumber || asset.serialNumber || null;
    const custodian = asset.assignedEmployee || asset.custodian || null;
    const assignedTo = asset.assignedEmployee || asset.assignedTo || null;
    const warrantyExpiry = asset.warrantyEnd || asset.warrantyExpiry || null;
    const amcExpiry = asset.amcEnd || asset.amcExpiry || null;
    const barcode = asset.assetTag || null;
    const qrCode = asset.assetTag || null;
    const specificationsJson = asset.specifications ? JSON.stringify(asset.specifications) : (asset.description ? JSON.stringify({ description: asset.description }) : null);
    const createdDate = asset.createdDate || new Date().toISOString().split('T')[0];
    const updatedDate = new Date().toISOString().split('T')[0];

    const req = pool.request()
      .input('id', sql.NVarChar(100), id)
      .input('assetTag', sql.NVarChar(100), assetTag)
      .input('name', sql.NVarChar(255), name)
      .input('particulars', sql.NVarChar(255), particulars)
      .input('organizationId', sql.NVarChar(100), orgId)
      .input('campusId', sql.NVarChar(100), campusId)
      .input('campusName', sql.NVarChar(255), campusName)
      .input('buildingId', sql.NVarChar(100), buildingId)
      .input('floorId', sql.NVarChar(100), floorId)
      .input('roomId', sql.NVarChar(100), roomId)
      .input('departmentId', sql.NVarChar(100), departmentId)
      .input('categoryId', sql.NVarChar(100), categoryId)
      .input('category', sql.NVarChar(255), category)
      .input('subCategoryId', sql.NVarChar(100), subCategoryId)
      .input('vendorId', sql.NVarChar(100), vendorId)
      .input('vendorName', sql.NVarChar(255), vendorName)
      .input('referencePrefix', sql.NVarChar(20), referencePrefix)
      .input('referenceNumber', sql.NVarChar(100), referenceNumber)
      .input('isBulkAsset', sql.Bit, isBulkAsset)
      .input('quantity', sql.Int, quantity)
      .input('unitCost', sql.Decimal(18, 2), unitCost)
      .input('model', sql.NVarChar(255), model)
      .input('brand', sql.NVarChar(255), brand)
      .input('purchaseDate', sql.NVarChar(50), purchaseDate)
      .input('purchaseCost', sql.Decimal(18, 2), purchaseCost)
      .input('invoiceNumber', sql.NVarChar(100), invoiceNumber)
      .input('status', sql.NVarChar(50), status)
      .input('assetStatus', sql.NVarChar(50), assetStatus)
      .input('condition', sql.NVarChar(50), condition)
      .input('serialNumber', sql.NVarChar(100), serialNumber)
      .input('custodian', sql.NVarChar(255), custodian)
      .input('assignedTo', sql.NVarChar(255), assignedTo)
      .input('warrantyExpiry', sql.NVarChar(50), warrantyExpiry)
      .input('amcExpiry', sql.NVarChar(50), amcExpiry)
      .input('barcode', sql.NVarChar(255), barcode)
      .input('qrCode', sql.NVarChar(255), qrCode)
      .input('specificationsJson', sql.NVarChar(sql.MAX), specificationsJson)
      .input('createdDate', sql.NVarChar(50), createdDate)
      .input('updatedDate', sql.NVarChar(50), updatedDate);

    await req.query(`
      IF EXISTS (SELECT 1 FROM dbo.Assets WHERE id = @id)
      BEGIN
        UPDATE dbo.Assets SET
          assetTag = @assetTag,
          name = @name,
          particulars = @particulars,
          organizationId = @organizationId,
          campusId = @campusId,
          campusName = COALESCE(@campusName, campusName),
          buildingId = @buildingId,
          floorId = @floorId,
          roomId = @roomId,
          departmentId = @departmentId,
          categoryId = @categoryId,
          category = COALESCE(@category, category),
          subCategoryId = @subCategoryId,
          vendorId = @vendorId,
          vendorName = COALESCE(@vendorName, vendorName),
          referencePrefix = @referencePrefix,
          referenceNumber = @referenceNumber,
          isBulkAsset = @isBulkAsset,
          quantity = @quantity,
          unitCost = @unitCost,
          model = @model,
          brand = @brand,
          purchaseDate = @purchaseDate,
          purchaseCost = @purchaseCost,
          invoiceNumber = @invoiceNumber,
          status = @status,
          assetStatus = @assetStatus,
          condition = @condition,
          serialNumber = @serialNumber,
          custodian = @custodian,
          assignedTo = @assignedTo,
          warrantyExpiry = @warrantyExpiry,
          amcExpiry = @amcExpiry,
          barcode = @barcode,
          qrCode = @qrCode,
          specificationsJson = @specificationsJson,
          updatedDate = @updatedDate
        WHERE id = @id;
      END
      ELSE
      BEGIN
        INSERT INTO dbo.Assets (
          id, assetTag, name, particulars, organizationId, campusId, campusName, buildingId, floorId, roomId, departmentId,
          categoryId, category, subCategoryId, vendorId, vendorName, referencePrefix, referenceNumber,
          isBulkAsset, quantity, unitCost, model, brand, purchaseDate, purchaseCost,
          invoiceNumber, status, assetStatus, condition, serialNumber, custodian, assignedTo,
          warrantyExpiry, amcExpiry, barcode, qrCode, specificationsJson, createdDate, updatedDate
        ) VALUES (
          @id, @assetTag, @name, @particulars, @organizationId, @campusId, @campusName, @buildingId, @floorId, @roomId, @departmentId,
          @categoryId, @category, @subCategoryId, @vendorId, @vendorName, @referencePrefix, @referenceNumber,
          @isBulkAsset, @quantity, @unitCost, @model, @brand, @purchaseDate, @purchaseCost,
          @invoiceNumber, @status, @assetStatus, @condition, @serialNumber, @custodian, @assignedTo,
        );
      END
    `);

    console.log(`✅ Asset [${assetTag} - ${name}] successfully saved to SQL Server dbo.Assets!`);
    return true;
  } catch (err: any) {
    console.error('❌ Failed to save asset to SQL Server:', err?.message || err);
    return false;
  }
}

/**
 * Deletes an asset directly from SQL Server dbo.Assets (by id or assetTag)
 */
export async function deleteAssetFromMSSQL(idOrTag: string): Promise<boolean> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) return false;

    // Remove any dependent child records first in case FK constraints exist
    try {
      await pool.request()
        .input('target', sql.NVarChar(100), idOrTag)
        .query(`
          DELETE FROM dbo.RepairRecords WHERE assetId = @target OR assetTag = @target;
          DELETE FROM dbo.AssetTransfers WHERE assetId = @target OR assetTag = @target;
          DELETE FROM dbo.Tickets WHERE assetId = @target OR assetTag = @target;
        `);
    } catch (depErr) {
      // Non-fatal if child tables don't exist
    }

    // Delete from dbo.Assets
    const res = await pool.request()
      .input('target', sql.NVarChar(100), idOrTag)
      .query('DELETE FROM dbo.Assets WHERE id = @target OR assetTag = @target');

    console.log(`✅ Asset [${idOrTag}] removed from SQL Server dbo.Assets (Rows affected: ${res.rowsAffected[0] || 0})`);
    return true;
  } catch (err: any) {
    console.error('❌ Failed to delete asset from SQL Server:', err?.message || err);
    return false;
  }
}

const tableColumnsCache: Map<string, Set<string>> = new Map();

export async function getTableColumns(pool: sql.ConnectionPool, tableName: string): Promise<Set<string>> {
  const key = tableName.toLowerCase();
  if (tableColumnsCache.has(key)) return tableColumnsCache.get(key)!;
  try {
    const res = await pool.request()
      .input('tbl', sql.NVarChar(128), tableName)
      .query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = @tbl
      `);
    const cols = new Set<string>();
    for (const r of res.recordset) {
      cols.add(r.COLUMN_NAME.toLowerCase());
    }
    tableColumnsCache.set(key, cols);
    return cols;
  } catch (err) {
    return new Set<string>();
  }
}

export function clearTableColumnsCache() {
  tableColumnsCache.clear();
}

/**
 * Saves or updates an organization in dbo.Organizations
 */
export async function saveOrganizationToMSSQL(org: any): Promise<boolean> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) return false;

    const cols = await getTableColumns(pool, 'Organizations');
    const colList: string[] = ['id'];
    const valList: string[] = ['@id'];
    const updateList: string[] = [];

    const req = pool.request().input('id', sql.NVarChar(100), org.id);

    if (cols.has('name')) {
      colList.push('name');
      valList.push('@name');
      updateList.push('name = @name');
      req.input('name', sql.NVarChar(255), org.name || '');
    }
    if (cols.has('shortcode')) {
      colList.push('shortCode');
      valList.push('@shortCode');
      updateList.push('shortCode = @shortCode');
      req.input('shortCode', sql.NVarChar(50), org.shortCode || org.code || '');
    } else if (cols.has('code')) {
      colList.push('code');
      valList.push('@code');
      updateList.push('code = @code');
      req.input('code', sql.NVarChar(50), org.shortCode || org.code || '');
    }
    if (cols.has('logo')) {
      colList.push('logo');
      valList.push('@logo');
      updateList.push('logo = @logo');
      req.input('logo', sql.NVarChar(sql.MAX), org.logo || null);
    }
    if (cols.has('address')) {
      colList.push('address');
      valList.push('@address');
      updateList.push('address = @address');
      req.input('address', sql.NVarChar(sql.MAX), org.address || null);
    }
    if (cols.has('gstnumber')) {
      colList.push('gstNumber');
      valList.push('@gstNumber');
      updateList.push('gstNumber = @gstNumber');
      req.input('gstNumber', sql.NVarChar(100), org.gstNumber || null);
    }
    if (cols.has('email')) {
      colList.push('email');
      valList.push('@email');
      updateList.push('email = @email');
      req.input('email', sql.NVarChar(255), org.email || null);
    }
    if (cols.has('phone')) {
      colList.push('phone');
      valList.push('@phone');
      updateList.push('phone = @phone');
      req.input('phone', sql.NVarChar(50), org.phone || null);
    }
    if (cols.has('status')) {
      colList.push('status');
      valList.push('@status');
      updateList.push('status = @status');
      req.input('status', sql.NVarChar(50), org.status || 'Active');
    }
    if (cols.has('createddate')) {
      colList.push('createdDate');
      valList.push('@createdDate');
      updateList.push('createdDate = @createdDate');
      req.input('createdDate', sql.NVarChar(50), org.createdDate || new Date().toISOString().split('T')[0]);
    }

    if (updateList.length === 0) updateList.push('id = @id');

    await req.query(`
      IF EXISTS (SELECT 1 FROM dbo.Organizations WHERE id = @id)
      BEGIN
        UPDATE dbo.Organizations SET ${updateList.join(', ')} WHERE id = @id;
      END
      ELSE
      BEGIN
        INSERT INTO dbo.Organizations (${colList.join(', ')}) VALUES (${valList.join(', ')});
      END
    `);

    console.log(`✅ Organization [${org.shortCode || org.name}] saved to SQL Server dbo.Organizations`);
    return true;
  } catch (err: any) {
    console.error('Failed to save organization to MSSQL:', err?.message || err);
    return false;
  }
}

/**
 * Saves or updates a campus in dbo.Campuses
 */
export async function saveCampusToMSSQL(campus: any): Promise<boolean> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) return false;

    const cols = await getTableColumns(pool, 'Campuses');
    const colList: string[] = ['id'];
    const valList: string[] = ['@id'];
    const updateList: string[] = [];

    const req = pool.request().input('id', sql.NVarChar(100), campus.id);

    if (cols.has('organizationid')) {
      colList.push('organizationId');
      valList.push('@organizationId');
      updateList.push('organizationId = @organizationId');
      req.input('organizationId', sql.NVarChar(100), campus.organizationId || 'org-arvd');
    }
    if (cols.has('name')) {
      colList.push('name');
      valList.push('@name');
      updateList.push('name = @name');
      req.input('name', sql.NVarChar(255), campus.name || '');
    }
    if (cols.has('code')) {
      colList.push('code');
      valList.push('@code');
      updateList.push('code = @code');
      req.input('code', sql.NVarChar(50), campus.code || '');
    }
    if (cols.has('campustype')) {
      colList.push('campusType');
      valList.push('@campusType');
      updateList.push('campusType = @campusType');
      req.input('campusType', sql.NVarChar(100), campus.campusType || 'School Campus');
    }
    if (cols.has('address')) {
      colList.push('address');
      valList.push('@address');
      updateList.push('address = @address');
      req.input('address', sql.NVarChar(sql.MAX), campus.address || null);
    }
    if (cols.has('city')) {
      colList.push('city');
      valList.push('@city');
      updateList.push('city = @city');
      req.input('city', sql.NVarChar(100), campus.city || null);
    }
    if (cols.has('state')) {
      colList.push('state');
      valList.push('@state');
      updateList.push('state = @state');
      req.input('state', sql.NVarChar(100), campus.state || null);
    }
    if (cols.has('status')) {
      colList.push('status');
      valList.push('@status');
      updateList.push('status = @status');
      req.input('status', sql.NVarChar(50), campus.status || 'Active');
    }

    if (updateList.length === 0) updateList.push('id = @id');

    await req.query(`
      IF EXISTS (SELECT 1 FROM dbo.Campuses WHERE id = @id)
      BEGIN
        UPDATE dbo.Campuses SET ${updateList.join(', ')} WHERE id = @id;
      END
      ELSE
      BEGIN
        INSERT INTO dbo.Campuses (${colList.join(', ')}) VALUES (${valList.join(', ')});
      END
    `);

    console.log(`✅ Campus [${campus.code} - ${campus.name}] saved to SQL Server dbo.Campuses`);
    return true;
  } catch (err: any) {
    console.error('Failed to save campus to MSSQL:', err?.message || err);
    return false;
  }
}

/**
 * Saves or updates a building in dbo.Buildings
 */
export async function saveBuildingToMSSQL(bld: any): Promise<boolean> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) return false;

    const cols = await getTableColumns(pool, 'Buildings');
    const colList: string[] = ['id'];
    const valList: string[] = ['@id'];
    const updateList: string[] = [];

    const req = pool.request().input('id', sql.NVarChar(100), bld.id);

    if (cols.has('campusid')) {
      colList.push('campusId');
      valList.push('@campusId');
      updateList.push('campusId = @campusId');
      req.input('campusId', sql.NVarChar(100), bld.campusId || 'cmp-dig');
    }
    if (cols.has('organizationid')) {
      colList.push('organizationId');
      valList.push('@organizationId');
      updateList.push('organizationId = @organizationId');
      req.input('organizationId', sql.NVarChar(100), bld.organizationId || 'org-arvd');
    }
    if (cols.has('name')) {
      colList.push('name');
      valList.push('@name');
      updateList.push('name = @name');
      req.input('name', sql.NVarChar(255), bld.name || '');
    }
    if (cols.has('code')) {
      colList.push('code');
      valList.push('@code');
      updateList.push('code = @code');
      req.input('code', sql.NVarChar(50), bld.code || '');
    }
    if (cols.has('floorscount')) {
      colList.push('floorsCount');
      valList.push('@floorsCount');
      updateList.push('floorsCount = @floorsCount');
      req.input('floorsCount', sql.Int, bld.noOfFloors || bld.floorsCount || 1);
    }
    if (cols.has('nooffloors')) {
      colList.push('noOfFloors');
      valList.push('@noOfFloors');
      updateList.push('noOfFloors = @noOfFloors');
      req.input('noOfFloors', sql.Int, bld.noOfFloors || 1);
    }
    if (cols.has('buildingtype')) {
      colList.push('buildingType');
      valList.push('@buildingType');
      updateList.push('buildingType = @buildingType');
      req.input('buildingType', sql.NVarChar(100), bld.buildingType || 'General');
    }
    if (cols.has('status')) {
      colList.push('status');
      valList.push('@status');
      updateList.push('status = @status');
      req.input('status', sql.NVarChar(50), bld.status || 'Active');
    }

    if (updateList.length === 0) updateList.push('id = @id');

    await req.query(`
      IF EXISTS (SELECT 1 FROM dbo.Buildings WHERE id = @id)
      BEGIN
        UPDATE dbo.Buildings SET ${updateList.join(', ')} WHERE id = @id;
      END
      ELSE
      BEGIN
        INSERT INTO dbo.Buildings (${colList.join(', ')}) VALUES (${valList.join(', ')});
      END
    `);

    console.log(`✅ Building [${bld.code} - ${bld.name}] saved to SQL Server dbo.Buildings`);
    return true;
  } catch (err: any) {
    console.error('Failed to save building to MSSQL:', err?.message || err);
    return false;
  }
}

/**
 * Saves or updates a floor in dbo.Floors
 */
export async function saveFloorToMSSQL(flr: any): Promise<boolean> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) return false;

    const cols = await getTableColumns(pool, 'Floors');

    let storeData: any = null;
    try { const { dbStore } = await import('./db'); storeData = dbStore.getData(); } catch {}
    const bld = storeData?.buildings?.find((b: any) => b.id === flr.buildingId);
    const buildingId = flr.buildingId || '';
    const campusId = flr.campusId || bld?.campusId || 'cmp-dig';
    const orgId = flr.organizationId || bld?.organizationId || 'org-arvd';
    const floorName = flr.floorName || flr.name || 'Ground Floor';
    const floorNumber = typeof flr.floorNumber === 'number' ? flr.floorNumber : 0;

    const colList: string[] = ['id'];
    const valList: string[] = ['@id'];
    const updateList: string[] = [];

    const req = pool.request().input('id', sql.NVarChar(100), flr.id);

    if (cols.has('buildingid')) {
      colList.push('buildingId');
      valList.push('@buildingId');
      updateList.push('buildingId = @buildingId');
      req.input('buildingId', sql.NVarChar(100), buildingId);
    }
    if (cols.has('campusid')) {
      colList.push('campusId');
      valList.push('@campusId');
      updateList.push('campusId = @campusId');
      req.input('campusId', sql.NVarChar(100), campusId);
    }
    if (cols.has('organizationid')) {
      colList.push('organizationId');
      valList.push('@organizationId');
      updateList.push('organizationId = @organizationId');
      req.input('organizationId', sql.NVarChar(100), orgId);
    }
    if (cols.has('floorname')) {
      colList.push('floorName');
      valList.push('@floorName');
      updateList.push('floorName = @floorName');
      req.input('floorName', sql.NVarChar(100), floorName);
    }
    if (cols.has('name')) {
      colList.push('name');
      valList.push('@name');
      updateList.push('name = @name');
      req.input('name', sql.NVarChar(100), floorName);
    }
    if (cols.has('code')) {
      colList.push('code');
      valList.push('@code');
      updateList.push('code = @code');
      req.input('code', sql.NVarChar(50), flr.code || '');
    }
    if (cols.has('floornumber')) {
      colList.push('floorNumber');
      valList.push('@floorNumber');
      updateList.push('floorNumber = @floorNumber');
      req.input('floorNumber', sql.Int, floorNumber);
    }

    if (updateList.length === 0) updateList.push('id = @id');

    await req.query(`
      IF EXISTS (SELECT 1 FROM dbo.Floors WHERE id = @id)
      BEGIN
        UPDATE dbo.Floors SET ${updateList.join(', ')} WHERE id = @id;
      END
      ELSE
      BEGIN
        INSERT INTO dbo.Floors (${colList.join(', ')}) VALUES (${valList.join(', ')});
      END
    `);

    console.log(`✅ Floor [${floorName}] saved to SQL Server dbo.Floors`);
    return true;
  } catch (err: any) {
    console.error('Failed to save floor to MSSQL:', err?.message || err);
    return false;
  }
}

/**
 * Saves or updates a room in dbo.Rooms
 * Fully adaptive to match SSMS schema (handles either 'name' or 'roomName', optional hierarchy IDs)
 */
export async function saveRoomToMSSQL(rm: any): Promise<boolean> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) return false;

    const cols = await getTableColumns(pool, 'Rooms');

    let storeData: any = null;
    try { const { dbStore } = await import('./db'); storeData = dbStore.getData(); } catch {}
    const bld = storeData?.buildings?.find((b: any) => b.id === rm.buildingId);
    const buildingId = rm.buildingId || bld?.id || 'bld-admin-dig';
    const campusId = rm.campusId || bld?.campusId || 'cmp-dig';
    const orgId = rm.organizationId || bld?.organizationId || 'org-arvd';
    const floorId = rm.floorId || 'flr-dig-g';
    const roomNumber = rm.roomNumber || rm.roomCode || rm.name || '101';
    const roomName = rm.name || rm.roomName || `Room ${roomNumber}`;
    const roomType = rm.roomType || 'Classroom';
    const capacity = rm.capacity || 0;
    const status = rm.status || 'Active';

    const colList: string[] = ['id'];
    const valList: string[] = ['@id'];
    const updateList: string[] = [];

    const req = pool.request().input('id', sql.NVarChar(100), rm.id);

    if (cols.has('floorid')) {
      colList.push('floorId');
      valList.push('@floorId');
      updateList.push('floorId = @floorId');
      req.input('floorId', sql.NVarChar(100), floorId);
    }
    if (cols.has('buildingid')) {
      colList.push('buildingId');
      valList.push('@buildingId');
      updateList.push('buildingId = @buildingId');
      req.input('buildingId', sql.NVarChar(100), buildingId);
    }
    if (cols.has('campusid')) {
      colList.push('campusId');
      valList.push('@campusId');
      updateList.push('campusId = @campusId');
      req.input('campusId', sql.NVarChar(100), campusId);
    }
    if (cols.has('organizationid')) {
      colList.push('organizationId');
      valList.push('@organizationId');
      updateList.push('organizationId = @organizationId');
      req.input('organizationId', sql.NVarChar(100), orgId);
    }
    if (cols.has('roomnumber')) {
      colList.push('roomNumber');
      valList.push('@roomNumber');
      updateList.push('roomNumber = @roomNumber');
      req.input('roomNumber', sql.NVarChar(100), roomNumber);
    }
    if (cols.has('name')) {
      colList.push('name');
      valList.push('@name');
      updateList.push('name = @name');
      req.input('name', sql.NVarChar(255), roomName);
    }
    if (cols.has('roomname')) {
      colList.push('roomName');
      valList.push('@roomName');
      updateList.push('roomName = @roomName');
      req.input('roomName', sql.NVarChar(255), roomName);
    }
    if (cols.has('roomtype')) {
      colList.push('roomType');
      valList.push('@roomType');
      updateList.push('roomType = @roomType');
      req.input('roomType', sql.NVarChar(100), roomType);
    }
    if (cols.has('capacity')) {
      colList.push('capacity');
      valList.push('@capacity');
      updateList.push('capacity = @capacity');
      req.input('capacity', sql.Int, capacity);
    }
    if (cols.has('status')) {
      colList.push('status');
      valList.push('@status');
      updateList.push('status = @status');
      req.input('status', sql.NVarChar(50), status);
    }

    if (updateList.length === 0) updateList.push('id = @id');

    await req.query(`
      IF EXISTS (SELECT 1 FROM dbo.Rooms WHERE id = @id)
      BEGIN
        UPDATE dbo.Rooms SET ${updateList.join(', ')} WHERE id = @id;
      END
      ELSE
      BEGIN
        INSERT INTO dbo.Rooms (${colList.join(', ')}) VALUES (${valList.join(', ')});
      END
    `);

    console.log(`✅ Room [${roomNumber} - ${roomName}] saved to SQL Server dbo.Rooms`);
    return true;
  } catch (err: any) {
    console.error('Failed to save room to MSSQL:', err?.message || err);
    return false;
  }
}

/**
 * Saves or updates a department in dbo.Departments
 * Fully adaptive to match SSMS schema (id, organizationId, name, code, optional HOD/email/phone)
 */
export async function saveDepartmentToMSSQL(dept: any): Promise<boolean> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) return false;

    const cols = await getTableColumns(pool, 'Departments');

    const orgId = dept.organizationId || 'org-arvd';
    const name = dept.name || '';
    const code = dept.code || '';
    const hod = dept.headOfDepartment || dept.hodName || null;
    const email = dept.email || null;
    const phone = dept.phone || null;

    const colList: string[] = ['id'];
    const valList: string[] = ['@id'];
    const updateList: string[] = [];

    const req = pool.request().input('id', sql.NVarChar(100), dept.id);

    if (cols.has('organizationid')) {
      colList.push('organizationId');
      valList.push('@organizationId');
      updateList.push('organizationId = @organizationId');
      req.input('organizationId', sql.NVarChar(100), orgId);
    }
    if (cols.has('name')) {
      colList.push('name');
      valList.push('@name');
      updateList.push('name = @name');
      req.input('name', sql.NVarChar(255), name);
    }
    if (cols.has('code')) {
      colList.push('code');
      valList.push('@code');
      updateList.push('code = @code');
      req.input('code', sql.NVarChar(50), code);
    }
    if (cols.has('headofdepartment')) {
      colList.push('headOfDepartment');
      valList.push('@headOfDepartment');
      updateList.push('headOfDepartment = @headOfDepartment');
      req.input('headOfDepartment', sql.NVarChar(255), hod);
    } else if (cols.has('hodname')) {
      colList.push('hodName');
      valList.push('@hodName');
      updateList.push('hodName = @hodName');
      req.input('hodName', sql.NVarChar(255), hod);
    }
    if (cols.has('email')) {
      colList.push('email');
      valList.push('@email');
      updateList.push('email = @email');
      req.input('email', sql.NVarChar(255), email);
    }
    if (cols.has('phone')) {
      colList.push('phone');
      valList.push('@phone');
      updateList.push('phone = @phone');
      req.input('phone', sql.NVarChar(50), phone);
    }
    if (cols.has('status')) {
      colList.push('status');
      valList.push('@status');
      updateList.push('status = @status');
      req.input('status', sql.NVarChar(50), dept.status || 'Active');
    }

    if (updateList.length === 0) updateList.push('id = @id');

    await req.query(`
      IF EXISTS (SELECT 1 FROM dbo.Departments WHERE id = @id)
      BEGIN
        UPDATE dbo.Departments SET ${updateList.join(', ')} WHERE id = @id;
      END
      ELSE
      BEGIN
        INSERT INTO dbo.Departments (${colList.join(', ')}) VALUES (${valList.join(', ')});
      END
    `);

    console.log(`✅ Department [${code} - ${name}] saved to SQL Server dbo.Departments`);
    return true;
  } catch (err: any) {
    console.error('Failed to save department to MSSQL:', err?.message || err);
    return false;
  }
}

/**
 * Saves or updates an asset category in dbo.AssetCategories or dbo.Categories
 */
export async function saveCategoryToMSSQL(cat: any): Promise<boolean> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) return false;

    let targetTable = 'AssetCategories';
    try {
      const checkTable = await pool.request().query(`
        SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME IN ('AssetCategories', 'Categories')
      `);
      const tblNames = checkTable.recordset.map((r: any) => r.TABLE_NAME);
      if (tblNames.includes('AssetCategories')) {
        targetTable = 'AssetCategories';
      } else if (tblNames.includes('Categories')) {
        targetTable = 'Categories';
      }
    } catch {}

    const cols = await getTableColumns(pool, targetTable);
    const colList: string[] = ['id'];
    const valList: string[] = ['@id'];
    const updateList: string[] = [];

    const req = pool.request().input('id', sql.NVarChar(100), cat.id);

    if (cols.has('name')) {
      colList.push('name');
      valList.push('@name');
      updateList.push('name = @name');
      req.input('name', sql.NVarChar(255), cat.name || '');
    }
    if (cols.has('code')) {
      colList.push('code');
      valList.push('@code');
      updateList.push('code = @code');
      req.input('code', sql.NVarChar(50), cat.code || '');
    }
    if (cols.has('description')) {
      colList.push('description');
      valList.push('@description');
      updateList.push('description = @description');
      req.input('description', sql.NVarChar(sql.MAX), cat.description || null);
    }
    if (cols.has('icon')) {
      colList.push('icon');
      valList.push('@icon');
      updateList.push('icon = @icon');
      req.input('icon', sql.NVarChar(100), cat.icon || null);
    }

    if (updateList.length === 0) updateList.push('id = @id');

    await req.query(`
      IF EXISTS (SELECT 1 FROM dbo.${targetTable} WHERE id = @id)
      BEGIN
        UPDATE dbo.${targetTable} SET ${updateList.join(', ')} WHERE id = @id;
      END
      ELSE
      BEGIN
        INSERT INTO dbo.${targetTable} (${colList.join(', ')}) VALUES (${valList.join(', ')});
      END
    `);

    console.log(`✅ Category [${cat.code} - ${cat.name}] saved to SQL Server dbo.${targetTable}`);
    return true;
  } catch (err: any) {
    console.error('Failed to save category to MSSQL:', err?.message || err);
    return false;
  }
}

/**
 * Saves or updates an asset subcategory in dbo.AssetSubCategories or dbo.SubCategories
 */
export async function saveSubCategoryToMSSQL(subCat: any): Promise<boolean> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) return false;

    let targetTable = 'AssetSubCategories';
    try {
      const checkTable = await pool.request().query(`
        SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME IN ('AssetSubCategories', 'SubCategories')
      `);
      const tblNames = checkTable.recordset.map((r: any) => r.TABLE_NAME);
      if (tblNames.includes('AssetSubCategories')) {
        targetTable = 'AssetSubCategories';
      } else if (tblNames.includes('SubCategories')) {
        targetTable = 'SubCategories';
      }
    } catch {}

    const cols = await getTableColumns(pool, targetTable);
    const colList: string[] = ['id'];
    const valList: string[] = ['@id'];
    const updateList: string[] = [];

    const req = pool.request().input('id', sql.NVarChar(100), subCat.id);

    if (cols.has('categoryid')) {
      colList.push('categoryId');
      valList.push('@categoryId');
      updateList.push('categoryId = @categoryId');
      req.input('categoryId', sql.NVarChar(100), subCat.categoryId || 'cat-it');
    }
    if (cols.has('name')) {
      colList.push('name');
      valList.push('@name');
      updateList.push('name = @name');
      req.input('name', sql.NVarChar(255), subCat.name || '');
    }
    if (cols.has('code')) {
      colList.push('code');
      valList.push('@code');
      updateList.push('code = @code');
      req.input('code', sql.NVarChar(50), subCat.code || '');
    }
    if (cols.has('description')) {
      colList.push('description');
      valList.push('@description');
      updateList.push('description = @description');
      req.input('description', sql.NVarChar(sql.MAX), subCat.description || null);
    }

    if (updateList.length === 0) updateList.push('id = @id');

    await req.query(`
      IF EXISTS (SELECT 1 FROM dbo.${targetTable} WHERE id = @id)
      BEGIN
        UPDATE dbo.${targetTable} SET ${updateList.join(', ')} WHERE id = @id;
      END
      ELSE
      BEGIN
        INSERT INTO dbo.${targetTable} (${colList.join(', ')}) VALUES (${valList.join(', ')});
      END
    `);

    console.log(`✅ SubCategory [${subCat.code} - ${subCat.name}] saved to SQL Server dbo.${targetTable}`);
    return true;
  } catch (err: any) {
    console.error('Failed to save subcategory to MSSQL:', err?.message || err);
    return false;
  }
}

export async function deleteOrganizationFromMSSQL(id: string): Promise<boolean> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) return false;
    await pool.request().input('id', sql.NVarChar(100), id).query('DELETE FROM dbo.Organizations WHERE id = @id');
    return true;
  } catch { return false; }
}

export async function deleteCampusFromMSSQL(id: string): Promise<boolean> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) return false;
    await pool.request().input('id', sql.NVarChar(100), id).query('DELETE FROM dbo.Campuses WHERE id = @id');
    return true;
  } catch { return false; }
}

export async function deleteBuildingFromMSSQL(id: string): Promise<boolean> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) return false;
    await pool.request().input('id', sql.NVarChar(100), id).query('DELETE FROM dbo.Buildings WHERE id = @id');
    return true;
  } catch { return false; }
}

export async function deleteFloorFromMSSQL(id: string): Promise<boolean> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) return false;
    await pool.request().input('id', sql.NVarChar(100), id).query('DELETE FROM dbo.Floors WHERE id = @id');
    return true;
  } catch { return false; }
}

export async function deleteRoomFromMSSQL(id: string): Promise<boolean> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) return false;
    await pool.request().input('id', sql.NVarChar(100), id).query('DELETE FROM dbo.Rooms WHERE id = @id');
    return true;
  } catch { return false; }
}

export async function deleteDepartmentFromMSSQL(id: string): Promise<boolean> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) return false;
    await pool.request().input('id', sql.NVarChar(100), id).query('DELETE FROM dbo.Departments WHERE id = @id');
    return true;
  } catch { return false; }
}

export async function deleteCategoryFromMSSQL(id: string): Promise<boolean> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) return false;
    await pool.request().input('id', sql.NVarChar(100), id).query('DELETE FROM dbo.AssetCategories WHERE id = @id');
    return true;
  } catch { return false; }
}

export async function deleteSubCategoryFromMSSQL(id: string): Promise<boolean> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) return false;
    await pool.request().input('id', sql.NVarChar(100), id).query('DELETE FROM dbo.AssetSubCategories WHERE id = @id');
    return true;
  } catch { return false; }
}

/**
 * Bulk insert or synchronize an array of assets into SQL Server
 */
export async function bulkInsertAssetsToMSSQL(assets: any[]): Promise<number> {
  let count = 0;
  for (const asset of assets) {
    const ok = await saveAssetToMSSQL(asset);
    if (ok) count++;
  }
  return count;
}

/**
 * Saves a vendor into dbo.Vendors
 */
export async function saveVendorToMSSQL(vendor: any): Promise<boolean> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) return false;

    const id = vendor.id;
    const name = vendor.name || '';
    const code = vendor.code || '';
    const category = Array.isArray(vendor.categories) ? vendor.categories.join(', ') : (vendor.category || '');
    const contactPerson = vendor.contactPerson || '';
    const email = vendor.email || '';
    const phone = vendor.phone || '';
    const address = vendor.address || '';
    const city = vendor.city || '';
    const state = vendor.state || '';
    const pincode = vendor.pincode || '';
    const gstNumber = vendor.gstNumber || '';
    const panNumber = vendor.panNumber || '';
    const rating = vendor.rating || 5;
    const status = vendor.status || 'Active';
    const paymentTerms = vendor.paymentTerms || '';
    const bankDetailsJson = vendor.bankDetails ? JSON.stringify(vendor.bankDetails) : null;
    const notes = vendor.notes || '';
    const createdDate = vendor.createdDate || new Date().toISOString().split('T')[0];
    const updatedDate = new Date().toISOString().split('T')[0];

    await pool.request()
      .input('id', sql.NVarChar(100), id)
      .input('name', sql.NVarChar(255), name)
      .input('code', sql.NVarChar(50), code)
      .input('category', sql.NVarChar(sql.MAX), category)
      .input('contactPerson', sql.NVarChar(255), contactPerson)
      .input('email', sql.NVarChar(255), email)
      .input('phone', sql.NVarChar(50), phone)
      .input('address', sql.NVarChar(sql.MAX), address)
      .input('city', sql.NVarChar(100), city)
      .input('state', sql.NVarChar(100), state)
      .input('pincode', sql.NVarChar(20), pincode)
      .input('gstNumber', sql.NVarChar(100), gstNumber)
      .input('panNumber', sql.NVarChar(100), panNumber)
      .input('rating', sql.Int, rating)
      .input('status', sql.NVarChar(50), status)
      .input('paymentTerms', sql.NVarChar(100), paymentTerms)
      .input('bankDetailsJson', sql.NVarChar(sql.MAX), bankDetailsJson)
      .input('notes', sql.NVarChar(sql.MAX), notes)
      .input('createdDate', sql.NVarChar(50), createdDate)
      .input('updatedDate', sql.NVarChar(50), updatedDate)
      .query(`
        IF EXISTS (SELECT 1 FROM dbo.Vendors WHERE id = @id)
        BEGIN
          UPDATE dbo.Vendors SET
            name = @name, code = @code, category = @category, contactPerson = @contactPerson,
            email = @email, phone = @phone, address = @address, city = @city, state = @state,
            pincode = @pincode, gstNumber = @gstNumber, panNumber = @panNumber, rating = @rating,
            status = @status, paymentTerms = @paymentTerms, bankDetailsJson = @bankDetailsJson,
            notes = @notes, updatedDate = @updatedDate
          WHERE id = @id;
        END
        ELSE
        BEGIN
          INSERT INTO dbo.Vendors (
            id, name, code, category, contactPerson, email, phone, address, city, state,
            pincode, gstNumber, panNumber, rating, status, paymentTerms, bankDetailsJson, notes,
            createdDate, updatedDate
          ) VALUES (
            @id, @name, @code, @category, @contactPerson, @email, @phone, @address, @city, @state,
            @pincode, @gstNumber, @panNumber, @rating, @status, @paymentTerms, @bankDetailsJson, @notes,
            @createdDate, @updatedDate
          );
        END
      `);

    return true;
  } catch (err: any) {
    console.error('❌ Failed to save vendor to SQL Server:', err?.message || err);
    return false;
  }
}

/**
 * Deletes a vendor from dbo.Vendors by ID, Code, or Name
 */
export async function deleteVendorFromMSSQL(idOrCodeOrName: string): Promise<boolean> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) return false;

    await pool.request()
      .input('target', sql.NVarChar(255), idOrCodeOrName)
      .query(`
        DELETE FROM dbo.Vendors 
        WHERE id = @target OR code = @target OR name = @target
      `);

    console.log(`✅ Vendor [${idOrCodeOrName}] removed from SQL Server dbo.Vendors`);
    return true;
  } catch (err: any) {
    console.error('❌ Failed to delete vendor from SQL Server:', err?.message || err);
    return false;
  }
}

/**
 * Factory Reset / Complete Purge of dummy & operational data from SQL Server Express
 */
export async function purgeAllDataFromMSSQL(scope: 'operational' | 'complete' = 'operational'): Promise<{ success: boolean; message: string; tablesPurged: string[] }> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) {
      return { success: false, message: 'SQL Server Express is not connected.', tablesPurged: [] };
    }

    const tablesPurged: string[] = [];

    // Purge operational records in cascading order to respect foreign keys
    const operationalTables = [
      'RepairRecords',
      'AMCRecords',
      'AssetTransfers',
      'PhysicalVerifications',
      'Tickets',
      'DeletedAssets',
      'Assets',
      'Vendors'
    ];

    for (const tbl of operationalTables) {
      try {
        await pool.request().query(`
          IF OBJECT_ID('dbo.${tbl}', 'U') IS NOT NULL
          BEGIN
            DELETE FROM dbo.${tbl};
            IF OBJECTPROPERTY(OBJECT_ID('dbo.${tbl}'), 'TableHasIdentity') = 1
              DBCC CHECKIDENT ('dbo.${tbl}', RESEED, 0);
          END
        `);
        tablesPurged.push(`dbo.${tbl}`);
      } catch (err: any) {
        console.warn(`Warning while purging dbo.${tbl}:`, err?.message);
      }
    }

    if (scope === 'complete') {
      const structuralTables = [
        'Rooms',
        'Floors',
        'Buildings',
        'Campuses',
        'Departments',
        'Organizations'
      ];
      for (const tbl of structuralTables) {
        try {
          await pool.request().query(`
            IF OBJECT_ID('dbo.${tbl}', 'U') IS NOT NULL
            BEGIN
              DELETE FROM dbo.${tbl};
              IF OBJECTPROPERTY(OBJECT_ID('dbo.${tbl}'), 'TableHasIdentity') = 1
                DBCC CHECKIDENT ('dbo.${tbl}', RESEED, 0);
            END
          `);
          tablesPurged.push(`dbo.${tbl}`);
        } catch (err: any) {
          console.warn(`Warning while purging structural table dbo.${tbl}:`, err?.message);
        }
      }

      // Keep only Super Admin in Users table
      try {
        await pool.request().query(`
          IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL
            DELETE FROM dbo.Users WHERE role <> 'Super Admin';
        `);
        tablesPurged.push('dbo.Users (non-SuperAdmin)');
      } catch {}
    }

    // Reset audit logs with a fresh production baseline
    try {
      await pool.request().query(`
        IF OBJECT_ID('dbo.AuditLogs', 'U') IS NOT NULL
        BEGIN
          DELETE FROM dbo.AuditLogs;
          INSERT INTO dbo.AuditLogs (id, userId, userName, userRole, action, entityType, entityId, ipAddress, browser, timestamp)
          VALUES ('log-prod-1', 'usr-1', 'Super Admin', 'Super Admin', 'PRODUCTION_RESET', 'System', 'EAMS-PROD', '127.0.0.1', 'Local Server', GETDATE());
        END
      `);
      tablesPurged.push('dbo.AuditLogs');
    } catch {}

    const dbName = (pool as any).config?.database || getMSSQLConfig()?.database || 'EAMS_AssetDB';
    return {
      success: true,
      message: `Successfully purged all dummy & operational data from SQL Server Express [${dbName}]! Ready for clean production entries starting from #1.`,
      tablesPurged
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to purge data from SQL Server: ${err?.message || err}`,
      tablesPurged: []
    };
  }
}

/**
 * Deletes a repair record from dbo.RepairRecords
 */
export async function deleteRepairFromMSSQL(id: string): Promise<boolean> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) return false;

    await pool.request()
      .input('id', sql.NVarChar(100), id)
      .query('DELETE FROM dbo.RepairRecords WHERE id = @id');

    console.log(`✅ Repair [${id}] removed from SQL Server dbo.RepairRecords`);
    return true;
  } catch (err: any) {
    console.error('❌ Failed to delete repair record from SQL Server:', err?.message || err);
    return false;
  }
}

/**
 * Deletes an AMC record from dbo.AMCRecords
 */
export async function deleteAMCFromMSSQL(id: string): Promise<boolean> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) return false;

    await pool.request()
      .input('id', sql.NVarChar(100), id)
      .query('DELETE FROM dbo.AMCRecords WHERE id = @id');

    console.log(`✅ AMC [${id}] removed from SQL Server dbo.AMCRecords`);
    return true;
  } catch (err: any) {
    console.error('❌ Failed to delete AMC record from SQL Server:', err?.message || err);
    return false;
  }
}

/**
 * Deletes a ticket from dbo.Tickets
 */
export async function deleteTicketFromMSSQL(id: string): Promise<boolean> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) return false;

    await pool.request()
      .input('id', sql.NVarChar(100), id)
      .query('DELETE FROM dbo.Tickets WHERE id = @id');

    console.log(`✅ Ticket [${id}] removed from SQL Server dbo.Tickets`);
    return true;
  } catch (err: any) {
    console.error('❌ Failed to delete ticket from SQL Server:', err?.message || err);
    return false;
  }
}

/**
 * Deletes an asset transfer from dbo.AssetTransfers
 */
export async function deleteTransferFromMSSQL(id: string): Promise<boolean> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) return false;

    await pool.request()
      .input('id', sql.NVarChar(100), id)
      .query('DELETE FROM dbo.AssetTransfers WHERE id = @id');

    console.log(`✅ Transfer [${id}] removed from SQL Server dbo.AssetTransfers`);
    return true;
  } catch (err: any) {
    console.error('❌ Failed to delete transfer from SQL Server:', err?.message || err);
    return false;
  }
}

/**
 * Synchronize all entities currently in memory into SQL Server
 */
export async function syncAllDataToMSSQL(data: any): Promise<{
  success: boolean;
  message: string;
  count: number;
  breakdown: Record<string, number>;
}> {
  try {
    const pool = await getMSSQLPool();
    if (!pool) {
      const test = await testMSSQLConnection();
      return {
        success: false,
        message: test.message || 'SQL Server is not connected. Please click "Configure Connection" below to set your password.',
        count: 0,
        breakdown: {}
      };
    }

    clearTableColumnsCache();

    // Run non-destructive schema migrations first
    try {
      await initializeMSSQLSchema();
    } catch {}

    const breakdown: Record<string, number> = {
      organizations: 0,
      campuses: 0,
      buildings: 0,
      floors: 0,
      departments: 0,
      rooms: 0,
      categories: 0,
      subCategories: 0,
      vendors: 0,
      assets: 0
    };

    // 1. Sync Organizations
    if (Array.isArray(data.organizations)) {
      for (const org of data.organizations) {
        if (await saveOrganizationToMSSQL(org)) breakdown.organizations++;
      }
    }

    // 2. Sync Campuses
    if (Array.isArray(data.campuses)) {
      for (const cmp of data.campuses) {
        if (await saveCampusToMSSQL(cmp)) breakdown.campuses++;
      }
    }

    // 3. Sync Buildings
    if (Array.isArray(data.buildings)) {
      for (const bld of data.buildings) {
        if (await saveBuildingToMSSQL(bld)) breakdown.buildings++;
      }
    }

    // 4. Sync Floors
    if (Array.isArray(data.floors)) {
      for (const flr of data.floors) {
        if (await saveFloorToMSSQL(flr)) breakdown.floors++;
      }
    }

    // 5. Sync Departments
    if (Array.isArray(data.departments)) {
      for (const dept of data.departments) {
        if (await saveDepartmentToMSSQL(dept)) breakdown.departments++;
      }
    }

    // 6. Sync Rooms
    if (Array.isArray(data.rooms)) {
      for (const rm of data.rooms) {
        if (await saveRoomToMSSQL(rm)) breakdown.rooms++;
      }
    }

    // 7. Sync Categories
    if (Array.isArray(data.categories)) {
      for (const cat of data.categories) {
        if (await saveCategoryToMSSQL(cat)) breakdown.categories++;
      }
    }

    // 8. Sync SubCategories
    if (Array.isArray(data.subCategories)) {
      for (const sub of data.subCategories) {
        if (await saveSubCategoryToMSSQL(sub)) breakdown.subCategories++;
      }
    }

    // 9. Sync Vendors
    if (Array.isArray(data.vendors)) {
      for (const v of data.vendors) {
        if (await saveVendorToMSSQL(v)) breakdown.vendors++;
      }
    }

    // 10. Sync Assets
    if (Array.isArray(data.assets)) {
      for (const a of data.assets) {
        if (await saveAssetToMSSQL(a)) breakdown.assets++;
      }
    }

    const totalSynced = Object.values(breakdown).reduce((sum, n) => sum + n, 0);
    const dbName = (pool as any).config?.database || getMSSQLConfig()?.database || 'EAMS_AssetDB';
    return {
      success: true,
      message: `Successfully synchronized ${totalSynced} records (${breakdown.departments} Departments, ${breakdown.rooms} Rooms, ${breakdown.assets} Assets, ${breakdown.organizations} Orgs, ${breakdown.campuses} Campuses, ${breakdown.buildings} Buildings, ${breakdown.floors} Floors) to SQL Server [${dbName}]!`,
      count: breakdown.assets,
      breakdown
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Sync failed: ${err?.message || err}`,
      count: 0,
      breakdown: {}
    };
  }
}

