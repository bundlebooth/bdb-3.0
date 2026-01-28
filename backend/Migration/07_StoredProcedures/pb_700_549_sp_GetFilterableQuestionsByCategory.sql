/*
    Migration Script: Create Stored Procedure [sp_GetFilterableQuestionsByCategory]
    Phase: 700 - Stored Procedures
    Script: pb_700_549_sp_GetFilterableQuestionsByCategory.sql
    Description: Gets filterable category questions for the filter modal
    
    Execution Order: 549
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [admin].[sp_GetFilterableQuestionsByCategory]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetFilterableQuestionsByCategory]'))
    DROP PROCEDURE [admin].[sp_GetFilterableQuestionsByCategory];
GO

CREATE PROCEDURE [admin].[sp_GetFilterableQuestionsByCategory]
    @Category NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        QuestionID,
        Category,
        QuestionText,
        QuestionType,
        Options,
        IsRequired,
        DisplayOrder,
        IsFilterable,
        FilterType,
        COALESCE(FilterLabel, QuestionText) AS FilterLabel
    FROM [admin].[CategoryQuestions]
    WHERE IsActive = 1
      AND IsFilterable = 1
      AND (@Category IS NULL OR Category = @Category)
    ORDER BY Category, DisplayOrder ASC;
END;
GO

PRINT 'Stored procedure [admin].[sp_GetFilterableQuestionsByCategory] created successfully.';
GO
