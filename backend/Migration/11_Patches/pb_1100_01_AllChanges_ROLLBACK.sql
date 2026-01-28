/*
    ROLLBACK Script: All Session Changes
    Description: Reverts all database changes made in this session
    
    Changes to rollback:
    1. CategoryQuestions - Remove filter metadata columns
    2. VendorProfiles - Remove booking settings columns
    3. CategoryQuestions data - Restore original YesNo questions
    
    Run this script to undo all changes.
*/

SET NOCOUNT ON;
GO

PRINT '=== STARTING ROLLBACK OF ALL CHANGES ===';
GO

-- =============================================
-- 1. ROLLBACK CategoryQuestions DATA
-- =============================================
PRINT 'Step 1: Rolling back CategoryQuestions data...';
GO

-- First delete answers (foreign key constraint)
DELETE FROM [vendors].[VendorCategoryAnswers];
GO

-- Clear the new checkbox-style data
DELETE FROM [vendors].[CategoryQuestions];
GO

SET IDENTITY_INSERT [vendors].[CategoryQuestions] ON;

-- VENUE CATEGORY (Original YesNo format)
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (1, N'venue', N'Indoor venue?', N'YesNo', NULL, 1, 1, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (2, N'venue', N'Outdoor venue?', N'YesNo', NULL, 1, 2, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (3, N'venue', N'Wheelchair accessible?', N'YesNo', NULL, 1, 3, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (4, N'venue', N'On-site parking available?', N'YesNo', NULL, 1, 4, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (5, N'venue', N'Catering available on-site?', N'YesNo', NULL, 1, 5, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (6, N'venue', N'Alcohol service allowed?', N'YesNo', NULL, 1, 6, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (7, N'venue', N'Sound restrictions?', N'YesNo', NULL, 1, 7, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (8, N'venue', N'Décor restrictions?', N'YesNo', NULL, 1, 8, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (9, N'venue', N'Tables/chairs included?', N'YesNo', NULL, 1, 9, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (10, N'venue', N'AV equipment included?', N'YesNo', NULL, 1, 10, 1, GETDATE(), GETDATE());

-- MUSIC CATEGORY
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (11, N'music', N'DJ service available?', N'YesNo', NULL, 1, 1, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (12, N'music', N'Live music available?', N'YesNo', NULL, 1, 2, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (13, N'music', N'MC services included?', N'YesNo', NULL, 1, 3, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (14, N'music', N'Sound equipment provided?', N'YesNo', NULL, 1, 4, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (15, N'music', N'Lighting included?', N'YesNo', NULL, 1, 5, 1, GETDATE(), GETDATE());

-- PHOTO CATEGORY
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (16, N'photo', N'Photography services?', N'YesNo', NULL, 1, 1, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (17, N'photo', N'Videography services?', N'YesNo', NULL, 1, 2, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (18, N'photo', N'Drone coverage available?', N'YesNo', NULL, 1, 3, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (19, N'photo', N'Second shooter available?', N'YesNo', NULL, 1, 4, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (20, N'photo', N'Same-day edits available?', N'YesNo', NULL, 1, 5, 1, GETDATE(), GETDATE());

-- CATERING CATEGORY
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (21, N'catering', N'On-site catering?', N'YesNo', NULL, 1, 1, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (22, N'catering', N'Off-premise catering?', N'YesNo', NULL, 1, 2, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (23, N'catering', N'Kosher options available?', N'YesNo', NULL, 1, 3, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (24, N'catering', N'Halal options available?', N'YesNo', NULL, 1, 4, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (25, N'catering', N'Vegan options available?', N'YesNo', NULL, 1, 5, 1, GETDATE(), GETDATE());

-- DECOR CATEGORY
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (26, N'decor', N'Floral arrangements?', N'YesNo', NULL, 1, 1, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (27, N'decor', N'Centerpieces included?', N'YesNo', NULL, 1, 2, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (28, N'decor', N'Setup and breakdown included?', N'YesNo', NULL, 1, 3, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (29, N'decor', N'Rentals available?', N'YesNo', NULL, 1, 4, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (30, N'decor', N'Custom designs available?', N'YesNo', NULL, 1, 5, 1, GETDATE(), GETDATE());

-- BEAUTY CATEGORY
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (31, N'beauty', N'Bridal makeup?', N'YesNo', NULL, 1, 1, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (32, N'beauty', N'Bridal hair styling?', N'YesNo', NULL, 1, 2, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (33, N'beauty', N'Trial session included?', N'YesNo', NULL, 1, 3, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (34, N'beauty', N'On-location service?', N'YesNo', NULL, 1, 4, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (35, N'beauty', N'Bridesmaid services?', N'YesNo', NULL, 1, 5, 1, GETDATE(), GETDATE());

-- CAKE CATEGORY
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (36, N'cake', N'Custom cake designs?', N'YesNo', NULL, 1, 1, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (37, N'cake', N'Cupcakes available?', N'YesNo', NULL, 1, 2, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (38, N'cake', N'Gluten-free options?', N'YesNo', NULL, 1, 3, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (39, N'cake', N'Vegan options?', N'YesNo', NULL, 1, 4, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (40, N'cake', N'Delivery included?', N'YesNo', NULL, 1, 5, 1, GETDATE(), GETDATE());

-- PLANNER CATEGORY
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (41, N'planner', N'Full planning services?', N'YesNo', NULL, 1, 1, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (42, N'planner', N'Day-of coordination?', N'YesNo', NULL, 1, 2, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (43, N'planner', N'Vendor management?', N'YesNo', NULL, 1, 3, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (44, N'planner', N'Budget management?', N'YesNo', NULL, 1, 4, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (45, N'planner', N'Destination weddings?', N'YesNo', NULL, 1, 5, 1, GETDATE(), GETDATE());

-- TRANSPORT CATEGORY
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (46, N'transport', N'Limousine service?', N'YesNo', NULL, 1, 1, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (47, N'transport', N'Classic cars available?', N'YesNo', NULL, 1, 2, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (48, N'transport', N'Party bus available?', N'YesNo', NULL, 1, 3, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (49, N'transport', N'Shuttle service?', N'YesNo', NULL, 1, 4, 1, GETDATE(), GETDATE());
INSERT [vendors].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (50, N'transport', N'Chauffeur included?', N'YesNo', NULL, 1, 5, 1, GETDATE(), GETDATE());

SET IDENTITY_INSERT [vendors].[CategoryQuestions] OFF;
GO

PRINT 'CategoryQuestions data rolled back to 50 YesNo questions.';
GO

-- =============================================
-- 2. ROLLBACK CategoryQuestions SCHEMA
-- =============================================
PRINT 'Step 2: Rolling back CategoryQuestions schema changes...';
GO

-- Drop filter metadata columns if they exist
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[CategoryQuestions]') AND name = 'IsFilterable')
    ALTER TABLE [vendors].[CategoryQuestions] DROP CONSTRAINT IF EXISTS DF_CategoryQuestions_IsFilterable;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[CategoryQuestions]') AND name = 'IsFilterable')
    ALTER TABLE [vendors].[CategoryQuestions] DROP COLUMN [IsFilterable];

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[CategoryQuestions]') AND name = 'FilterType')
    ALTER TABLE [vendors].[CategoryQuestions] DROP COLUMN [FilterType];

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[CategoryQuestions]') AND name = 'FilterGroup')
    ALTER TABLE [vendors].[CategoryQuestions] DROP COLUMN [FilterGroup];

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[CategoryQuestions]') AND name = 'FilterLabel')
    ALTER TABLE [vendors].[CategoryQuestions] DROP COLUMN [FilterLabel];

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[CategoryQuestions]') AND name = 'CategoryID')
    ALTER TABLE [vendors].[CategoryQuestions] DROP COLUMN [CategoryID];
GO

PRINT 'CategoryQuestions schema rolled back.';
GO

-- =============================================
-- 3. ROLLBACK VendorProfiles SCHEMA
-- =============================================
PRINT 'Step 3: Rolling back VendorProfiles schema changes...';
GO

-- Drop booking settings columns if they exist
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND name = 'MinBookingHours')
    ALTER TABLE [vendors].[VendorProfiles] DROP COLUMN [MinBookingHours];

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND name = 'AdvanceNoticeHours')
    ALTER TABLE [vendors].[VendorProfiles] DROP COLUMN [AdvanceNoticeHours];

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND name = 'MaxCapacity')
    ALTER TABLE [vendors].[VendorProfiles] DROP COLUMN [MaxCapacity];

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND name = 'OffersHourlyRates')
BEGIN
    ALTER TABLE [vendors].[VendorProfiles] DROP CONSTRAINT IF EXISTS DF_VendorProfiles_OffersHourlyRates;
    ALTER TABLE [vendors].[VendorProfiles] DROP COLUMN [OffersHourlyRates];
END

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND name = 'InstantBookingEnabled')
BEGIN
    ALTER TABLE [vendors].[VendorProfiles] DROP CONSTRAINT IF EXISTS DF_VendorProfiles_InstantBookingEnabled;
    ALTER TABLE [vendors].[VendorProfiles] DROP COLUMN [InstantBookingEnabled];
END

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND name = 'MinBookingLeadTimeHours')
BEGIN
    ALTER TABLE [vendors].[VendorProfiles] DROP CONSTRAINT IF EXISTS DF_VendorProfiles_MinBookingLeadTimeHours;
    ALTER TABLE [vendors].[VendorProfiles] DROP COLUMN [MinBookingLeadTimeHours];
END

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND name = 'ServiceLocationScope')
BEGIN
    ALTER TABLE [vendors].[VendorProfiles] DROP CONSTRAINT IF EXISTS DF_VendorProfiles_ServiceLocationScope;
    ALTER TABLE [vendors].[VendorProfiles] DROP COLUMN [ServiceLocationScope];
END

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND name = 'YearsOfExperienceRange')
    ALTER TABLE [vendors].[VendorProfiles] DROP COLUMN [YearsOfExperienceRange];
GO

PRINT 'VendorProfiles schema rolled back.';
GO

PRINT '=== ROLLBACK COMPLETE ===';
GO
