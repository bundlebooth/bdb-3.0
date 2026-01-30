/*
    FULL DEPLOYMENT SCRIPT - All Session Changes
    Description: Deploys ALL database changes from this session
    
    Order of deployment:
    1. Schema changes (columns on existing tables)
    2. New tables (EventTypes, VendorEventTypes, Cultures, VendorCultures, vendors.Subcategories)
    3. Stored procedures
    4. Seed data (EventTypes, Cultures, Subcategories, CategoryQuestions)
*/

SET NOCOUNT ON;
GO

PRINT '========================================';
PRINT '=== FULL DEPLOYMENT SCRIPT STARTING ===';
PRINT '========================================';
GO

-- =============================================
-- PHASE 1: SCHEMA CHANGES ON EXISTING TABLES
-- =============================================
PRINT '';
PRINT '=== PHASE 1: Schema Changes ===';
GO

-- CategoryQuestions columns
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[CategoryQuestions]') AND name = 'IsFilterable')
    ALTER TABLE [vendors].[CategoryQuestions] ADD [IsFilterable] [bit] CONSTRAINT DF_CategoryQuestions_IsFilterable DEFAULT 0 NOT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[CategoryQuestions]') AND name = 'FilterType')
    ALTER TABLE [vendors].[CategoryQuestions] ADD [FilterType] [nvarchar](20) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[CategoryQuestions]') AND name = 'FilterGroup')
    ALTER TABLE [vendors].[CategoryQuestions] ADD [FilterGroup] [nvarchar](50) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[CategoryQuestions]') AND name = 'FilterLabel')
    ALTER TABLE [vendors].[CategoryQuestions] ADD [FilterLabel] [nvarchar](100) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[CategoryQuestions]') AND name = 'CategoryID')
    ALTER TABLE [vendors].[CategoryQuestions] ADD [CategoryID] [int] NULL;
GO

-- VendorProfiles columns
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND name = 'MinBookingHours')
    ALTER TABLE [vendors].[VendorProfiles] ADD [MinBookingHours] [decimal](4, 1) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND name = 'AdvanceNoticeHours')
    ALTER TABLE [vendors].[VendorProfiles] ADD [AdvanceNoticeHours] [int] NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND name = 'MaxCapacity')
    ALTER TABLE [vendors].[VendorProfiles] ADD [MaxCapacity] [int] NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND name = 'OffersHourlyRates')
    ALTER TABLE [vendors].[VendorProfiles] ADD [OffersHourlyRates] [bit] CONSTRAINT DF_VendorProfiles_OffersHourlyRates DEFAULT 1 NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND name = 'InstantBookingEnabled')
    ALTER TABLE [vendors].[VendorProfiles] ADD [InstantBookingEnabled] [bit] CONSTRAINT DF_VendorProfiles_InstantBookingEnabled DEFAULT 0 NOT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND name = 'MinBookingLeadTimeHours')
    ALTER TABLE [vendors].[VendorProfiles] ADD [MinBookingLeadTimeHours] [int] CONSTRAINT DF_VendorProfiles_MinBookingLeadTimeHours DEFAULT 24 NOT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND name = 'ServiceLocationScope')
    ALTER TABLE [vendors].[VendorProfiles] ADD [ServiceLocationScope] [nvarchar](50) CONSTRAINT DF_VendorProfiles_ServiceLocationScope DEFAULT 'Local' NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND name = 'YearsOfExperienceRange')
    ALTER TABLE [vendors].[VendorProfiles] ADD [YearsOfExperienceRange] [nvarchar](20) NULL;
GO

PRINT 'Schema changes completed.';
GO

-- =============================================
-- PHASE 2: NEW TABLES
-- =============================================
PRINT '';
PRINT '=== PHASE 2: New Tables ===';
GO

