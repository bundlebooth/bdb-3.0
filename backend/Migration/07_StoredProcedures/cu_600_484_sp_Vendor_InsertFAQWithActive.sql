-- =============================================
-- Stored Procedure: vendors.sp_InsertFAQWithActive
-- Description: Inserts a FAQ with IsActive flag
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_InsertFAQWithActive]'))
    DROP PROCEDURE [vendors].[sp_InsertFAQWithActive];
GO

CREATE PROCEDURE [vendors].[sp_InsertFAQWithActive]
    @VendorProfileID INT,
    @Question NVARCHAR(500),
    @Answer NVARCHAR(MAX),
    @AnswerType NVARCHAR(50) = 'text',
    @AnswerOptions NVARCHAR(MAX) = NULL,
    @DisplayOrder INT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorFAQs (VendorProfileID, Question, Answer, AnswerType, AnswerOptions, DisplayOrder, IsActive, CreatedAt, UpdatedAt)
    VALUES (@VendorProfileID, @Question, @Answer, @AnswerType, @AnswerOptions, @DisplayOrder, 1, GETUTCDATE(), GETUTCDATE());
    
    SELECT SCOPE_IDENTITY() AS FAQID;
END
GO
