-- =============================================
-- Stored Procedure: sp_Vendor_InsertFAQExtended
-- Description: Inserts a FAQ with extended fields for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_InsertFAQExtended]'))
    DROP PROCEDURE [dbo].[sp_Vendor_InsertFAQExtended];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_InsertFAQExtended]
    @VendorProfileID INT,
    @Question NVARCHAR(500),
    @Answer NVARCHAR(MAX),
    @AnswerType NVARCHAR(50) = 'text',
    @AnswerOptions NVARCHAR(MAX) = NULL,
    @DisplayOrder INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorFAQs (VendorProfileID, Question, Answer, AnswerType, AnswerOptions, DisplayOrder)
    VALUES (@VendorProfileID, @Question, @Answer, @AnswerType, @AnswerOptions, @DisplayOrder);
    
    SELECT SCOPE_IDENTITY() AS FAQID;
END
GO
