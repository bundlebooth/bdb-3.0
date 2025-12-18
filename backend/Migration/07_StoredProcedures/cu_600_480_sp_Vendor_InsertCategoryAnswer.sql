-- =============================================
-- Stored Procedure: vendors.sp_InsertCategoryAnswer
-- Description: Inserts a category answer for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_InsertCategoryAnswer]'))
    DROP PROCEDURE [vendors].[sp_InsertCategoryAnswer];
GO

CREATE PROCEDURE [vendors].[sp_InsertCategoryAnswer]
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
