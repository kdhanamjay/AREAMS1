-- ============================================================================
-- Enterprise Asset Management System (EAMS) - SQL Server Express Schema (mssql)
-- Compatible with Microsoft SQL Server Express 2016, 2019, 2022+
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'EAMS_DB')
BEGIN
    CREATE DATABASE EAMS_DB;
END;
GO

USE EAMS_DB;
GO

-- 1. Organizations Table
IF OBJECT_ID('dbo.Organizations', 'U') IS NULL
BEGIN
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
END;
GO

-- 2. Campuses Table
IF OBJECT_ID('dbo.Campuses', 'U') IS NULL
BEGIN
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
END;
GO

-- 3. Buildings Table
IF OBJECT_ID('dbo.Buildings', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Buildings (
        id NVARCHAR(100) PRIMARY KEY,
        campusId NVARCHAR(100) NOT NULL,
        organizationId NVARCHAR(100) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        code NVARCHAR(50) NOT NULL,
        floorsCount INT DEFAULT 1,
        status NVARCHAR(50) DEFAULT 'Active'
    );
END;
GO

-- 4. Floors Table
IF OBJECT_ID('dbo.Floors', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Floors (
        id NVARCHAR(100) PRIMARY KEY,
        buildingId NVARCHAR(100) NOT NULL,
        campusId NVARCHAR(100) NOT NULL,
        organizationId NVARCHAR(100) NOT NULL,
        floorName NVARCHAR(100) NOT NULL,
        floorNumber INT DEFAULT 0
    );
END;
GO

-- 5. Rooms Table
IF OBJECT_ID('dbo.Rooms', 'U') IS NULL
BEGIN
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
END;
GO

-- 6. Departments Table
IF OBJECT_ID('dbo.Departments', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Departments (
        id NVARCHAR(100) PRIMARY KEY,
        organizationId NVARCHAR(100) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        code NVARCHAR(50) NOT NULL,
        headOfDepartment NVARCHAR(255) NULL,
        email NVARCHAR(255) NULL,
        phone NVARCHAR(50) NULL
    );
END;
GO

-- 7. AssetCategories Table
IF OBJECT_ID('dbo.AssetCategories', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AssetCategories (
        id NVARCHAR(100) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        code NVARCHAR(50) NOT NULL,
        description NVARCHAR(MAX) NULL,
        icon NVARCHAR(100) NULL
    );
END;
GO

-- 8. AssetSubCategories Table
IF OBJECT_ID('dbo.AssetSubCategories', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AssetSubCategories (
        id NVARCHAR(100) PRIMARY KEY,
        categoryId NVARCHAR(100) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        code NVARCHAR(50) NOT NULL,
        description NVARCHAR(MAX) NULL
    );
END;
GO

-- 9. Assets Table
IF OBJECT_ID('dbo.Assets', 'U') IS NULL
BEGIN
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
END;
GO

-- 10. DeletedAssets Table
IF OBJECT_ID('dbo.DeletedAssets', 'U') IS NULL
BEGIN
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
END;
GO

-- 11. AssetTransfers Table
IF OBJECT_ID('dbo.AssetTransfers', 'U') IS NULL
BEGIN
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
END;
GO

-- 12. PhysicalVerifications Table
IF OBJECT_ID('dbo.PhysicalVerifications', 'U') IS NULL
BEGIN
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
END;
GO

-- 13. RepairRecords Table
IF OBJECT_ID('dbo.RepairRecords', 'U') IS NULL
BEGIN
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
END;
GO

-- 14. AMCRecords Table
IF OBJECT_ID('dbo.AMCRecords', 'U') IS NULL
BEGIN
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
END;
GO

-- 15. AuditLogs Table
IF OBJECT_ID('dbo.AuditLogs', 'U') IS NULL
BEGIN
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
END;
GO

-- 16. Users Table
IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        id NVARCHAR(100) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL UNIQUE,
        role NVARCHAR(100) NOT NULL,
        organizationId NVARCHAR(100) NULL,
        departmentId NVARCHAR(100) NULL,
        phone NVARCHAR(50) NULL,
        status NVARCHAR(50) DEFAULT 'Active',
        avatar NVARCHAR(MAX) NULL,
        allowedModulesJson NVARCHAR(MAX) NULL,
        lastLogin NVARCHAR(50) NULL
    );
END;
GO

-- 17. Tickets Table
IF OBJECT_ID('dbo.Tickets', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tickets (
        id NVARCHAR(100) PRIMARY KEY,
        ticketNumber NVARCHAR(100) NOT NULL UNIQUE,
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
END;
GO

-- 18. Ensure backward-compatibility columns exist on dbo.Assets
IF COL_LENGTH('dbo.Assets', 'campusName') IS NULL
    ALTER TABLE dbo.Assets ADD campusName NVARCHAR(255) NULL;
IF COL_LENGTH('dbo.Assets', 'category') IS NULL
    ALTER TABLE dbo.Assets ADD category NVARCHAR(255) NULL;
IF COL_LENGTH('dbo.Assets', 'assetStatus') IS NULL
    ALTER TABLE dbo.Assets ADD assetStatus NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.Assets', 'particulars') IS NULL
    ALTER TABLE dbo.Assets ADD particulars NVARCHAR(255) NULL;
GO

-- 19. View: dbo.vw_Assets (Universal Asset Master View with all friendly alias columns)
IF OBJECT_ID('dbo.vw_Assets', 'V') IS NOT NULL DROP VIEW dbo.vw_Assets;
GO
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
    a.model,
    a.brand,
    a.brand AS manufacturer,
    a.serialNumber,
    a.serialNumber AS assetSerialNumber,
    a.purchaseDate,
    a.purchaseCost,
    v.name AS vendorName,
    a.warrantyExpiry,
    a.amcExpiry,
    a.assignedTo,
    a.assignedTo AS assignedEmployee,
    a.assignedEmail,
    a.barcodeUrl AS barcode,
    a.qrCodeUrl AS qrCode,
    a.specificationsJson,
    a.notes,
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
GO

