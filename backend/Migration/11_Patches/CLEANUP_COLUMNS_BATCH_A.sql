-- ============================================================================
-- DATABASE CLEANUP - COLUMN REMOVAL BATCH A: Completely Unused Columns
-- ============================================================================
-- Date: January 22, 2026
-- Risk Level: LOW
-- Description: Removes columns that have ZERO references in both API routes
--              and stored procedures
-- ============================================================================

SET NOCOUNT ON;
GO

PRINT '=== Starting Column Cleanup Batch A ===';
GO

-- ============================================================================
-- VENDORS.VENDORPROFILES - Remove unused SetupStep columns
-- ============================================================================

PRINT 'Removing unused SetupStep columns from vendors.VendorProfiles...';
GO

-- SetupStep1Completed (0 API refs, 0 SP refs)
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('vendors.VendorProfiles') AND name = 'SetupStep1Completed')
BEGIN
    ALTER TABLE vendors.VendorProfiles DROP COLUMN SetupStep1Completed;
    PRINT '  - Dropped SetupStep1Completed';
END
GO

-- SetupStep2Completed (0 API refs, 0 SP refs)
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('vendors.VendorProfiles') AND name = 'SetupStep2Completed')
BEGIN
    ALTER TABLE vendors.VendorProfiles DROP COLUMN SetupStep2Completed;
    PRINT '  - Dropped SetupStep2Completed';
END
GO

-- SetupStep3Completed (0 API refs, 0 SP refs)
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('vendors.VendorProfiles') AND name = 'SetupStep3Completed')
BEGIN
    ALTER TABLE vendors.VendorProfiles DROP COLUMN SetupStep3Completed;
    PRINT '  - Dropped SetupStep3Completed';
END
GO

-- SetupStep5Completed (0 API refs, 0 SP refs)
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('vendors.VendorProfiles') AND name = 'SetupStep5Completed')
BEGIN
    ALTER TABLE vendors.VendorProfiles DROP COLUMN SetupStep5Completed;
    PRINT '  - Dropped SetupStep5Completed';
END
GO

-- SetupStep10Completed (0 API refs, 0 SP refs)
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('vendors.VendorProfiles') AND name = 'SetupStep10Completed')
BEGIN
    ALTER TABLE vendors.VendorProfiles DROP COLUMN SetupStep10Completed;
    PRINT '  - Dropped SetupStep10Completed';
END
GO

-- ============================================================================
-- USERS.USERS - Remove unused email unsubscribe columns
-- ============================================================================

PRINT 'Removing unused email unsubscribe columns from users.Users...';
GO

-- UnsubscribedAt (0 API refs, 0 SP refs)
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('users.Users') AND name = 'UnsubscribedAt')
BEGIN
    ALTER TABLE users.Users DROP COLUMN UnsubscribedAt;
    PRINT '  - Dropped UnsubscribedAt';
END
GO

-- UnsubscribedFromAll (0 API refs, 0 SP refs) - Need to drop default constraint first
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('users.Users') AND name = 'UnsubscribedFromAll')
BEGIN
    -- Drop default constraint if exists
    DECLARE @constraintName NVARCHAR(200);
    SELECT @constraintName = dc.name 
    FROM sys.default_constraints dc
    JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE c.object_id = OBJECT_ID('users.Users') AND c.name = 'UnsubscribedFromAll';
    
    IF @constraintName IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE users.Users DROP CONSTRAINT ' + @constraintName);
        PRINT '  - Dropped constraint ' + @constraintName;
    END
    
    ALTER TABLE users.Users DROP COLUMN UnsubscribedFromAll;
    PRINT '  - Dropped UnsubscribedFromAll';
END
GO

-- ============================================================================
PRINT '=== Column Cleanup Batch A Complete ===';
PRINT 'Removed 7 unused columns';
GO
