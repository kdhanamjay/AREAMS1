-- ============================================================================
-- Enterprise Asset Management System (EAMS) - MySQL 8.0+ Database Script
-- Compatible with MySQL Server 8.0.45, MySQL Workbench, phpMyAdmin, DBeaver
-- Engine: InnoDB | Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ============================================================================

-- 1. Create Database
CREATE DATABASE IF NOT EXISTS `eams_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `eams_db`;

-- Disable Foreign Key checks during table setup
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- TABLE CREATION (DDL)
-- ============================================================================

-- 1. Organizations Table
DROP TABLE IF EXISTS `organizations`;
CREATE TABLE `organizations` (
    `id` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `shortCode` VARCHAR(50) NOT NULL,
    `logo` LONGTEXT NULL,
    `address` TEXT NULL,
    `gstNumber` VARCHAR(100) NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(50) NULL,
    `status` VARCHAR(50) DEFAULT 'Active',
    `createdDate` VARCHAR(50) NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Campuses Table
DROP TABLE IF EXISTS `campuses`;
CREATE TABLE `campuses` (
    `id` VARCHAR(100) NOT NULL,
    `organizationId` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `address` TEXT NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `status` VARCHAR(50) DEFAULT 'Active',
    PRIMARY KEY (`id`),
    INDEX `idx_campuses_org` (`organizationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Buildings Table