-- EventTypes table
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[EventTypes]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[EventTypes](
        [EventTypeID] [int] IDENTITY(1,1) NOT NULL,
        [EventTypeKey] [nvarchar](50) NOT NULL,
        [EventTypeName] [nvarchar](100) NOT NULL,
        [DisplayOrder] [int] NOT NULL DEFAULT 0,
        [IsActive] [bit] NOT NULL DEFAULT 1,
        [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    PRIMARY KEY CLUSTERED ([EventTypeID] ASC),
    CONSTRAINT [UQ_EventTypes_Key] UNIQUE NONCLUSTERED ([EventTypeKey])
    );
    PRINT 'Table [vendors].[EventTypes] created.';
END
ELSE
    PRINT 'Table [vendors].[EventTypes] already exists.';
GO

-- Cultures table
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[Cultures]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[Cultures](
        [CultureID] [int] IDENTITY(1,1) NOT NULL,
        [CultureKey] [nvarchar](50) NOT NULL,
        [CultureName] [nvarchar](100) NOT NULL,
        [DisplayOrder] [int] NOT NULL DEFAULT 0,
        [IsActive] [bit] NOT NULL DEFAULT 1,
        [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    PRIMARY KEY CLUSTERED ([CultureID] ASC),
    CONSTRAINT [UQ_Cultures_Key] UNIQUE NONCLUSTERED ([CultureKey])
    );
    PRINT 'Table [vendors].[Cultures] created.';
END
ELSE
    PRINT 'Table [vendors].[Cultures] already exists.';
GO

-- Subcategories table
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[Subcategories]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[Subcategories](
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
    CONSTRAINT [UQ_Subcategories_CategoryKey] UNIQUE NONCLUSTERED ([Category], [SubcategoryKey])
    );
    PRINT 'Table [vendors].[Subcategories] created.';
END
ELSE
    PRINT 'Table [vendors].[Subcategories] already exists.';
GO

-- VendorEventTypes junction table
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[VendorEventTypes]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[VendorEventTypes](
        [VendorEventTypeID] [int] IDENTITY(1,1) NOT NULL,
        [VendorProfileID] [int] NOT NULL,
        [EventTypeID] [int] NOT NULL,
        [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    PRIMARY KEY CLUSTERED ([VendorEventTypeID] ASC),
    CONSTRAINT [FK_VendorEventTypes_VendorProfiles] FOREIGN KEY ([VendorProfileID]) REFERENCES [vendors].[VendorProfiles]([VendorProfileID]),
    CONSTRAINT [FK_VendorEventTypes_EventTypes] FOREIGN KEY ([EventTypeID]) REFERENCES [vendors].[EventTypes]([EventTypeID]),
    CONSTRAINT [UQ_VendorEventTypes] UNIQUE NONCLUSTERED ([VendorProfileID], [EventTypeID])
    );
    PRINT 'Table [vendors].[VendorEventTypes] created.';
END
ELSE
    PRINT 'Table [vendors].[VendorEventTypes] already exists.';
GO

-- VendorCultures junction table
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[VendorCultures]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[VendorCultures](
        [VendorCultureID] [int] IDENTITY(1,1) NOT NULL,
        [VendorProfileID] [int] NOT NULL,
        [CultureID] [int] NOT NULL,
        [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    PRIMARY KEY CLUSTERED ([VendorCultureID] ASC),
    CONSTRAINT [FK_VendorCultures_VendorProfiles] FOREIGN KEY ([VendorProfileID]) REFERENCES [vendors].[VendorProfiles]([VendorProfileID]),
    CONSTRAINT [FK_VendorCultures_Cultures] FOREIGN KEY ([CultureID]) REFERENCES [vendors].[Cultures]([CultureID]),
    CONSTRAINT [UQ_VendorCultures] UNIQUE NONCLUSTERED ([VendorProfileID], [CultureID])
    );
    PRINT 'Table [vendors].[VendorCultures] created.';
END
ELSE
    PRINT 'Table [vendors].[VendorCultures] already exists.';
GO

-- Subcategories junction table (vendors schema - for vendor selections)
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[Subcategories]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[Subcategories](
        [VendorSubcategoryID] [int] IDENTITY(1,1) NOT NULL,
        [VendorProfileID] [int] NOT NULL,
        [SubcategoryID] [int] NOT NULL,
        [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    PRIMARY KEY CLUSTERED ([VendorSubcategoryID] ASC),
    CONSTRAINT [FK_Subcategories_VendorProfiles] FOREIGN KEY ([VendorProfileID]) REFERENCES [vendors].[VendorProfiles]([VendorProfileID]),
    CONSTRAINT [FK_Subcategories_AdminSubcategories] FOREIGN KEY ([SubcategoryID]) REFERENCES [admin].[Subcategories]([SubcategoryID]),
    CONSTRAINT [UQ_VendorSubcategories] UNIQUE NONCLUSTERED ([VendorProfileID], [SubcategoryID])
    );
    PRINT 'Table [vendors].[Subcategories] created.';
END
ELSE
    PRINT 'Table [vendors].[Subcategories] already exists.';
GO

PRINT 'New tables completed.';
GO

-- =============================================
-- PHASE 3: STORED PROCEDURES
-- =============================================
PRINT '';
PRINT '=== PHASE 3: Stored Procedures ===';
GO

-- sp_GetEventTypes
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetEventTypes]'))
    DROP PROCEDURE [vendors].[sp_GetEventTypes];
GO
CREATE PROCEDURE [vendors].[sp_GetEventTypes]
    @IncludeInactive BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SELECT EventTypeID, EventTypeKey, EventTypeName, DisplayOrder, IsActive
    FROM [vendors].[EventTypes]
    WHERE (@IncludeInactive = 1 OR IsActive = 1)
    ORDER BY DisplayOrder ASC;
END;
GO
PRINT 'Created [vendors].[sp_GetEventTypes]';
GO

-- sp_GetCultures
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetCultures]'))
    DROP PROCEDURE [vendors].[sp_GetCultures];
GO
CREATE PROCEDURE [vendors].[sp_GetCultures]
    @IncludeInactive BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SELECT CultureID, CultureKey, CultureName, DisplayOrder, IsActive
    FROM [vendors].[Cultures]
    WHERE (@IncludeInactive = 1 OR IsActive = 1)
    ORDER BY DisplayOrder ASC;
END;
GO
PRINT 'Created [vendors].[sp_GetCultures]';
GO

-- sp_GetSubcategories
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetSubcategories]'))
    DROP PROCEDURE [vendors].[sp_GetSubcategories];
GO
CREATE PROCEDURE [vendors].[sp_GetSubcategories]
    @Category NVARCHAR(50) = NULL,
    @IncludeInactive BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SELECT SubcategoryID, Category, SubcategoryKey, SubcategoryName, Description, DisplayOrder, IsActive
    FROM [vendors].[Subcategories]
    WHERE (@IncludeInactive = 1 OR IsActive = 1)
      AND (@Category IS NULL OR Category = @Category)
    ORDER BY Category, DisplayOrder ASC;
END;
GO
PRINT 'Created [vendors].[sp_GetSubcategories]';
GO

-- sp_Vendor_UpdateBookingSettings
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Vendor_UpdateBookingSettings]'))
    DROP PROCEDURE [vendors].[sp_Vendor_UpdateBookingSettings];
GO
CREATE PROCEDURE [vendors].[sp_Vendor_UpdateBookingSettings]
    @VendorProfileID INT,
    @InstantBookingEnabled BIT,
    @MinBookingLeadTimeHours INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [vendors].[VendorProfiles]
    SET InstantBookingEnabled = @InstantBookingEnabled,
        MinBookingLeadTimeHours = @MinBookingLeadTimeHours,
        UpdatedAt = GETUTCDATE()
    WHERE VendorProfileID = @VendorProfileID;
    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO
PRINT 'Created [vendors].[sp_Vendor_UpdateBookingSettings]';
GO

-- sp_Vendor_UpdateAttributes
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Vendor_UpdateAttributes]'))
    DROP PROCEDURE [vendors].[sp_Vendor_UpdateAttributes];
