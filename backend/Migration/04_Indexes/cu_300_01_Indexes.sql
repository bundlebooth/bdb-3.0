/*
    Migration Script: Indexes and Unique Constraints
    Phase: 300 - Indexes
    Script: cu_300_01_Indexes.sql
    Description: Adds all indexes and unique constraints to tables
    
    Execution Order: 1
*/

SET NOCOUNT ON;
GO

PRINT 'Adding indexes and unique constraints...';
GO
-- Index/Constraint 1 for [PredefinedServices]
ALTER TABLE [admin].[PredefinedServices] ADD  CONSTRAINT [UC_CategoryService] UNIQUE NONCLUSTERED 
(
	[Category] ASC,
	[ServiceName] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO

-- Index/Constraint 2 for [VendorFeatures]
ALTER TABLE [vendors].[VendorFeatures] ADD  CONSTRAINT [UC_CategoryFeature] UNIQUE NONCLUSTERED 
(
	[CategoryID] ASC,
	[FeatureName] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO

-- Index/Constraint 3 for [VendorCategories]
ALTER TABLE [vendors].[VendorCategories] ADD  CONSTRAINT [UC_VendorCategory] UNIQUE NONCLUSTERED 
(
	[VendorProfileID] ASC,
	[Category] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO

-- Index/Constraint 4 for [VendorBusinessHours]
ALTER TABLE [vendors].[VendorBusinessHours] ADD  CONSTRAINT [UC_VendorDay] UNIQUE NONCLUSTERED 
(
	[VendorProfileID] ASC,
	[DayOfWeek] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO

-- Index/Constraint 5 for [VendorSelectedFeatures]
ALTER TABLE [vendors].[VendorSelectedFeatures] ADD  CONSTRAINT [UC_VendorFeature] UNIQUE NONCLUSTERED 
(
	[VendorProfileID] ASC,
	[FeatureID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO

-- Index/Constraint 6 for [VendorSelectedServices]
ALTER TABLE [vendors].[VendorSelectedServices] ADD  CONSTRAINT [UC_VendorService] UNIQUE NONCLUSTERED 
(
	[VendorProfileID] ASC,
	[PredefinedServiceID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO

-- Index/Constraint 7 for [VendorCategoryAnswers]
ALTER TABLE [vendors].[VendorCategoryAnswers] ADD  CONSTRAINT [UC_VendorCategoryAnswer] UNIQUE NONCLUSTERED 
(
	[VendorProfileID] ASC,
	[QuestionID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO

-- Index/Constraint 8 for [Favorites]
ALTER TABLE [users].[Favorites] ADD  CONSTRAINT [UC_Favorite] UNIQUE NONCLUSTERED 
(
	[UserID] ASC,
	[VendorProfileID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO

PRINT 'Indexes and unique constraints added successfully.';
GO