DROP TABLE IF EXISTS `buildings`;
CREATE TABLE `buildings` (
    `id` VARCHAR(100) NOT NULL,
    `campusId` VARCHAR(100) NOT NULL,
    `organizationId` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `floorsCount` INT DEFAULT 1,
    `status` VARCHAR(50) DEFAULT 'Active',
    PRIMARY KEY (`id`),
    INDEX `idx_buildings_campus` (`campusId`),
    INDEX `idx_buildings_org` (`organizationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Floors Table
DROP TABLE IF EXISTS `floors`;
CREATE TABLE `floors` (
    `id` VARCHAR(100) NOT NULL,
    `buildingId` VARCHAR(100) NOT NULL,
    `campusId` VARCHAR(100) NOT NULL,
    `organizationId` VARCHAR(100) NOT NULL,
    `floorName` VARCHAR(100) NOT NULL,
    `floorNumber` INT DEFAULT 0,
    PRIMARY KEY (`id`),
    INDEX `idx_floors_building` (`buildingId`),
    INDEX `idx_floors_campus` (`campusId`),
    INDEX `idx_floors_org` (`organizationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Rooms Table
DROP TABLE IF EXISTS `rooms`;
CREATE TABLE `rooms` (
    `id` VARCHAR(100) NOT NULL,
    `floorId` VARCHAR(100) NOT NULL,
    `buildingId` VARCHAR(100) NOT NULL,
    `campusId` VARCHAR(100) NOT NULL,
    `organizationId` VARCHAR(100) NOT NULL,
    `roomNumber` VARCHAR(100) NOT NULL,
    `roomName` VARCHAR(255) NOT NULL,
    `roomType` VARCHAR(100) NULL,
    `capacity` INT DEFAULT 0,
    `status` VARCHAR(50) DEFAULT 'Active',
    PRIMARY KEY (`id`),
    INDEX `idx_rooms_floor` (`floorId`),
    INDEX `idx_rooms_building` (`buildingId`),
    INDEX `idx_rooms_org` (`organizationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Departments Table
DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments` (
    `id` VARCHAR(100) NOT NULL,
    `organizationId` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `headOfDepartment` VARCHAR(255) NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(50) NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_departments_org` (`organizationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. AssetCategories Table
DROP TABLE IF EXISTS `asset_categories`;
CREATE TABLE `asset_categories` (
    `id` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(100) NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. AssetSubCategories Table
DROP TABLE IF EXISTS `asset_sub_categories`;
CREATE TABLE `asset_sub_categories` (
    `id` VARCHAR(100) NOT NULL,
    `categoryId` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_subcats_cat` (`categoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Assets Table
DROP TABLE IF EXISTS `assets`;
CREATE TABLE `assets` (
    `id` VARCHAR(100) NOT NULL,
    `assetTag` VARCHAR(100) NOT NULL,
    `serialNumber` VARCHAR(100) NULL,
    `name` VARCHAR(255) NOT NULL,
    `organizationId` VARCHAR(100) NOT NULL,
    `campusId` VARCHAR(100) NOT NULL,
    `buildingId` VARCHAR(100) NOT NULL,
    `floorId` VARCHAR(100) NOT NULL,
    `roomId` VARCHAR(100) NOT NULL,
    `departmentId` VARCHAR(100) NOT NULL,
    `categoryId` VARCHAR(100) NOT NULL,
    `subCategoryId` VARCHAR(100) NOT NULL,
    `model` VARCHAR(255) NULL,
    `brand` VARCHAR(255) NULL,
    `purchaseDate` VARCHAR(50) NULL,
    `purchaseCost` DECIMAL(18,2) DEFAULT 0.00,
    `vendorName` VARCHAR(255) NULL,
    `warrantyExpiry` VARCHAR(50) NULL,
    `amcExpiry` VARCHAR(50) NULL,
    `status` VARCHAR(50) DEFAULT 'In Use',
    `condition` VARCHAR(50) DEFAULT 'Good',
    `assignedTo` VARCHAR(255) NULL,
    `assignedEmail` VARCHAR(255) NULL,
    `qrCodeUrl` LONGTEXT NULL,
    `barcodeUrl` LONGTEXT NULL,
    `specificationsJson` JSON NULL,
    `notes` TEXT NULL,
    `lastVerifiedDate` VARCHAR(50) NULL,
    `lastVerifiedBy` VARCHAR(255) NULL,
    `createdDate` VARCHAR(50) NULL,
    `lastUpdated` VARCHAR(50) NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_assets_tag` (`assetTag`),
    INDEX `idx_assets_org` (`organizationId`),
    INDEX `idx_assets_room` (`roomId`),
    INDEX `idx_assets_dept` (`departmentId`),
    INDEX `idx_assets_cat` (`categoryId`),
    INDEX `idx_assets_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. DeletedAssets Table (Trash / Archive)
DROP TABLE IF EXISTS `deleted_assets`;
CREATE TABLE `deleted_assets` (
    `id` VARCHAR(100) NOT NULL,
    `assetTag` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `organizationId` VARCHAR(100) NOT NULL,
    `campusId` VARCHAR(100) NOT NULL,
    `buildingId` VARCHAR(100) NOT NULL,
    `roomId` VARCHAR(100) NOT NULL,
    `departmentId` VARCHAR(100) NOT NULL,
    `categoryId` VARCHAR(100) NOT NULL,
    `subCategoryId` VARCHAR(100) NOT NULL,
    `deletedBy` VARCHAR(255) NULL,
    `deletedByEmail` VARCHAR(255) NULL,
    `deletedDate` VARCHAR(50) NULL,
    `reason` TEXT NULL,
    `assetDataJson` JSON NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_deleted_org` (`organizationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. AssetTransfers Table
DROP TABLE IF EXISTS `asset_transfers`;
CREATE TABLE `asset_transfers` (
    `id` VARCHAR(100) NOT NULL,
    `assetId` VARCHAR(100) NOT NULL,
    `assetTag` VARCHAR(100) NOT NULL,
    `assetName` VARCHAR(255) NOT NULL,
    `fromOrgId` VARCHAR(100) NOT NULL,
    `fromCampusId` VARCHAR(100) NOT NULL,
    `fromBuildingId` VARCHAR(100) NOT NULL,
    `fromRoomId` VARCHAR(100) NOT NULL,
    `fromDeptId` VARCHAR(100) NOT NULL,
    `toOrgId` VARCHAR(100) NOT NULL,
    `toCampusId` VARCHAR(100) NOT NULL,
    `toBuildingId` VARCHAR(100) NOT NULL,
    `toRoomId` VARCHAR(100) NOT NULL,
    `toDeptId` VARCHAR(100) NOT NULL,
    `transferType` VARCHAR(50) NOT NULL,
    `requestedBy` VARCHAR(255) NOT NULL,
    `requestedByEmail` VARCHAR(255) NULL,
    `approvedBy` VARCHAR(255) NULL,
    `transferDate` VARCHAR(50) NOT NULL,
    `status` VARCHAR(50) DEFAULT 'Approved',
    `remarks` TEXT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_transfers_asset` (`assetId`),
    INDEX `idx_transfers_from_org` (`fromOrgId`),
    INDEX `idx_transfers_to_org` (`toOrgId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. PhysicalVerifications Table
DROP TABLE IF EXISTS `physical_verifications`;
CREATE TABLE `physical_verifications` (
    `id` VARCHAR(100) NOT NULL,
    `verificationBatchCode` VARCHAR(100) NOT NULL,
    `organizationId` VARCHAR(100) NOT NULL,
    `campusId` VARCHAR(100) NOT NULL,
    `buildingId` VARCHAR(100) NOT NULL,
    `roomId` VARCHAR(100) NOT NULL,
    `totalAssetsInRoom` INT DEFAULT 0,
    `verifiedAssetsCount` INT DEFAULT 0,
    `missingAssetsCount` INT DEFAULT 0,
    `discrepanciesCount` INT DEFAULT 0,
    `verifiedBy` VARCHAR(255) NOT NULL,
    `verificationDate` VARCHAR(50) NOT NULL,
    `status` VARCHAR(50) DEFAULT 'Completed',
    `notes` TEXT NULL,
    `auditDetailsJson` JSON NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_verif_org` (`organizationId`),
    INDEX `idx_verif_room` (`roomId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. RepairRecords Table
DROP TABLE IF EXISTS `repair_records`;
CREATE TABLE `repair_records` (
    `id` VARCHAR(100) NOT NULL,
    `assetId` VARCHAR(100) NOT NULL,
    `assetTag` VARCHAR(100) NOT NULL,
    `assetName` VARCHAR(255) NOT NULL,
    `organizationId` VARCHAR(100) NOT NULL,
    `issueDescription` TEXT NOT NULL,
    `reportedBy` VARCHAR(255) NOT NULL,
    `reportedDate` VARCHAR(50) NOT NULL,
    `assignedVendor` VARCHAR(255) NULL,
    `vendorContact` VARCHAR(100) NULL,
    `repairCost` DECIMAL(18,2) DEFAULT 0.00,
    `status` VARCHAR(50) DEFAULT 'In Progress',
    `startDate` VARCHAR(50) NULL,
    `completionDate` VARCHAR(50) NULL,
    `remarks` TEXT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_repairs_asset` (`assetId`),
    INDEX `idx_repairs_org` (`organizationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. AMCRecords Table
DROP TABLE IF EXISTS `amc_records`;
CREATE TABLE `amc_records` (
    `id` VARCHAR(100) NOT NULL,
    `organizationId` VARCHAR(100) NOT NULL,
    `contractNumber` VARCHAR(100) NOT NULL,
    `vendorName` VARCHAR(255) NOT NULL,
    `vendorContact` VARCHAR(100) NULL,
    `vendorEmail` VARCHAR(255) NULL,
    `contractType` VARCHAR(50) NOT NULL,
    `startDate` VARCHAR(50) NOT NULL,
    `endDate` VARCHAR(50) NOT NULL,
    `annualCost` DECIMAL(18,2) DEFAULT 0.00,
    `status` VARCHAR(50) DEFAULT 'Active',
    `coveredAssetsCount` INT DEFAULT 0,
    `assetIdsJson` JSON NULL,
    `terms` TEXT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_amc_org` (`organizationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. AuditLogs Table
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
    `id` VARCHAR(100) NOT NULL,
    `timestamp` VARCHAR(100) NOT NULL,
    `performedBy` VARCHAR(255) NOT NULL,
    `performedByRole` VARCHAR(100) NOT NULL,
    `organizationId` VARCHAR(100) NULL,
    `module` VARCHAR(100) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `details` TEXT NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_audit_org` (`organizationId`),
    INDEX `idx_audit_module` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Users Table
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `id` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `role` VARCHAR(100) NOT NULL,
    `organizationId` VARCHAR(100) NULL,
    `departmentId` VARCHAR(100) NULL,
    `phone` VARCHAR(50) NULL,
    `status` VARCHAR(50) DEFAULT 'Active',
    `avatar` LONGTEXT NULL,
    `allowedModulesJson` JSON NULL,
    `lastLogin` VARCHAR(50) NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_users_email` (`email`),
    INDEX `idx_users_role` (`role`),
    INDEX `idx_users_org` (`organizationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Tickets Table
DROP TABLE IF EXISTS `tickets`;
CREATE TABLE `tickets` (
    `id` VARCHAR(100) NOT NULL,
    `ticketNumber` VARCHAR(100) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `priority` VARCHAR(50) NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `assetId` VARCHAR(100) NULL,
    `assetTag` VARCHAR(100) NULL,
    `organizationId` VARCHAR(100) NOT NULL,
    `campusId` VARCHAR(100) NULL,
    `buildingId` VARCHAR(100) NULL,
    `roomId` VARCHAR(100) NULL,
    `reportedBy` VARCHAR(255) NOT NULL,
    `reportedByEmail` VARCHAR(255) NULL,
    `reportedDate` VARCHAR(50) NOT NULL,
    `targetResolutionDate` VARCHAR(50) NULL,
    `assignedTechnician` VARCHAR(255) NULL,
    `technicianPhone` VARCHAR(50) NULL,
    `commentsJson` JSON NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_tickets_number` (`ticketNumber`),
    INDEX `idx_tickets_org` (`organizationId`),
    INDEX `idx_tickets_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SEED DATA INSERTION (Initial Data)
-- ============================================================================

-- 1. Insert Organizations
INSERT INTO `organizations` (`id`, `name`, `shortCode`, `logo`, `address`, `gstNumber`, `email`, `phone`, `status`, `createdDate`) VALUES
('org-arvd', 'Amara Raja Vidyalayam - Diguvamagham', 'ARVD', 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=150&auto=format&fit=crop&q=80', 'Diguvamagham, Chittoor District, AP - 517129', '37AAAAA0000A1Z5', 'principal.arvd@amararaja.com', '+91 8572 273333', 'Active', '2023-01-10'),
('org-arvk', 'Amara Raja Vidyalayam - Karakambadi', 'ARVK', 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=150&auto=format&fit=crop&q=80', 'Karakambadi Road, Tirupati, AP - 517520', '37AAAAA0000A2Z4', 'principal.arvk@amararaja.com', '+91 877 2265300', 'Active', '2023-01-15'),
('org-mv', 'Mangal Vidyalayam', 'MV', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=150&auto=format&fit=crop&q=80', 'Petamitta, Chittoor District, AP - 517127', '37AAAAA0000A3Z3', 'principal.mv@amararaja.com', '+91 877 2265000', 'Active', '2023-03-01'),
('org-phc', 'Rajanna Trust Primary Health Center (PHC)', 'PHC', 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=150&auto=format&fit=crop&q=80', 'Diguvamagham, AP - 517129', '37AAAAA0000A4Z2', 'health.phc@amararaja.com', '+91 8572 273300', 'Active', '2023-03-15'),
('org-corp', 'Amara Raja Corporate Office', 'AR-CORP', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80', 'Renigunta Road, Tirupati, AP - 517520', '37AAAAA0000A5Z1', 'corporate@amararaja.com', '+91 877 2265001', 'Active', '2022-11-01'),
('org-factory', 'Amara Raja Batteries Gigafactory', 'AR-PLANT', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&auto=format&fit=crop&q=80', 'Karakambadi Industrial Area, Tirupati, AP', '37AAAAA0000A6Z0', 'plant.operations@amararaja.com', '+91 877 2265999', 'Active', '2022-10-15');

-- 2. Insert Campuses
INSERT INTO `campuses` (`id`, `organizationId`, `name`, `code`, `address`, `city`, `state`, `status`) VALUES
('cmp-dig', 'org-arvd', 'Diguvamagham Campus', 'DIG', 'Diguvamagham Village', 'Chittoor', 'Andhra Pradesh', 'Active'),
('cmp-peta', 'org-arvk', 'Petamitta Campus', 'PETA', 'Petamitta Cross Roads', 'Chittoor', 'Andhra Pradesh', 'Active'),
('cmp-karak', 'org-mv', 'Karakambadi Industrial Campus', 'KARAK', 'Karakambadi Road', 'Tirupati', 'Andhra Pradesh', 'Active'),
('cmp-tirupati', 'org-corp', 'Tirupati Central Campus', 'TPT', 'Renigunta Road', 'Tirupati', 'Andhra Pradesh', 'Active');

-- 3. Insert Buildings
INSERT INTO `buildings` (`id`, `campusId`, `organizationId`, `name`, `code`, `floorsCount`, `status`) VALUES
('bld-main-dig', 'cmp-dig', 'org-arvd', 'Dr. Ramachandra N Galla Academic Block', 'RNG-BLK', 3, 'Active'),
('bld-adm-dig', 'cmp-dig', 'org-arvd', 'Administrative & Examination Wing', 'ADM-WING', 2, 'Active'),
('bld-sci-peta', 'cmp-peta', 'org-arvk', 'C.V. Raman Science & Innovation Complex', 'CVR-SCI', 4, 'Active'),
('bld-corp-tpt', 'cmp-tirupati', 'org-corp', 'Tower A - Corporate Headquarters', 'TOWER-A', 5, 'Active');

-- 4. Insert Floors
INSERT INTO `floors` (`id`, `buildingId`, `campusId`, `organizationId`, `floorName`, `floorNumber`) VALUES
('flr-dig-g', 'bld-main-dig', 'cmp-dig', 'org-arvd', 'Ground Floor (Primary Section)', 0),
('flr-dig-1', 'bld-main-dig', 'cmp-dig', 'org-arvd', 'First Floor (High School & Labs)', 1),
('flr-dig-2', 'bld-main-dig', 'cmp-dig', 'org-arvd', 'Second Floor (Library & Auditorium)', 2),
('flr-adm-g', 'bld-adm-dig', 'cmp-dig', 'org-arvd', 'Admin Ground (Accounts & Exam Section)', 0),
('flr-corp-1', 'bld-corp-tpt', 'cmp-tirupati', 'org-corp', '1st Floor - Executive Suites', 1);

-- 5. Insert Rooms
INSERT INTO `rooms` (`id`, `floorId`, `buildingId`, `campusId`, `organizationId`, `roomNumber`, `roomName`, `roomType`, `capacity`, `status`) VALUES
('rm-101', 'flr-dig-1', 'bld-main-dig', 'cmp-dig', 'org-arvd', 'LAB-101', 'TCS Next-Gen Computer Lab', 'Lab', 60, 'Active'),
('rm-102', 'flr-dig-1', 'bld-main-dig', 'cmp-dig', 'org-arvd', 'SCI-102', 'Dr. APJ Abdul Kalam Physics Lab', 'Lab', 45, 'Active'),
('rm-201', 'flr-dig-2', 'bld-main-dig', 'cmp-dig', 'org-arvd', 'LIB-201', 'Central Digital Library & Resource Center', 'Library', 120, 'Active'),
('rm-adm-01', 'flr-adm-g', 'bld-adm-dig', 'cmp-dig', 'org-arvd', 'EXAM-01', 'Confidential Examination Cell & Server Room', 'Office', 15, 'Active'),
('rm-corp-101', 'flr-corp-1', 'bld-corp-tpt', 'cmp-tirupati', 'org-corp', 'BOARD-01', 'Main Board Room', 'Conference', 35, 'Active');

-- 6. Insert Departments
INSERT INTO `departments` (`id`, `organizationId`, `name`, `code`, `headOfDepartment`, `email`, `phone`) VALUES
('dept-it', 'org-arvd', 'Information Technology & Systems', 'ITS', 'Mr. S. Rajesh Kumar', 'it.systems@amararaja.com', '+91 8572 273341'),
('dept-sci', 'org-arvd', 'Science & Innovation Section', 'SCI', 'Dr. P. V. Lakshmi', 'science.dept@amararaja.com', '+91 8572 273342'),
('dept-exam', 'org-arvd', 'Controller of Examinations', 'EXAM', 'Mr. K. V. Ramanamurthy', 'arvdexamsection@gmail.com', '+91 8572 273340'),
('dept-admin', 'org-arvd', 'General Administration & Facilities', 'ADMIN', 'Mr. B. Suresh Babu', 'admin.facilities@amararaja.com', '+91 8572 273344');

-- 7. Insert Asset Categories
INSERT INTO `asset_categories` (`id`, `name`, `code`, `description`, `icon`) VALUES
('cat-it', 'IT & Computing Infrastructure', 'IT', 'Servers, Workstations, Laptops, Printers & Peripherals', 'Laptop'),
('cat-lab', 'Scientific & Laboratory Equipment', 'LAB', 'Physics, Chemistry, Biology & STEM Kits', 'FlaskConical'),
('cat-av', 'Audio-Visual & Smart Classroom', 'AV', 'Interactive Flat Panels, Projectors, Speakers', 'Tv'),
('cat-fur', 'Institutional Furniture', 'FUR', 'Ergonomic Desks, Executive Chairs, Lab Benches', 'Armchair'),
('cat-elec', 'Electrical & Power Backup', 'ELEC', 'Online UPS Systems, Generators, Solar Panels', 'Zap'),
('cat-veh', 'Transportation & Fleet', 'VEH', 'School Buses, Vans, Service Ambulances', 'Bus');

-- 8. Insert Asset SubCategories
INSERT INTO `asset_sub_categories` (`id`, `categoryId`, `name`, `code`, `description`) VALUES
('sub-desk', 'cat-it', 'Desktop Computers & Workstations', 'DESK', 'All-in-One and Tower Workstations'),
('sub-lap', 'cat-it', 'Laptops & Mobile Workstations', 'LAP', 'Faculty & Executive Laptops'),
('sub-srv', 'cat-it', 'Rack Servers & Storage NAS', 'SRV', 'Enterprise Data Center Units'),
('sub-ifp', 'cat-av', 'Interactive Flat Panels 75"', 'IFP', 'Touchscreen Smart Boards'),
('sub-ups', 'cat-elec', 'Online Heavy UPS 10kVA+', 'UPS', 'Industrial Power Backups');

-- 9. Insert Sample Assets
INSERT INTO `assets` (`id`, `assetTag`, `serialNumber`, `name`, `organizationId`, `campusId`, `buildingId`, `floorId`, `roomId`, `departmentId`, `categoryId`, `subCategoryId`, `model`, `brand`, `purchaseDate`, `purchaseCost`, `vendorName`, `warrantyExpiry`, `amcExpiry`, `status`, `condition`, `assignedTo`, `assignedEmail`, `qrCodeUrl`, `barcodeUrl`, `specificationsJson`, `notes`, `lastVerifiedDate`, `lastVerifiedBy`, `createdDate`, `lastUpdated`) VALUES
('ast-1001', 'ARVD-IT-2024-001', 'MXL23984DF', 'Dell OptiPlex 7000 Tower Core i7 Workstation', 'org-arvd', 'cmp-dig', 'bld-main-dig', 'flr-dig-1', 'rm-101', 'dept-it', 'cat-it', 'sub-desk', 'OptiPlex 7000', 'Dell', '2024-02-15', 78500.00, 'Wipro Infotech Ltd', '2027-02-14', '2028-02-14', 'In Use', 'Good', 'Exam Admin', 'arvdexamsection@gmail.com', '', '', '{"Processor": "Intel Core i7 13th Gen", "RAM": "32GB DDR5", "Storage": "1TB NVMe SSD"}', 'High-priority examination processing workstation.', '2026-08-01', 'S. Rajesh Kumar', '2024-02-15', '2026-08-01'),
('ast-1002', 'ARVD-AV-2024-042', 'SN-BENQ-88219', 'BenQ 75" 4K Interactive Flat Display Panel', 'org-arvd', 'cmp-dig', 'bld-main-dig', 'flr-dig-1', 'rm-101', 'dept-it', 'cat-av', 'sub-ifp', 'RP7502 4K', 'BenQ', '2024-01-20', 165000.00, 'Cyber Systems Tirupati', '2027-01-19', '2028-01-19', 'In Use', 'Good', 'Lab Assistant', 'lab.tech@amararaja.com', '', '', '{"ScreenSize": "75 inch 4K", "TouchPoints": "20-point multi-touch"}', 'Installed on front wall with heavy mount.', '2026-08-01', 'S. Rajesh Kumar', '2024-01-20', '2026-08-01'),
('ast-1003', 'ARVD-ELEC-2023-012', 'APC-SRV-9923', 'APC Smart-UPS On-Line 10kVA 230V', 'org-arvd', 'cmp-dig', 'bld-adm-dig', 'flr-adm-g', 'rm-adm-01', 'dept-it', 'cat-elec', 'sub-ups', 'SURT10000XLI', 'Schneider APC', '2023-06-10', 245000.00, 'PowerTech Solutions', '2026-06-09', '2027-06-09', 'In Use', 'Good', 'Facilities Manager', 'admin.facilities@amararaja.com', '', '', '{"Capacity": "10kVA / 10kW", "BatteryType": "VRLA Extended Rack"}', 'Protects examination servers and network backbone.', '2026-07-28', 'B. Suresh Babu', '2023-06-10', '2026-07-28');

-- 10. Insert Users
INSERT INTO `users` (`id`, `name`, `email`, `role`, `organizationId`, `departmentId`, `phone`, `status`, `avatar`, `allowedModulesJson`, `lastLogin`) VALUES
('usr-super', 'Super Administrator', 'superadmin@amararaja.com', 'Super Admin', NULL, NULL, '+91 9988776655', 'Active', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', '["dashboard", "assets", "infrastructure", "transfers", "verification", "repairs", "amc", "reports", "users", "tickets", "trash", "audit"]', '2026-08-25 08:30:00'),
('usr-arvd-admin', 'Exam Controller (ARVD)', 'arvdexamsection@gmail.com', 'Admin', 'org-arvd', 'dept-exam', '+91 8572 273340', 'Active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', '["dashboard", "assets", "infrastructure", "transfers", "verification", "repairs", "amc", "reports", "users", "tickets", "trash", "audit"]', '2026-08-25 08:45:00'),
('usr-arvd-mgr', 'Rajesh Kumar (IT Head)', 'it.systems@amararaja.com', 'Manager', 'org-arvd', 'dept-it', '+91 8572 273341', 'Active', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', '["dashboard", "assets", "infrastructure", "transfers", "verification", "repairs", "amc", "reports", "tickets"]', '2026-08-24 16:15:00'),
('usr-arvd-auditor', 'Lakshmi P.V. (Internal Auditor)', 'science.dept@amararaja.com', 'Auditor', 'org-arvd', 'dept-sci', '+91 8572 273342', 'Active', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', '["dashboard", "assets", "verification", "reports", "audit"]', '2026-08-24 14:00:00');

-- 11. Insert Sample Ticket
INSERT INTO `tickets` (`id`, `ticketNumber`, `title`, `description`, `category`, `priority`, `status`, `assetId`, `assetTag`, `organizationId`, `campusId`, `buildingId`, `roomId`, `reportedBy`, `reportedByEmail`, `reportedDate`, `targetResolutionDate`, `assignedTechnician`, `technicianPhone`, `commentsJson`) VALUES
('tkt-101', 'TKT-2026-001', 'Annual Examination Workstation Calibration & RAM Upgrade', 'Schedule hardware diagnostic and thermal paste reapplication before upcoming semester exams.', 'Maintenance', 'Medium', 'Open', 'ast-1001', 'ARVD-IT-2024-001', 'org-arvd', 'cmp-dig', 'bld-main-dig', 'rm-101', 'Exam Controller', 'arvdexamsection@gmail.com', '2026-08-20', '2026-08-30', 'K. Venkat (Dell Certified)', '+91 94401 22334', '[]');

-- 12. Insert Sample Audit Log
INSERT INTO `audit_logs` (`id`, `timestamp`, `performedBy`, `performedByRole`, `organizationId`, `module`, `action`, `details`) VALUES
('log-101', '2026-08-25 08:30:00', 'Super Administrator', 'Super Admin', 'org-arvd', 'Database', 'INIT_MYSQL', 'MySQL 8.0.45 Enterprise Database Schema and Tables Initialized.');

-- Re-enable Foreign Key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
SELECT 'MySQL 8.0.45 Schema and Sample Data Created Successfully!' AS `Status`,
       (SELECT COUNT(*) FROM `organizations`) AS `Total Organizations`,
       (SELECT COUNT(*) FROM `assets`) AS `Total Assets`,
       (SELECT COUNT(*) FROM `users`) AS `Total Users`;