GO
CREATE PROCEDURE [vendors].[sp_Vendor_UpdateAttributes]
    @VendorProfileID INT,
    @ServiceLocationScope NVARCHAR(50) = NULL,
    @YearsOfExperienceRange NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [vendors].[VendorProfiles]
    SET ServiceLocationScope = COALESCE(@ServiceLocationScope, ServiceLocationScope),
        YearsOfExperienceRange = COALESCE(@YearsOfExperienceRange, YearsOfExperienceRange),
        UpdatedAt = GETUTCDATE()
    WHERE VendorProfileID = @VendorProfileID;
    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO
PRINT 'Created [vendors].[sp_Vendor_UpdateAttributes]';
GO

-- sp_Vendor_UpdateEventTypes
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Vendor_UpdateEventTypes]'))
    DROP PROCEDURE [vendors].[sp_Vendor_UpdateEventTypes];
GO
CREATE PROCEDURE [vendors].[sp_Vendor_UpdateEventTypes]
    @VendorProfileID INT,
    @EventTypeIDs NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DELETE FROM [vendors].[VendorEventTypes] WHERE VendorProfileID = @VendorProfileID;
        IF @EventTypeIDs IS NOT NULL AND LEN(@EventTypeIDs) > 0
        BEGIN
            INSERT INTO [vendors].[VendorEventTypes] (VendorProfileID, EventTypeID)
            SELECT @VendorProfileID, CAST(value AS INT)
            FROM STRING_SPLIT(@EventTypeIDs, ',')
            WHERE LTRIM(RTRIM(value)) <> '';
        END
        COMMIT TRANSACTION;
        SELECT 1 AS Success;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
PRINT 'Created [vendors].[sp_Vendor_UpdateEventTypes]';
GO

-- sp_Vendor_UpdateCultures
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Vendor_UpdateCultures]'))
    DROP PROCEDURE [vendors].[sp_Vendor_UpdateCultures];
GO
CREATE PROCEDURE [vendors].[sp_Vendor_UpdateCultures]
    @VendorProfileID INT,
    @CultureIDs NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DELETE FROM [vendors].[VendorCultures] WHERE VendorProfileID = @VendorProfileID;
        IF @CultureIDs IS NOT NULL AND LEN(@CultureIDs) > 0
        BEGIN
            INSERT INTO [vendors].[VendorCultures] (VendorProfileID, CultureID)
            SELECT @VendorProfileID, CAST(value AS INT)
            FROM STRING_SPLIT(@CultureIDs, ',')
            WHERE LTRIM(RTRIM(value)) <> '';
        END
        COMMIT TRANSACTION;
        SELECT 1 AS Success;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
PRINT 'Created [vendors].[sp_Vendor_UpdateCultures]';
GO

-- sp_Vendor_UpdateSubcategories
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Vendor_UpdateSubcategories]'))
    DROP PROCEDURE [vendors].[sp_Vendor_UpdateSubcategories];
