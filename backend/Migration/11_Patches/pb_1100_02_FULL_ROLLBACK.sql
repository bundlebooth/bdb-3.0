/*
    FULL ROLLBACK SCRIPT - All Session Changes
    Description: Rolls back ALL database changes from this session
    
    Order of rollback (reverse of deployment):
    1. Delete seed data (Subcategories, Cultures, EventTypes)
    2. Drop stored procedures
    3. Drop new tables (junction tables first, then lookup tables)
    4. Drop columns from existing tables
*/

SET NOCOUNT ON;
GO

PRINT '========================================';
PRINT '=== FULL ROLLBACK SCRIPT STARTING ===';
PRINT '========================================';
GO

-- =============================================
-- PHASE 1: DELETE SEED DATA
-- =============================================
PRINT '';
PRINT '=== PHASE 1: Delete Seed Data ===';
GO

-- Clear junction table data first (FK constraints)
DELETE FROM [vendors].[VendorSubcategories];
DELETE FROM [vendors].[VendorCultures];
DELETE FROM [vendors].[VendorEventTypes];
PRINT 'Cleared junction table data.';
GO

-- Clear lookup table data
DELETE FROM [vendors].[Subcategories];
DELETE FROM [vendors].[Cultures];
DELETE FROM [vendors].[EventTypes];
PRINT 'Cleared lookup table data.';
GO

-- =============================================
-- PHASE 2: DROP STORED PROCEDURES
-- =============================================
PRINT '';
PRINT '=== PHASE 2: Drop Stored Procedures ===';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetEventTypes]'))
    DROP PROCEDURE [vendors].[sp_GetEventTypes];
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetCultures]'))
    DROP PROCEDURE [vendors].[sp_GetCultures];
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetSubcategories]'))
    DROP PROCEDURE [vendors].[sp_GetSubcategories];
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Vendor_UpdateBookingSettings]'))
    DROP PROCEDURE [vendors].[sp_Vendor_UpdateBookingSettings];
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Vendor_UpdateAttributes]'))
    DROP PROCEDURE [vendors].[sp_Vendor_UpdateAttributes];
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Vendor_UpdateEventTypes]'))
    DROP PROCEDURE [vendors].[sp_Vendor_UpdateEventTypes];
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Vendor_UpdateCultures]'))
    DROP PROCEDURE [vendors].[sp_Vendor_UpdateCultures];
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Vendor_UpdateSubcategories]'))
    DROP PROCEDURE [vendors].[sp_Vendor_UpdateSubcategories];
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Vendor_GetAttributes]'))
    DROP PROCEDURE [vendors].[sp_Vendor_GetAttributes];
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetFilterableQuestions]'))
    DROP PROCEDURE [vendors].[sp_GetFilterableQuestions];
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetFilterableQuestionsByCategory]'))
    DROP PROCEDURE [vendors].[sp_GetFilterableQuestionsByCategory];
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Admin_ManageEventType]'))
    DROP PROCEDURE [vendors].[sp_Admin_ManageEventType];
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Admin_ManageCulture]'))
    DROP PROCEDURE [vendors].[sp_Admin_ManageCulture];
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetVendorProfileWithAttributes]'))
    DROP PROCEDURE [vendors].[sp_GetVendorProfileWithAttributes];
GO

PRINT 'Dropped stored procedures.';
GO

-- =============================================
-- PHASE 3: DROP NEW TABLES
-- =============================================
PRINT '';
PRINT '=== PHASE 3: Drop New Tables ===';
GO

-- Drop junction tables first (they have FK references)
IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[VendorSubcategories]') AND type in (N'U'))
    DROP TABLE [vendors].[VendorSubcategories];
IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[VendorCultures]') AND type in (N'U'))
    DROP TABLE [vendors].[VendorCultures];
IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[VendorEventTypes]') AND type in (N'U'))
    DROP TABLE [vendors].[VendorEventTypes];
GO

