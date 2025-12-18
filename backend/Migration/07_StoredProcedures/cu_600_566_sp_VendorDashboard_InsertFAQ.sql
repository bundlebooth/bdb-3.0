-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_InsertFAQ
-- Description: Inserts a FAQ
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_InsertFAQ]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_InsertFAQ];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_InsertFAQ]
    @VendorProfileID INT,
    @Question NVARCHAR(500),
    @Answer NVARCHAR(MAX),
    @AnswerType NVARCHAR(50),
    @AnswerOptions NVARCHAR(MAX),
    @DisplayOrder INT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorFAQs (VendorProfileID, Question, Answer, AnswerType, AnswerOptions, DisplayOrder, IsActive, CreatedAt, UpdatedAt)
    VALUES (@VendorProfileID, @Question, @Answer, @AnswerType, @AnswerOptions, @DisplayOrder, 1, GETDATE(), GETDATE());
    
    SELECT SCOPE_IDENTITY() AS FAQID;
END
GO