GO
CREATE PROCEDURE [vendors].[sp_Vendor_UpdateSubcategories]
    @VendorProfileID INT,
    @SubcategoryIDs NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DELETE FROM [vendors].[Subcategories] WHERE VendorProfileID = @VendorProfileID;
        IF @SubcategoryIDs IS NOT NULL AND LEN(@SubcategoryIDs) > 0
        BEGIN
            INSERT INTO [vendors].[Subcategories] (VendorProfileID, SubcategoryID, CreatedAt)
            SELECT @VendorProfileID, value, GETUTCDATE()
            FROM STRING_SPLIT(@SubcategoryIDs, ',')
            WHERE ISNUMERIC(value) = 1;
        END
        COMMIT TRANSACTION;
        SELECT @@ROWCOUNT AS RowsAffected;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
PRINT 'Created [vendors].[sp_Vendor_UpdateSubcategories]';
GO

-- sp_Vendor_GetAttributes
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Vendor_GetAttributes]'))
    DROP PROCEDURE [vendors].[sp_Vendor_GetAttributes];
GO
CREATE PROCEDURE [vendors].[sp_Vendor_GetAttributes]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT vp.VendorProfileID, vp.InstantBookingEnabled, vp.MinBookingLeadTimeHours, vp.ServiceLocationScope, vp.YearsOfExperienceRange, vp.PriceLevel
    FROM [vendors].[VendorProfiles] vp WHERE vp.VendorProfileID = @VendorProfileID;
    
    SELECT vc.VendorCategoryID, vc.Category, vc.IsPrimary
    FROM [vendors].[VendorCategories] vc WHERE vc.VendorProfileID = @VendorProfileID ORDER BY vc.IsPrimary DESC;
    
    SELECT vet.EventTypeID, et.EventTypeKey, et.EventTypeName
    FROM [vendors].[VendorEventTypes] vet
    INNER JOIN [vendors].[EventTypes] et ON vet.EventTypeID = et.EventTypeID
    WHERE vet.VendorProfileID = @VendorProfileID ORDER BY et.DisplayOrder;
    
    SELECT vc.CultureID, cu.CultureKey, cu.CultureName
    FROM [vendors].[VendorCultures] vc
    INNER JOIN [vendors].[Cultures] cu ON vc.CultureID = cu.CultureID
    WHERE vc.VendorProfileID = @VendorProfileID ORDER BY cu.DisplayOrder;
    
    SELECT vs.SubcategoryID, s.Category, s.SubcategoryKey, s.SubcategoryName
    FROM [vendors].[Subcategories] vs
    INNER JOIN [admin].[Subcategories] s ON vs.SubcategoryID = s.SubcategoryID
    WHERE vs.VendorProfileID = @VendorProfileID ORDER BY s.Category, s.DisplayOrder;
END;
GO
PRINT 'Created [vendors].[sp_Vendor_GetAttributes]';
GO

-- sp_GetFilterableQuestions
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetFilterableQuestions]'))
    DROP PROCEDURE [vendors].[sp_GetFilterableQuestions];
GO
CREATE PROCEDURE [vendors].[sp_GetFilterableQuestions]
    @Category NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT QuestionID, Category, QuestionText, QuestionType, Options, IsRequired, DisplayOrder, IsFilterable, FilterType, FilterGroup, FilterLabel
    FROM [vendors].[CategoryQuestions]
    WHERE IsActive = 1 AND IsFilterable = 1 AND (@Category IS NULL OR Category = @Category)
    ORDER BY Category, DisplayOrder ASC;
END;
GO
PRINT 'Created [vendors].[sp_GetFilterableQuestions]';
GO

-- sp_GetFilterableQuestionsByCategory
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetFilterableQuestionsByCategory]'))
    DROP PROCEDURE [vendors].[sp_GetFilterableQuestionsByCategory];
GO
CREATE PROCEDURE [vendors].[sp_GetFilterableQuestionsByCategory]
    @Category NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT QuestionID, Category, QuestionText, QuestionType, Options, IsRequired, DisplayOrder, IsFilterable, FilterType, COALESCE(FilterLabel, QuestionText) AS FilterLabel
    FROM [vendors].[CategoryQuestions]
    WHERE IsActive = 1 AND IsFilterable = 1 AND (@Category IS NULL OR Category = @Category)
    ORDER BY Category, DisplayOrder ASC;
END;
GO
PRINT 'Created [vendors].[sp_GetFilterableQuestionsByCategory]';
GO

-- sp_Admin_ManageEventType
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Admin_ManageEventType]'))
    DROP PROCEDURE [vendors].[sp_Admin_ManageEventType];
