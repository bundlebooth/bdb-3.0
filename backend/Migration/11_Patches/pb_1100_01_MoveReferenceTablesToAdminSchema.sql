/*
    Migration Script: Move Reference Tables to Admin Schema
    Phase: 1100 - Patches
    Script: pb_1100_01_MoveReferenceTablesToAdminSchema.sql
    Description: Migrates reference/lookup tables from vendors/users schema to admin schema
    
    This script handles existing databases by:
    1. Creating new tables in admin schema
    2. Copying data from old tables
    3. Updating foreign key references
    4. Dropping old tables
    
    Tables affected:
    - [vendors].[EventTypes] -> [admin].[EventTypes]
    - [vendors].[Cultures] -> [admin].[Cultures]
    - [vendors].[Subcategories] -> [admin].[Subcategories]
    - [vendors].[CategoryQuestions] -> [admin].[CategoryQuestions]
    - [users].[InterestOptions] -> [admin].[InterestOptions]
*/

SET NOCOUNT ON;
GO

PRINT '==============================================';
PRINT 'Starting migration of reference tables to admin schema...';
PRINT '==============================================';
GO

-- =============================================
-- STEP 1: Create new tables in admin schema (if they don't exist)
-- =============================================

-- EventTypes
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[EventTypes]') AND type in (N'U'))
BEGIN
    CREATE TABLE [admin].[EventTypes](
        [EventTypeID] [int] IDENTITY(1,1) NOT NULL,
        [EventTypeKey] [nvarchar](50) NOT NULL,
        [EventTypeName] [nvarchar](100) NOT NULL,
        [DisplayOrder] [int] NOT NULL DEFAULT 0,
        [IsActive] [bit] NOT NULL DEFAULT 1,
        [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    PRIMARY KEY CLUSTERED ([EventTypeID] ASC),
    CONSTRAINT [UQ_Admin_EventTypes_Key] UNIQUE NONCLUSTERED ([EventTypeKey])
    );
    PRINT 'Created [admin].[EventTypes] table.';
END
GO

-- Cultures
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[Cultures]') AND type in (N'U'))
BEGIN
    CREATE TABLE [admin].[Cultures](
        [CultureID] [int] IDENTITY(1,1) NOT NULL,
        [CultureKey] [nvarchar](50) NOT NULL,
        [CultureName] [nvarchar](100) NOT NULL,
        [DisplayOrder] [int] NOT NULL DEFAULT 0,
        [IsActive] [bit] NOT NULL DEFAULT 1,
        [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    PRIMARY KEY CLUSTERED ([CultureID] ASC),
    CONSTRAINT [UQ_Admin_Cultures_Key] UNIQUE NONCLUSTERED ([CultureKey])
    );
    PRINT 'Created [admin].[Cultures] table.';
END
GO

-- Subcategories
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[Subcategories]') AND type in (N'U'))
BEGIN
    CREATE TABLE [admin].[Subcategories](
        [SubcategoryID] [int] IDENTITY(1,1) NOT NULL,
        [Category] [nvarchar](50) NOT NULL,
        [SubcategoryKey] [nvarchar](50) NOT NULL,
        [SubcategoryName] [nvarchar](100) NOT NULL,
        [Description] [nvarchar](500) NULL,
        [DisplayOrder] [int] NOT NULL DEFAULT 0,
        [IsActive] [bit] NOT NULL DEFAULT 1,
        [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    PRIMARY KEY CLUSTERED ([SubcategoryID] ASC),
    CONSTRAINT [UQ_Admin_Subcategories_CategoryKey] UNIQUE NONCLUSTERED ([Category], [SubcategoryKey])
    );
    PRINT 'Created [admin].[Subcategories] table.';
END
GO

-- CategoryQuestions
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[CategoryQuestions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [admin].[CategoryQuestions](
        [QuestionID] [int] IDENTITY(1,1) NOT NULL,
        [Category] [nvarchar](50) NOT NULL,
        [QuestionText] [nvarchar](500) NOT NULL,
        [QuestionType] [nvarchar](20) NOT NULL,
        [Options] [nvarchar](max) NULL,
        [IsRequired] [bit] NOT NULL,
        [DisplayOrder] [int] NOT NULL,
        [IsActive] [bit] NOT NULL,
        [CreatedAt] [datetime2](7) NOT NULL,
        [UpdatedAt] [datetime2](7) NOT NULL,
        [IsFilterable] [bit] NOT NULL DEFAULT 0,
        [HelpText] [nvarchar](500) NULL,
        [AnswerDisplayType] [nvarchar](20) NULL DEFAULT 'text',
    PRIMARY KEY CLUSTERED ([QuestionID] ASC)
    );
    PRINT 'Created [admin].[CategoryQuestions] table.';
END
GO

-- InterestOptions
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[InterestOptions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [admin].[InterestOptions](
        [InterestOptionID] INT IDENTITY(1,1) NOT NULL,
        [Interest] NVARCHAR(100) NOT NULL,
        [Category] NVARCHAR(50) NOT NULL,
        [Icon] NVARCHAR(50) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        CONSTRAINT [PK_Admin_InterestOptions] PRIMARY KEY CLUSTERED ([InterestOptionID] ASC)
    );
    PRINT 'Created [admin].[InterestOptions] table.';
END
GO

-- =============================================
-- STEP 2: Copy data from old tables to new tables
-- =============================================

-- EventTypes
IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[EventTypes]') AND type in (N'U'))
   AND NOT EXISTS (SELECT 1 FROM [admin].[EventTypes])
BEGIN
    SET IDENTITY_INSERT [admin].[EventTypes] ON;
    INSERT INTO [admin].[EventTypes] (EventTypeID, EventTypeKey, EventTypeName, DisplayOrder, IsActive, CreatedAt, UpdatedAt)
    SELECT EventTypeID, EventTypeKey, EventTypeName, DisplayOrder, IsActive, CreatedAt, UpdatedAt
    FROM [vendors].[EventTypes];
    SET IDENTITY_INSERT [admin].[EventTypes] OFF;
    PRINT 'Copied data from [vendors].[EventTypes] to [admin].[EventTypes].';
END
GO

-- Cultures
IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[Cultures]') AND type in (N'U'))
   AND NOT EXISTS (SELECT 1 FROM [admin].[Cultures])
BEGIN
    SET IDENTITY_INSERT [admin].[Cultures] ON;
    INSERT INTO [admin].[Cultures] (CultureID, CultureKey, CultureName, DisplayOrder, IsActive, CreatedAt, UpdatedAt)
    SELECT CultureID, CultureKey, CultureName, DisplayOrder, IsActive, CreatedAt, UpdatedAt
    FROM [vendors].[Cultures];
    SET IDENTITY_INSERT [admin].[Cultures] OFF;
    PRINT 'Copied data from [vendors].[Cultures] to [admin].[Cultures].';
END
GO

-- Subcategories
IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[Subcategories]') AND type in (N'U'))
   AND NOT EXISTS (SELECT 1 FROM [admin].[Subcategories])
BEGIN
    SET IDENTITY_INSERT [admin].[Subcategories] ON;
    INSERT INTO [admin].[Subcategories] (SubcategoryID, Category, SubcategoryKey, SubcategoryName, Description, DisplayOrder, IsActive, CreatedAt, UpdatedAt)
    SELECT SubcategoryID, Category, SubcategoryKey, SubcategoryName, Description, DisplayOrder, IsActive, CreatedAt, UpdatedAt
    FROM [vendors].[Subcategories];
    SET IDENTITY_INSERT [admin].[Subcategories] OFF;
    PRINT 'Copied data from [vendors].[Subcategories] to [admin].[Subcategories].';
END
GO

-- CategoryQuestions
IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[CategoryQuestions]') AND type in (N'U'))
   AND NOT EXISTS (SELECT 1 FROM [admin].[CategoryQuestions])
BEGIN
    SET IDENTITY_INSERT [admin].[CategoryQuestions] ON;
    INSERT INTO [admin].[CategoryQuestions] (QuestionID, Category, QuestionText, QuestionType, Options, IsRequired, DisplayOrder, IsActive, CreatedAt, UpdatedAt, IsFilterable, HelpText, AnswerDisplayType)
    SELECT QuestionID, Category, QuestionText, QuestionType, Options, IsRequired, DisplayOrder, IsActive, CreatedAt, UpdatedAt, 
           ISNULL(IsFilterable, 0), HelpText, ISNULL(AnswerDisplayType, 'text')
    FROM [vendors].[CategoryQuestions];
    SET IDENTITY_INSERT [admin].[CategoryQuestions] OFF;
    PRINT 'Copied data from [vendors].[CategoryQuestions] to [admin].[CategoryQuestions].';
END
GO

-- InterestOptions
IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[InterestOptions]') AND type in (N'U'))
   AND NOT EXISTS (SELECT 1 FROM [admin].[InterestOptions])
BEGIN
    SET IDENTITY_INSERT [admin].[InterestOptions] ON;
    INSERT INTO [admin].[InterestOptions] (InterestOptionID, Interest, Category, Icon, IsActive)
    SELECT InterestOptionID, Interest, Category, Icon, IsActive
    FROM [users].[InterestOptions];
    SET IDENTITY_INSERT [admin].[InterestOptions] OFF;
    PRINT 'Copied data from [users].[InterestOptions] to [admin].[InterestOptions].';
END
GO

-- =============================================
-- STEP 3: Update foreign key constraints on junction tables
-- =============================================

-- Drop old FK constraints and add new ones for VendorEventTypes
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_VendorEventTypes_EventTypes')
BEGIN
    ALTER TABLE [vendors].[VendorEventTypes] DROP CONSTRAINT [FK_VendorEventTypes_EventTypes];
    PRINT 'Dropped old FK_VendorEventTypes_EventTypes constraint.';
END

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_VendorEventTypes_Admin_EventTypes')
BEGIN
    ALTER TABLE [vendors].[VendorEventTypes] 
    ADD CONSTRAINT [FK_VendorEventTypes_Admin_EventTypes] 
    FOREIGN KEY ([EventTypeID]) REFERENCES [admin].[EventTypes]([EventTypeID]);
    PRINT 'Added new FK_VendorEventTypes_Admin_EventTypes constraint.';
END
GO

-- Drop old FK constraints and add new ones for VendorCultures
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_VendorCultures_Cultures')
BEGIN
    ALTER TABLE [vendors].[VendorCultures] DROP CONSTRAINT [FK_VendorCultures_Cultures];
    PRINT 'Dropped old FK_VendorCultures_Cultures constraint.';
END

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_VendorCultures_Admin_Cultures')
BEGIN
    ALTER TABLE [vendors].[VendorCultures] 
    ADD CONSTRAINT [FK_VendorCultures_Admin_Cultures] 
    FOREIGN KEY ([CultureID]) REFERENCES [admin].[Cultures]([CultureID]);
    PRINT 'Added new FK_VendorCultures_Admin_Cultures constraint.';
END
GO

-- Drop old FK constraints and add new ones for VendorSubcategories
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_VendorSubcategories_Subcategories')
BEGIN
    ALTER TABLE [vendors].[VendorSubcategories] DROP CONSTRAINT [FK_VendorSubcategories_Subcategories];
    PRINT 'Dropped old FK_VendorSubcategories_Subcategories constraint.';
END

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_VendorSubcategories_Admin_Subcategories')
BEGIN
    ALTER TABLE [vendors].[VendorSubcategories] 
    ADD CONSTRAINT [FK_VendorSubcategories_Admin_Subcategories] 
    FOREIGN KEY ([SubcategoryID]) REFERENCES [admin].[Subcategories]([SubcategoryID]);
    PRINT 'Added new FK_VendorSubcategories_Admin_Subcategories constraint.';
END
GO

-- =============================================
-- STEP 4: Drop old tables (optional - commented out for safety)
-- Uncomment these after verifying the migration is successful
-- =============================================

/*
-- Drop old EventTypes table
IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[EventTypes]') AND type in (N'U'))
BEGIN
    DROP TABLE [vendors].[EventTypes];
    PRINT 'Dropped old [vendors].[EventTypes] table.';
END
GO

-- Drop old Cultures table
IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[Cultures]') AND type in (N'U'))
BEGIN
    DROP TABLE [vendors].[Cultures];
    PRINT 'Dropped old [vendors].[Cultures] table.';
END
GO

-- Drop old Subcategories table
IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[Subcategories]') AND type in (N'U'))
BEGIN
    DROP TABLE [vendors].[Subcategories];
    PRINT 'Dropped old [vendors].[Subcategories] table.';
END
GO

-- Drop old CategoryQuestions table
IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[CategoryQuestions]') AND type in (N'U'))
BEGIN
    DROP TABLE [vendors].[CategoryQuestions];
    PRINT 'Dropped old [vendors].[CategoryQuestions] table.';
END
GO

-- Drop old InterestOptions table
IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[InterestOptions]') AND type in (N'U'))
BEGIN
    DROP TABLE [users].[InterestOptions];
    PRINT 'Dropped old [users].[InterestOptions] table.';
END
GO
*/

PRINT '==============================================';
PRINT 'Migration of reference tables to admin schema completed.';
PRINT '==============================================';
GO