-- Drop lookup tables
IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[Subcategories]') AND type in (N'U'))
    DROP TABLE [vendors].[Subcategories];
IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[Cultures]') AND type in (N'U'))
    DROP TABLE [vendors].[Cultures];
IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[EventTypes]') AND type in (N'U'))
    DROP TABLE [vendors].[EventTypes];
GO

PRINT 'Dropped new tables.';
GO

-- =============================================
-- PHASE 4: DROP COLUMNS FROM EXISTING TABLES
-- =============================================
PRINT '';
PRINT '=== PHASE 4: Drop Columns from Existing Tables ===';
GO

-- Drop CategoryQuestions columns
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[CategoryQuestions]') AND name = 'CategoryID')
    ALTER TABLE [vendors].[CategoryQuestions] DROP COLUMN [CategoryID];
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[CategoryQuestions]') AND name = 'FilterLabel')
    ALTER TABLE [vendors].[CategoryQuestions] DROP COLUMN [FilterLabel];
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[CategoryQuestions]') AND name = 'FilterGroup')
    ALTER TABLE [vendors].[CategoryQuestions] DROP COLUMN [FilterGroup];
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[CategoryQuestions]') AND name = 'FilterType')
    ALTER TABLE [vendors].[CategoryQuestions] DROP COLUMN [FilterType];
GO

-- Drop IsFilterable with its default constraint
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[CategoryQuestions]') AND name = 'IsFilterable')
BEGIN
    DECLARE @ConstraintName1 NVARCHAR(200);
    SELECT @ConstraintName1 = dc.name
    FROM sys.default_constraints dc
    JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE dc.parent_object_id = OBJECT_ID(N'[vendors].[CategoryQuestions]') AND c.name = 'IsFilterable';
    IF @ConstraintName1 IS NOT NULL
        EXEC('ALTER TABLE [vendors].[CategoryQuestions] DROP CONSTRAINT ' + @ConstraintName1);
    ALTER TABLE [vendors].[CategoryQuestions] DROP COLUMN [IsFilterable];
END
GO

-- Drop VendorProfiles columns with their default constraints
DECLARE @sql NVARCHAR(MAX);
DECLARE @colName NVARCHAR(100);
DECLARE @constraintName NVARCHAR(200);

-- List of columns to drop from VendorProfiles
DECLARE @columns TABLE (ColName NVARCHAR(100));
INSERT INTO @columns VALUES 
    ('MinBookingHours'), ('AdvanceNoticeHours'), ('MaxCapacity'), ('OffersHourlyRates'),
    ('InstantBookingEnabled'), ('MinBookingLeadTimeHours'), ('ServiceLocationScope'), ('YearsOfExperienceRange');

DECLARE col_cursor CURSOR FOR SELECT ColName FROM @columns;
OPEN col_cursor;
FETCH NEXT FROM col_cursor INTO @colName;

WHILE @@FETCH_STATUS = 0
BEGIN
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND name = @colName)
    BEGIN
        -- Drop default constraint if exists
        SELECT @constraintName = dc.name
        FROM sys.default_constraints dc
        JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
        WHERE dc.parent_object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND c.name = @colName;
        
        IF @constraintName IS NOT NULL
        BEGIN
            SET @sql = 'ALTER TABLE [vendors].[VendorProfiles] DROP CONSTRAINT ' + @constraintName;
            EXEC sp_executesql @sql;
        END
        
        -- Drop column
        SET @sql = 'ALTER TABLE [vendors].[VendorProfiles] DROP COLUMN [' + @colName + ']';
        EXEC sp_executesql @sql;
    END
    
    FETCH NEXT FROM col_cursor INTO @colName;
END

CLOSE col_cursor;
DEALLOCATE col_cursor;
GO

PRINT 'Dropped columns from existing tables.';
GO

PRINT '';
PRINT '========================================';
PRINT '=== FULL ROLLBACK COMPLETE ===';
PRINT '========================================';
GO