GO
CREATE PROCEDURE [vendors].[sp_Admin_ManageEventType]
    @Action NVARCHAR(10),
    @EventTypeID INT = NULL,
    @EventTypeKey NVARCHAR(50) = NULL,
    @EventTypeName NVARCHAR(100) = NULL,
    @DisplayOrder INT = 0,
    @IsActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    IF @Action = 'add'
    BEGIN
        INSERT INTO [vendors].[EventTypes] (EventTypeKey, EventTypeName, DisplayOrder, IsActive)
        VALUES (@EventTypeKey, @EventTypeName, @DisplayOrder, @IsActive);
        SELECT SCOPE_IDENTITY() AS EventTypeID, 'Event type added successfully' AS Message;
    END
    ELSE IF @Action = 'edit'
    BEGIN
        UPDATE [vendors].[EventTypes]
        SET EventTypeKey = COALESCE(@EventTypeKey, EventTypeKey),
            EventTypeName = COALESCE(@EventTypeName, EventTypeName),
            DisplayOrder = @DisplayOrder, IsActive = @IsActive, UpdatedAt = GETUTCDATE()
        WHERE EventTypeID = @EventTypeID;
        SELECT @EventTypeID AS EventTypeID, 'Event type updated successfully' AS Message;
    END
    ELSE IF @Action = 'delete'
    BEGIN
        UPDATE [vendors].[EventTypes] SET IsActive = 0, UpdatedAt = GETUTCDATE() WHERE EventTypeID = @EventTypeID;
        SELECT @EventTypeID AS EventTypeID, 'Event type deactivated successfully' AS Message;
    END
END;
GO
PRINT 'Created [vendors].[sp_Admin_ManageEventType]';
GO

-- sp_Admin_ManageCulture
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Admin_ManageCulture]'))
    DROP PROCEDURE [vendors].[sp_Admin_ManageCulture];
GO
CREATE PROCEDURE [vendors].[sp_Admin_ManageCulture]
    @Action NVARCHAR(10),
    @CultureID INT = NULL,
    @CultureKey NVARCHAR(50) = NULL,
    @CultureName NVARCHAR(100) = NULL,
    @DisplayOrder INT = 0,
    @IsActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    IF @Action = 'add'
    BEGIN
        INSERT INTO [vendors].[Cultures] (CultureKey, CultureName, DisplayOrder, IsActive)
        VALUES (@CultureKey, @CultureName, @DisplayOrder, @IsActive);
        SELECT SCOPE_IDENTITY() AS CultureID, 'Culture added successfully' AS Message;
    END
    ELSE IF @Action = 'edit'
    BEGIN
        UPDATE [vendors].[Cultures]
        SET CultureKey = COALESCE(@CultureKey, CultureKey),
            CultureName = COALESCE(@CultureName, CultureName),
            DisplayOrder = @DisplayOrder, IsActive = @IsActive, UpdatedAt = GETUTCDATE()
        WHERE CultureID = @CultureID;
        SELECT @CultureID AS CultureID, 'Culture updated successfully' AS Message;
    END
    ELSE IF @Action = 'delete'
    BEGIN
        UPDATE [vendors].[Cultures] SET IsActive = 0, UpdatedAt = GETUTCDATE() WHERE CultureID = @CultureID;
        SELECT @CultureID AS CultureID, 'Culture deactivated successfully' AS Message;
    END
END;
GO
PRINT 'Created [vendors].[sp_Admin_ManageCulture]';
GO

-- sp_GetVendorProfileWithAttributes
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetVendorProfileWithAttributes]'))
    DROP PROCEDURE [vendors].[sp_GetVendorProfileWithAttributes];
GO
CREATE PROCEDURE [vendors].[sp_GetVendorProfileWithAttributes]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT vp.VendorProfileID, vp.BusinessName, vp.DisplayName, vp.BusinessDescription, vp.Tagline, vp.LogoURL, vp.PriceLevel,
        vp.City, vp.State, vp.Country, vp.AvgRating, vp.TotalReviews, vp.TotalBookings,
        vp.InstantBookingEnabled, vp.MinBookingLeadTimeHours, vp.ServiceLocationScope, vp.YearsOfExperienceRange,
        vp.IsPremium, vp.IsEcoFriendly, vp.IsAwardWinning, vp.IsLastMinute, vp.IsCertified, vp.IsInsured, vp.IsLocal, vp.IsMobile, vp.YearsInBusiness
    FROM [vendors].[VendorProfiles] vp WHERE vp.VendorProfileID = @VendorProfileID;
    
    SELECT vc.VendorCategoryID, vc.Category, vc.IsPrimary
    FROM [vendors].[VendorCategories] vc WHERE vc.VendorProfileID = @VendorProfileID ORDER BY vc.IsPrimary DESC;
    
    SELECT vet.EventTypeID, et.EventTypeKey, et.EventTypeName
    FROM [vendors].[VendorEventTypes] vet
    INNER JOIN [vendors].[EventTypes] et ON vet.EventTypeID = et.EventTypeID
    WHERE vet.VendorProfileID = @VendorProfileID ORDER BY et.DisplayOrder;
    
    SELECT vc.CultureID, cu.CultureKey, cu.CultureName
    FROM [vendors].[VendorCultures] vc
    INNER JOIN [vendors].[Cultures] cu ON vc.CultureID = cu.CultureID
    WHERE vc.VendorProfileID = @VendorProfileID ORDER BY cu.DisplayOrder;
    
    SELECT vs.SubcategoryID, s.Category, s.SubcategoryKey, s.SubcategoryName
    FROM [vendors].[VendorSubcategories] vs
    INNER JOIN [vendors].[Subcategories] s ON vs.SubcategoryID = s.SubcategoryID
    WHERE vs.VendorProfileID = @VendorProfileID AND s.IsActive = 1 ORDER BY s.Category, s.DisplayOrder;
    
    SELECT vca.AnswerID, vca.QuestionID, cq.QuestionText, cq.QuestionType, vca.Answer, cq.Category, cq.IsFilterable, cq.FilterLabel
    FROM [vendors].[VendorCategoryAnswers] vca
    INNER JOIN [vendors].[CategoryQuestions] cq ON vca.QuestionID = cq.QuestionID
    WHERE vca.VendorProfileID = @VendorProfileID AND cq.IsActive = 1
    ORDER BY cq.Category, cq.DisplayOrder;
