/*
    Migration Script: Create Stored Procedure [sp_GetFilterableQuestions]
    Phase: 700 - Stored Procedures
    Script: pb_700_540_sp_GetFilterableQuestions.sql
    Description: Gets filterable category questions for the filter modal
    
    Execution Order: 540
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [admin].[sp_GetFilterableQuestions]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetFilterableQuestions]'))
    DROP PROCEDURE [admin].[sp_GetFilterableQuestions];
GO

CREATE PROCEDURE [admin].[sp_GetFilterableQuestions]
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
        FilterGroup,
        FilterLabel
    FROM [admin].[CategoryQuestions]
    WHERE IsActive = 1
      AND IsFilterable = 1
      AND (@Category IS NULL OR Category = @Category)
    ORDER BY Category, DisplayOrder ASC;
END;
GO

PRINT 'Stored procedure [admin].[sp_GetFilterableQuestions] created successfully.';
GO
