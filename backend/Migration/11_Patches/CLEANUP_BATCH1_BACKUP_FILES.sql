-- ============================================================================
-- DATABASE CLEANUP - BATCH 1: Remove Backup/Legacy Stored Procedures
-- ============================================================================
-- Date: January 22, 2026
-- Risk Level: LOW
-- Description: Removes backup and legacy stored procedure files that are 
--              superseded by newer versions
-- ============================================================================

-- IMPORTANT: These procedures should be dropped from the database if they exist
-- The migration files will be deleted from the repository

-- 1. Drop backup search procedure
IF OBJECT_ID('dbo.sp_SearchVendors_BACKUP', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_SearchVendors_BACKUP;
GO

-- 2. Drop optimized search procedure (superseded by vendors.sp_Search)
IF OBJECT_ID('dbo.sp_SearchVendors_Optimized', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_SearchVendors_Optimized;
GO

-- 3. Drop analytics search procedure (superseded by vendors.sp_Search)
IF OBJECT_ID('dbo.sp_SearchVendors_WithAnalytics', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_SearchVendors_WithAnalytics;
GO

-- Also check vendors schema
IF OBJECT_ID('vendors.sp_SearchVendors_BACKUP', 'P') IS NOT NULL
    DROP PROCEDURE vendors.sp_SearchVendors_BACKUP;
GO

IF OBJECT_ID('vendors.sp_SearchVendors_Optimized', 'P') IS NOT NULL
    DROP PROCEDURE vendors.sp_SearchVendors_Optimized;
GO

IF OBJECT_ID('vendors.sp_SearchVendors_WithAnalytics', 'P') IS NOT NULL
    DROP PROCEDURE vendors.sp_SearchVendors_WithAnalytics;
GO

PRINT 'Batch 1 cleanup completed - Backup/Legacy procedures removed';
GO

-- ============================================================================
-- FILES TO DELETE FROM MIGRATION FOLDER:
-- ============================================================================
-- 1. cu_600_090_sp_SearchVendors_BACKUP.sql
-- 2. cu_600_089b_sp_SearchVendors_Optimized.sql
-- 3. cu_600_089c_sp_SearchVendors_WithAnalytics.sql
-- ============================================================================