END;
GO
PRINT 'Created [vendors].[sp_GetVendorProfileWithAttributes]';
GO

PRINT 'Stored procedures completed.';
GO

-- =============================================
-- PHASE 4: SEED DATA
-- =============================================
PRINT '';
PRINT '=== PHASE 4: Seed Data ===';
GO

-- EventTypes seed data
IF NOT EXISTS (SELECT TOP 1 1 FROM [vendors].[EventTypes])
BEGIN
    SET IDENTITY_INSERT [vendors].[EventTypes] ON;
    INSERT [vendors].[EventTypes] ([EventTypeID], [EventTypeKey], [EventTypeName], [DisplayOrder]) VALUES 
    (1, N'wedding', N'Weddings', 1),
    (2, N'corporate', N'Corporate Events', 2),
    (3, N'private', N'Private Parties', 3),
    (4, N'festival', N'Festivals', 4),
    (5, N'birthday', N'Birthday Parties', 5),
    (6, N'anniversary', N'Anniversaries', 6),
    (7, N'engagement', N'Engagement Parties', 7),
    (8, N'baby-shower', N'Baby Showers', 8),
    (9, N'bridal-shower', N'Bridal Showers', 9),
    (10, N'graduation', N'Graduation Parties', 10),
    (11, N'religious', N'Religious Ceremonies', 11),
    (12, N'cultural', N'Cultural Events', 12),
    (13, N'charity', N'Charity / Fundraising', 13),
    (14, N'conference', N'Conferences', 14),
    (15, N'trade-show', N'Trade Shows', 15);
    SET IDENTITY_INSERT [vendors].[EventTypes] OFF;
    PRINT 'Inserted 15 EventTypes.';
END
ELSE
    PRINT 'EventTypes already has data.';
GO

-- Cultures seed data
IF NOT EXISTS (SELECT TOP 1 1 FROM [vendors].[Cultures])
BEGIN
    SET IDENTITY_INSERT [vendors].[Cultures] ON;
    INSERT [vendors].[Cultures] ([CultureID], [CultureKey], [CultureName], [DisplayOrder]) VALUES 
    (1, N'south-asian', N'South Asian', 1),
    (2, N'chinese', N'Chinese', 2),
    (3, N'filipino', N'Filipino', 3),
    (4, N'vietnamese', N'Vietnamese', 4),
    (5, N'korean', N'Korean', 5),
    (6, N'japanese', N'Japanese', 6),
    (7, N'middle-eastern', N'Middle Eastern', 7),
    (8, N'african', N'African', 8),
    (9, N'caribbean', N'Caribbean', 9),
    (10, N'latin-american', N'Latin American', 10),
    (11, N'european', N'European', 11),
    (12, N'jewish', N'Jewish', 12),
    (13, N'greek', N'Greek', 13),
    (14, N'italian', N'Italian', 14),
    (15, N'portuguese', N'Portuguese', 15),
    (16, N'polish', N'Polish', 16),
    (17, N'ukrainian', N'Ukrainian', 17),
    (18, N'russian', N'Russian', 18),
    (19, N'indigenous', N'Indigenous', 19),
    (20, N'multicultural', N'Multicultural / Fusion', 20);
    SET IDENTITY_INSERT [vendors].[Cultures] OFF;
    PRINT 'Inserted 20 Cultures.';
END
ELSE
    PRINT 'Cultures already has data.';
GO

