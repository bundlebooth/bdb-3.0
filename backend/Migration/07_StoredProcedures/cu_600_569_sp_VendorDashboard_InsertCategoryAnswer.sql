-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_InsertCategoryAnswer
-- Description: Inserts a category answer
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_InsertCategoryAnswer]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_InsertCategoryAnswer];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_InsertCategoryAnswer]
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
