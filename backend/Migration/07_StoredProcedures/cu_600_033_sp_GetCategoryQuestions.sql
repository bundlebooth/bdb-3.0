/*
    Migration Script: Create Stored Procedure [sp_GetCategoryQuestions]
    Phase: 600 - Stored Procedures
    Script: cu_600_033_dbo.sp_GetCategoryQuestions.sql
    Description: Creates the [dbo].[sp_GetCategoryQuestions] stored procedure
    
    Execution Order: 33
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetCategoryQuestions]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetCategoryQuestions]'))
    DROP PROCEDURE [dbo].[sp_GetCategoryQuestions];
GO

CREATE   PROCEDURE [dbo].[sp_GetCategoryQuestions]
    @Category NVARCHAR(50)
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
        DisplayOrder
    FROM CategoryQuestions 
    WHERE Category = @Category AND IsActive = 1
    ORDER BY DisplayOrder ASC;
END;

GO

PRINT 'Stored procedure [dbo].[sp_GetCategoryQuestions] created successfully.';
GO