-- Subcategories seed data
IF NOT EXISTS (SELECT 1 FROM [vendors].[Subcategories])
BEGIN
    INSERT INTO [vendors].[Subcategories] (Category, SubcategoryKey, SubcategoryName, Description, DisplayOrder, IsActive) VALUES 
    ('Photo / Video', 'photo-booth', 'Photo Booth', 'Traditional photo booth services', 1, 1),
    ('Photo / Video', '360-video-booth', '360 Video Booth', '360-degree video capture booth', 2, 1),
    ('Photo / Video', 'magazine-booth', 'Magazine Booth', 'Magazine-style photo booth', 3, 1),
    ('Photo / Video', 'wedding-photography', 'Wedding Photography', 'Professional wedding photography', 4, 1),
    ('Photo / Video', 'event-photography', 'Event Photography', 'General event photography', 5, 1),
    ('Photo / Video', 'videography', 'Videography', 'Video recording and production', 6, 1),
    ('Photo / Video', 'drone-photography', 'Drone Photography', 'Aerial photography and video', 7, 1),
    ('Catering', 'full-service', 'Full Service Catering', 'Complete catering with staff', 1, 1),
    ('Catering', 'drop-off', 'Drop-Off Catering', 'Food delivery without service staff', 2, 1),
    ('Catering', 'food-truck', 'Food Truck', 'Mobile food service', 3, 1),
    ('Catering', 'desserts', 'Desserts & Sweets', 'Specialty desserts and sweets', 4, 1),
    ('Catering', 'beverages', 'Beverage Service', 'Bar and beverage catering', 5, 1),
    ('Catering', 'bbq', 'BBQ Catering', 'Barbecue and grilling services', 6, 1),
    ('Music / DJ', 'wedding-dj', 'Wedding DJ', 'DJ services for weddings', 1, 1),
    ('Music / DJ', 'event-dj', 'Event DJ', 'DJ for corporate and private events', 2, 1),
    ('Music / DJ', 'live-band', 'Live Band', 'Live music performance', 3, 1),
    ('Music / DJ', 'solo-musician', 'Solo Musician', 'Individual performer', 4, 1),
    ('Music / DJ', 'string-quartet', 'String Quartet', 'Classical string ensemble', 5, 1),
    ('Music / DJ', 'jazz-band', 'Jazz Band', 'Jazz music ensemble', 6, 1),
    ('Entertainment', 'magician', 'Magician', 'Magic and illusion performances', 1, 1),
    ('Entertainment', 'comedian', 'Comedian', 'Stand-up comedy and MC services', 2, 1),
    ('Entertainment', 'dancers', 'Dancers', 'Dance performances and entertainment', 3, 1),
    ('Entertainment', 'face-painting', 'Face Painting', 'Face painting for events', 4, 1),
    ('Entertainment', 'balloon-artist', 'Balloon Artist', 'Balloon twisting and decorations', 5, 1),
    ('Entertainment', 'caricature-artist', 'Caricature Artist', 'Live caricature drawings', 6, 1),
    ('Entertainment', 'fire-performer', 'Fire Performer', 'Fire dancing and performances', 7, 1),
    ('Venues', 'banquet-hall', 'Banquet Hall', 'Large indoor event space', 1, 1),
    ('Venues', 'outdoor-venue', 'Outdoor Venue', 'Gardens, patios, and outdoor spaces', 2, 1),
    ('Venues', 'rooftop', 'Rooftop', 'Rooftop event spaces', 3, 1),
    ('Venues', 'restaurant', 'Restaurant', 'Restaurant private dining', 4, 1),
    ('Venues', 'hotel', 'Hotel', 'Hotel event spaces', 5, 1),
    ('Venues', 'winery', 'Winery/Vineyard', 'Winery and vineyard venues', 6, 1),
    ('Venues', 'barn', 'Barn/Rustic', 'Rustic barn venues', 7, 1),
    ('Decor & Rentals', 'floral', 'Floral Design', 'Flower arrangements and floral decor', 1, 1),
    ('Decor & Rentals', 'furniture-rental', 'Furniture Rental', 'Tables, chairs, and furniture', 2, 1),
    ('Decor & Rentals', 'tent-rental', 'Tent Rental', 'Tents and canopy rentals', 3, 1),
    ('Decor & Rentals', 'lighting', 'Lighting', 'Event lighting and effects', 4, 1),
    ('Decor & Rentals', 'linens', 'Linens & Tableware', 'Table linens and dishware', 5, 1),
    ('Decor & Rentals', 'backdrops', 'Backdrops & Props', 'Photo backdrops and event props', 6, 1),
    ('Beauty & Wellness', 'hair-styling', 'Hair Styling', 'Professional hair styling', 1, 1),
    ('Beauty & Wellness', 'makeup', 'Makeup Artist', 'Professional makeup services', 2, 1),
    ('Beauty & Wellness', 'spa-services', 'Spa Services', 'Mobile spa and wellness', 3, 1),
    ('Beauty & Wellness', 'henna', 'Henna Artist', 'Henna and mehndi art', 4, 1),
    ('Beauty & Wellness', 'nail-services', 'Nail Services', 'Manicure and pedicure', 5, 1),
    ('Planning & Coordination', 'full-planning', 'Full Event Planning', 'Complete event planning services', 1, 1),
    ('Planning & Coordination', 'day-of-coordination', 'Day-of Coordination', 'Event day management', 2, 1),
    ('Planning & Coordination', 'partial-planning', 'Partial Planning', 'Selective planning assistance', 3, 1),
    ('Planning & Coordination', 'destination-planning', 'Destination Planning', 'Destination event planning', 4, 1),
    ('Transportation', 'limousine', 'Limousine', 'Luxury limousine service', 1, 1),
    ('Transportation', 'party-bus', 'Party Bus', 'Party bus rentals', 2, 1),
    ('Transportation', 'vintage-car', 'Vintage Car', 'Classic and vintage vehicles', 3, 1),
    ('Transportation', 'shuttle', 'Shuttle Service', 'Guest transportation shuttles', 4, 1),
    ('Transportation', 'horse-carriage', 'Horse & Carriage', 'Horse-drawn carriage service', 5, 1),
    ('Officiants & Ceremony', 'wedding-officiant', 'Wedding Officiant', 'Licensed wedding officiant', 1, 1),
    ('Officiants & Ceremony', 'religious-officiant', 'Religious Officiant', 'Religious ceremony officiant', 2, 1),
    ('Officiants & Ceremony', 'non-denominational', 'Non-Denominational', 'Secular ceremony officiant', 3, 1),
    ('Cake & Desserts', 'wedding-cake', 'Wedding Cake', 'Custom wedding cakes', 1, 1),
    ('Cake & Desserts', 'birthday-cake', 'Birthday Cake', 'Birthday and celebration cakes', 2, 1),
    ('Cake & Desserts', 'cupcakes', 'Cupcakes', 'Cupcakes and mini desserts', 3, 1),
    ('Cake & Desserts', 'dessert-table', 'Dessert Table', 'Full dessert table setup', 4, 1),
    ('Cake & Desserts', 'specialty-desserts', 'Specialty Desserts', 'Macarons, pastries, and specialty items', 5, 1),
    ('Cake & Desserts', 'chocolate-fountain', 'Chocolate Fountain', 'Chocolate fountain service', 6, 1),
    ('Fashion & Attire', 'bridal-gowns', 'Bridal Gowns', 'Wedding dresses and bridal wear', 1, 1),
    ('Fashion & Attire', 'groom-attire', 'Groom Attire', 'Suits, tuxedos, and groom wear', 2, 1),
    ('Fashion & Attire', 'bridesmaid-dresses', 'Bridesmaid Dresses', 'Bridesmaid and party dresses', 3, 1),
    ('Fashion & Attire', 'cultural-attire', 'Cultural Attire', 'Traditional and cultural wedding wear', 4, 1),
    ('Fashion & Attire', 'accessories', 'Accessories', 'Jewelry, veils, and accessories', 5, 1),
    ('Fashion & Attire', 'alterations', 'Alterations', 'Tailoring and alterations services', 6, 1),
    ('Stationery & Invitations', 'wedding-invitations', 'Wedding Invitations', 'Custom wedding invitations', 1, 1),
    ('Stationery & Invitations', 'save-the-dates', 'Save the Dates', 'Save the date cards', 2, 1),
    ('Stationery & Invitations', 'programs-menus', 'Programs & Menus', 'Ceremony programs and menus', 3, 1),
    ('Stationery & Invitations', 'signage', 'Signage', 'Event signage and welcome boards', 4, 1),
    ('Stationery & Invitations', 'calligraphy', 'Calligraphy', 'Hand calligraphy services', 5, 1),
    ('Stationery & Invitations', 'thank-you-cards', 'Thank You Cards', 'Thank you and follow-up cards', 6, 1),
    ('Experiences & Activities', 'photo-booth-experience', 'Photo Booth Experience', 'Interactive photo booth setups', 1, 1),
    ('Experiences & Activities', 'games-activities', 'Games & Activities', 'Interactive games and activities', 2, 1),
    ('Experiences & Activities', 'wine-tasting', 'Wine Tasting', 'Wine tasting experiences', 3, 1),
    ('Experiences & Activities', 'cooking-class', 'Cooking Class', 'Group cooking experiences', 4, 1),
    ('Experiences & Activities', 'team-building', 'Team Building', 'Corporate team building activities', 5, 1),
    ('Experiences & Activities', 'virtual-experiences', 'Virtual Experiences', 'Online and virtual event activities', 6, 1),
    ('Jewellery & Accessories', 'engagement-rings', 'Engagement Rings', 'Engagement and wedding rings', 1, 1),
    ('Jewellery & Accessories', 'wedding-bands', 'Wedding Bands', 'Wedding bands and sets', 2, 1),
    ('Jewellery & Accessories', 'bridal-jewelry', 'Bridal Jewelry', 'Necklaces, earrings, and bridal sets', 3, 1),
    ('Jewellery & Accessories', 'custom-jewelry', 'Custom Jewelry', 'Custom designed jewelry', 4, 1),
    ('Favours & Gifts', 'edible-favours', 'Edible Favours', 'Chocolates, cookies, and edible gifts', 1, 1),
    ('Favours & Gifts', 'personalized-gifts', 'Personalized Gifts', 'Custom engraved and personalized items', 2, 1),
    ('Favours & Gifts', 'gift-baskets', 'Gift Baskets', 'Curated gift baskets', 3, 1),
    ('Favours & Gifts', 'welcome-bags', 'Welcome Bags', 'Guest welcome bags and amenities', 4, 1);
    PRINT 'Inserted Subcategories.';
END
ELSE
    PRINT 'Subcategories already has data.';
GO

PRINT '';
PRINT '========================================';
PRINT '=== FULL DEPLOYMENT COMPLETE ===';
PRINT '========================================';
GO
