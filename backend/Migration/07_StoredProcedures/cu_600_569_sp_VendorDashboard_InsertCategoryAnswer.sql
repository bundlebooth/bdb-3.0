-- =============================================
-- Stored Procedure: sp_VendorDashboard_InsertCategoryAnswer
-- Description: Inserts a category answer
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_InsertCategoryAnswer]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_InsertCategoryAnswer];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_InsertCategoryAnswer]
    @VendorProfileID INT,
    @QuestionID INT,
    @Answer NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorCategoryAnswers (VendorProfileID, QuestionID, Answer, CreatedAt, UpdatedAt)
    VALUES (@VendorProfileID, @QuestionID, @Answer, GETDATE(), GETDATE());
    
    SELECT SCOPE_IDENTITY() AS AnswerID;
END
GO
