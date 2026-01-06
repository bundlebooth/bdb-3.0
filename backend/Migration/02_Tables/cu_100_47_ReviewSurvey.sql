/*
    Migration Script: Add Survey Fields to Reviews Table
    Phase: 100 - Tables (Alter)
    Script: cu_100_47_ReviewSurvey.sql
    Description: Adds survey fields to the [vendors].[Reviews] table for detailed feedback
    
    Execution Order: 47
*/

SET NOCOUNT ON;
GO

PRINT 'Adding survey fields to [vendors].[Reviews] table...';
GO

-- Add survey fields if they don't exist
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[Reviews]') AND name = 'QualityRating')
BEGIN
    ALTER TABLE [vendors].[Reviews] ADD [QualityRating] [tinyint] NULL;
    PRINT 'Added QualityRating column';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[Reviews]') AND name = 'CommunicationRating')
BEGIN
    ALTER TABLE [vendors].[Reviews] ADD [CommunicationRating] [tinyint] NULL;
    PRINT 'Added CommunicationRating column';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[Reviews]') AND name = 'ValueRating')
BEGIN
    ALTER TABLE [vendors].[Reviews] ADD [ValueRating] [tinyint] NULL;
    PRINT 'Added ValueRating column';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[Reviews]') AND name = 'PunctualityRating')
BEGIN
    ALTER TABLE [vendors].[Reviews] ADD [PunctualityRating] [tinyint] NULL;
    PRINT 'Added PunctualityRating column';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[Reviews]') AND name = 'ProfessionalismRating')
BEGIN
    ALTER TABLE [vendors].[Reviews] ADD [ProfessionalismRating] [tinyint] NULL;
    PRINT 'Added ProfessionalismRating column';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[Reviews]') AND name = 'WouldRecommend')
BEGIN
    ALTER TABLE [vendors].[Reviews] ADD [WouldRecommend] [bit] NULL;
    PRINT 'Added WouldRecommend column';
END
GO

PRINT 'Survey fields added to [vendors].[Reviews] table successfully.';
GO
