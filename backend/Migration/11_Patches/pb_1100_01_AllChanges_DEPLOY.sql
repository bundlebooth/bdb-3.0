/*
    DEPLOY Script: All Session Changes
    Description: Deploys all database changes made in this session
    
    Changes to deploy:
    1. CategoryQuestions - Add filter metadata columns
    2. VendorProfiles - Add booking settings columns
    3. CategoryQuestions data - New checkbox-style service options
*/

SET NOCOUNT ON;
GO

PRINT '=== STARTING DEPLOYMENT OF ALL CHANGES ===';
GO

-- =============================================
-- 1. ADD CategoryQuestions SCHEMA CHANGES
-- =============================================
PRINT 'Step 1: Adding CategoryQuestions schema changes...';
GO

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

PRINT 'CategoryQuestions schema updated.';
GO

-- =============================================
-- 2. ADD VendorProfiles SCHEMA CHANGES
-- =============================================
PRINT 'Step 2: Adding VendorProfiles schema changes...';
GO

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

PRINT 'VendorProfiles schema updated.';
GO

PRINT '=== DEPLOYMENT COMPLETE ===';
GO
