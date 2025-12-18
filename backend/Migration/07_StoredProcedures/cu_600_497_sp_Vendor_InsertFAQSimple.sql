-- =============================================
-- Stored Procedure: sp_Vendor_InsertFAQSimple
-- Description: Inserts a FAQ for a vendor (simple version)
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_InsertFAQSimple]'))
    DROP PROCEDURE [dbo].[sp_Vendor_InsertFAQSimple];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_InsertFAQSimple]
    @VendorProfileID INT,
    @Question NVARCHAR(500),
    @Answer NVARCHAR(MAX),
    @DisplayOrder INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorFAQs (VendorProfileID, Question, Answer, DisplayOrder)
    VALUES (@VendorProfileID, @Question, @Answer, @DisplayOrder);
    
    SELECT SCOPE_IDENTITY() AS FAQID;
END
GO
