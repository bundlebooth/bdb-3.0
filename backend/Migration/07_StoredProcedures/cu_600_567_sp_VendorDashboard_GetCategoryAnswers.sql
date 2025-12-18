-- =============================================
-- Stored Procedure: sp_VendorDashboard_GetCategoryAnswers
-- Description: Gets vendor category answers
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_GetCategoryAnswers]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_GetCategoryAnswers];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_GetCategoryAnswers]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT AnswerID, QuestionID, Answer, CreatedAt, UpdatedAt
    FROM VendorCategoryAnswers
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY AnswerID;
END
GO
